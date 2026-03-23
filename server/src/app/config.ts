export const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);


function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getJwtSecret(): string {
  const value = getRequiredEnv("JWT_SECRET");

  if (value.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  return value;
}

export const IS_PROD = process.env.NODE_ENV === "production";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: (IS_PROD ? "none" : "lax") as "none" | "lax",
  secure: IS_PROD,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: "/",
};

export const SESSION_COOKIE = "pm_session";
export const JWT_SECRET = getJwtSecret();
export const SESSION_TTL = "7d";
export const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY?.trim() ?? "";
export const PAGESPEED_TIMEOUT_MS = Number(process.env.PAGESPEED_TIMEOUT_MS ?? 45000);
export const CHECK_RUN_STALE_MS = Number(process.env.CHECK_RUN_STALE_MS ?? 10 * 60 * 1000);
export const PORT = Number(process.env.PORT ?? 4000);
