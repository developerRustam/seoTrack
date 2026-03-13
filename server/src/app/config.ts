export const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

  
export  const IS_PROD = process.env.NODE_ENV === "production";

export const sessionCookieOptions = {
    httpOnly: true,
    sameSite: (IS_PROD ? "none" : "lax") as "none" | "lax",
    secure: IS_PROD,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: "/",
  };

export const SESSION_COOKIE = "pm_session";
export const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret";
export const SESSION_TTL = "7d";
export const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY ?? "";
export const PORT = Number(process.env.PORT ?? 4000);
