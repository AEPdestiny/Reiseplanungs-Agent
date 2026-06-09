import { Injectable } from "@nestjs/common";
import { appConfig } from "../../config/app.config";

export interface GeminiChatInput {
  userMessage: string;
  tripSummary: string;
}

@Injectable()
export class GeminiChatService {
  async generateTripAnswer(input: GeminiChatInput): Promise<string | null> {
    if (!appConfig.gemini.chatEnabled || !appConfig.gemini.apiKey) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(this.createGeminiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: this.createPrompt(input) }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as GeminiResponsePayload;
      return this.extractText(payload);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private createGeminiUrl(): string {
    const model = encodeURIComponent(appConfig.gemini.model);
    const apiKey = encodeURIComponent(appConfig.gemini.apiKey ?? "");
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  }

  private createPrompt(input: GeminiChatInput): string {
    return [
      "Du bist ein Chat-Assistent fuer ein Reiseplanungs-Dashboard.",
      "Antworte kurz, hilfreich und auf Deutsch.",
      "Nutze nur den bereitgestellten Trip-Kontext.",
      "Veraendere den Plan nicht, akzeptiere keine Proposals, berechne Budget nicht final neu und behaupte keine Buchungen.",
      "",
      "Trip-Kontext:",
      input.tripSummary,
      "",
      "Nutzerfrage:",
      input.userMessage
    ].join("\n");
  }

  private extractText(payload: GeminiResponsePayload): string | null {
    const text =
      payload.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text)
        .filter((part): part is string => typeof part === "string")
        .join("\n")
        .trim() ?? "";

    return text || null;
  }
}

interface GeminiResponsePayload {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}
