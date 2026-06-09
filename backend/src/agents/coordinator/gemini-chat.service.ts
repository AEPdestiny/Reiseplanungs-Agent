import { Injectable } from "@nestjs/common";
import { appConfig } from "../../config/app.config";

export interface GeminiChatInput {
  userMessage: string;
  tripSummary: string;
}

export interface GeminiChatResult {
  message: string | null;
  status: "disabled" | "missing_key" | "quota_reached" | "success" | "http_error" | "no_text" | "error";
  detail?: string;
}

interface GeminiAttemptResult extends GeminiChatResult {
  retryable: boolean;
}

@Injectable()
export class GeminiChatService {
  private quotaDate = "";
  private requestCount = 0;

  async generateTripAnswer(input: GeminiChatInput): Promise<GeminiChatResult> {
    if (!appConfig.gemini.chatEnabled) {
      return {
        message: null,
        status: "disabled"
      };
    }

    if (!appConfig.gemini.apiKey) {
      return {
        message: null,
        status: "missing_key"
      };
    }

    let lastFailure: GeminiChatResult | null = null;
    const modelCandidates = this.createModelCandidates();

    for (const model of modelCandidates) {
      const attemptsForModel = model === appConfig.gemini.model ? 2 : 1;

      for (let attempt = 1; attempt <= attemptsForModel; attempt += 1) {
        if (!this.canAttemptGeminiRequest()) {
          return lastFailure ?? {
            message: null,
            status: "quota_reached"
          };
        }

        const result = await this.requestGemini(input, model);

        if (result.status === "success") {
          return result;
        }

        lastFailure = {
          message: result.message,
          status: result.status,
          detail: result.detail
        };

        if (!result.retryable) {
          break;
        }

        if (attempt < attemptsForModel) {
          await this.waitBeforeRetry();
        }
      }
    }

    return lastFailure ?? {
      message: null,
      status: "error",
      detail: "Gemini konnte nicht aufgerufen werden."
    };
  }

  private async requestGemini(input: GeminiChatInput, model: string): Promise<GeminiAttemptResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      this.incrementRequestCount();
      const response = await fetch(this.createGeminiUrl(model), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(this.createRequestBody(input)),
        signal: controller.signal
      });

      if (!response.ok) {
        return {
          message: null,
          status: "http_error",
          detail: `HTTP ${response.status}; Modell=${model}`,
          retryable: this.isRetryableHttpStatus(response.status)
        };
      }

      const payload = (await response.json()) as GeminiResponsePayload;
      const message = this.extractText(payload);

      return message
        ? {
            message,
            status: "success",
            retryable: false
          }
        : {
            message: null,
            status: "no_text",
            detail: `Modell=${model}`,
            retryable: false
          };
    } catch (error) {
      const errorName = error instanceof Error ? error.name : "unknown";

      return {
        message: null,
        status: "error",
        detail: errorName,
        retryable: errorName === "AbortError" || errorName === "TypeError"
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private createGeminiUrl(modelName: string): string {
    const model = encodeURIComponent(modelName);
    const apiKey = encodeURIComponent(appConfig.gemini.apiKey ?? "");
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  }

  private createRequestBody(input: GeminiChatInput): object {
    return {
      contents: [
        {
          role: "user",
          parts: [{ text: this.createPrompt(input) }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 900
      }
    };
  }

  private createModelCandidates(): string[] {
    const configuredModel = appConfig.gemini.model;
    const models = [configuredModel];

    if (configuredModel === "gemini-flash-latest") {
      models.push("gemini-2.5-flash");
    }

    return [...new Set(models)];
  }

  private isRetryableHttpStatus(status: number): boolean {
    return [429, 500, 502, 503, 504].includes(status);
  }

  private async waitBeforeRetry(): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
  }

  private canAttemptGeminiRequest(): boolean {
    this.resetQuotaIfNeeded();
    return this.requestCount < appConfig.gemini.dailyRequestLimit;
  }

  private incrementRequestCount(): void {
    this.resetQuotaIfNeeded();
    this.requestCount += 1;
  }

  private resetQuotaIfNeeded(): void {
    const today = new Date().toISOString().slice(0, 10);

    if (this.quotaDate !== today) {
      this.quotaDate = today;
      this.requestCount = 0;
    }
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
