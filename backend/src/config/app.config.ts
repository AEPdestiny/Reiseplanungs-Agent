import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

loadLocalEnv();

export const appConfig = {
  port: 3000,
  apiPrefix: "api",
  openai: {
    apiKey: readEnv("OPENAI_API_KEY"),
    model: readEnv("OPENAI_MODEL") || "gpt-5"
  },
  gemini: {
    chatEnabled: readEnv("GEMINI_CHAT_ENABLED").toLowerCase() === "true",
    apiKey: readEnv("GEMINI_API_KEY"),
    model: readEnv("GEMINI_MODEL") || "gemini-flash-latest",
    dailyRequestLimit: parseDailyRequestLimit(readEnv("GEMINI_DAILY_REQUEST_LIMIT"))
  }
} as const;

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function parseDailyRequestLimit(value: string): number {
  if (!value) {
    return 1500;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? Math.floor(parsedValue) : 1500;
}

function loadLocalEnv(): void {
  const envPath = [join(process.cwd(), ".env"), join(process.cwd(), "..", ".env")].find((candidate) => existsSync(candidate));

  if (!envPath) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
