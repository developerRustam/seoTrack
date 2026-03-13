import { JWT_SECRET, SESSION_COOKIE, SESSION_TTL, sessionCookieOptions } from "../app/config.js";
import type express from "express";
import jwt from "jsonwebtoken";


import type { AuthTokenPayload } from "../types/auth.js";

export function setSessionCookie(res: express.Response, payload: AuthTokenPayload) {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_TTL });
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions);
  }
