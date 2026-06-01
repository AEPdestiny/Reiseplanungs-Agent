export const appConfig = {
  port: 3000,
  apiPrefix: "api",
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? "gpt-5"
  }
} as const;
