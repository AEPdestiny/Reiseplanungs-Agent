import { Injectable } from "@nestjs/common";
import { appConfig } from "../../config/app.config";

@Injectable()
export class OpenAiService {
  private readonly responsesApiUrl = "https://api.openai.com/v1/responses";
  private readonly fallbackMessage =
    "Ich kann den Reiseplan anhand der vorhandenen strukturierten Daten erklaeren. Fuer diese Demo wurden die Aktivitaeten nach Interessen, Wettertauglichkeit, Budget und Lage ausgewaehlt.";

  async generateAssistantMessage(input: {
    userMessage: string;
    tripSummary: string;
    requiresProposalNotice: boolean;
  }): Promise<{ message: string; usedFallback: boolean }> {
    const apiKey = appConfig.openai.apiKey;

    if (!apiKey) {
      return {
        message: this.createFallbackMessage(input.requiresProposalNotice),
        usedFallback: true
      };
    }

    try {
      const prompt = this.buildAssistantPrompt(input);
      const response = await this.createResponse(apiKey, prompt);

      return {
        message: response || this.createFallbackMessage(input.requiresProposalNotice),
        usedFallback: !response
      };
    } catch {
      return {
        message: this.createFallbackMessage(input.requiresProposalNotice),
        usedFallback: true
      };
    }
  }

  async generateStructuredRecommendationReasoning(input: {
    activityNames: string[];
    interests: string[];
  }): Promise<{ reasoning: string; usedFallback: boolean }> {
    const apiKey = appConfig.openai.apiKey;

    if (!apiKey) {
      return {
        reasoning: "Die Empfehlungen wurden anhand von Interessen, Wettertauglichkeit, Budget und Lage priorisiert.",
        usedFallback: true
      };
    }

    try {
      const prompt = [
        "Erklaere kurz und strukturiert, warum diese Reiseaktivitaeten passend sind.",
        `Aktivitaeten: ${input.activityNames.join(", ")}`,
        `Interessen: ${input.interests.join(", ")}`
      ].join("\n");
      const response = await this.createResponse(apiKey, prompt);

      return {
        reasoning: response || "Die Empfehlungen wurden anhand von Interessen, Wettertauglichkeit, Budget und Lage priorisiert.",
        usedFallback: !response
      };
    } catch {
      return {
        reasoning: "Die Empfehlungen wurden anhand von Interessen, Wettertauglichkeit, Budget und Lage priorisiert.",
        usedFallback: true
      };
    }
  }

  private async createResponse(apiKey: string, input: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(this.responsesApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: appConfig.openai.model,
          input,
          max_output_tokens: 500
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        return "";
      }

      const data = (await response.json()) as OpenAiResponsePayload;
      return this.extractText(data);
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildAssistantPrompt(input: {
    userMessage: string;
    tripSummary: string;
    requiresProposalNotice: boolean;
  }): string {
    return [
      "Du bist der Assistent eines Reiseplanungs-Dashboards.",
      "Antworte kurz, hilfreich und auf Deutsch.",
      "Fuehre keine Planmutation aus und bestaetige keine Vorschlaege automatisch.",
      input.requiresProposalNotice
        ? "Wenn der Nutzer eine Aenderung wuenscht, erklaere, dass Aenderungen als Proposal vorgeschlagen und vom Nutzer bestaetigt werden muessen."
        : "Beantworte Fragen anhand des vorhandenen Reiseplans.",
      "",
      "Reisekontext:",
      input.tripSummary,
      "",
      "Nutzernachricht:",
      input.userMessage
    ].join("\n");
  }

  private createFallbackMessage(requiresProposalNotice: boolean): string {
    return requiresProposalNotice
      ? `${this.fallbackMessage} Aenderungswuensche werden nicht automatisch uebernommen, sondern muessen als Vorschlag bestaetigt werden.`
      : this.fallbackMessage;
  }

  private extractText(payload: OpenAiResponsePayload): string {
    if (typeof payload.output_text === "string") {
      return payload.output_text.trim();
    }

    const textParts =
      payload.output
        ?.flatMap((item) => item.content ?? [])
        .map((content) => content.text)
        .filter((text): text is string => typeof text === "string") ?? [];

    return textParts.join("\n").trim();
  }
}

interface OpenAiResponsePayload {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
}
