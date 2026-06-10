const ENV_ALIASES: Record<string, string[]> = {
  DATABASE_URL: [
    "DATABASE_URL",
    "questionaire_PRISMA_DATABASE_URL",
    "questionaire_DATABASE_URL",
    "questionaire_POSTGRES_URL",
    "PRISMA_DATABASE_URL",
    "POSTGRES_URL",
  ],
  RESEND_API_KEY: ["RESEND_API_KEY", "questionaire_RESEND_API_KEY"],
  RESEND_FROM_EMAIL: ["RESEND_FROM_EMAIL", "questionaire_RESEND_FROM_EMAIL"],
  SUBMISSION_EMAIL_TO: ["SUBMISSION_EMAIL_TO", "questionaire_SUBMISSION_EMAIL_TO"],
};

export function getServerEnv(name: keyof typeof ENV_ALIASES) {
  for (const key of ENV_ALIASES[name]) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

export function ensureDatabaseUrl() {
  const databaseUrl = getServerEnv("DATABASE_URL");
  if (databaseUrl && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
  }
  return databaseUrl;
}
