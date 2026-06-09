export const appConfig = {
  port: 3000,
  apiPrefix: "api",
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? "gpt-5"
  },
  gemini: {
    chatEnabled: process.env.GEMINI_CHAT_ENABLED === "true",
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-flash-latest"
  }
} as const;
