import { Router } from "express";
import bcrypt from "bcryptjs";
import { getUserFromRequest } from "../middleware/requireAuth.js";
import { SESSION_COOKIE, sessionCookieOptions } from "../app/config.js";
import { prisma } from "../db/prisma.js";
import { isValidEmail } from "../lib/validators.js";
import { setSessionCookie } from "../lib/session.js";

export const authRouter = Router();

  
  
authRouter.post("/auth/register", async (req, res) => {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };
  
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Name is required", code: "VALIDATION" });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email", code: "VALIDATION" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password too short", code: "VALIDATION" });
    }
  
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return res.status(409).json({ error: "Email taken", code: "EMAIL_TAKEN" });
      }
  
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email: normalizedEmail, name: name.trim(), passwordHash },
      });
  
      setSessionCookie(res, { userId: user.id, email: user.email });
      return res.json({ id: user.id, email: user.email, name: user.name });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  authRouter.post("/auth/login", async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required", code: "VALIDATION" });
    }
  
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      }
  
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      }
  
      setSessionCookie(res, { userId: user.id, email: user.email });
      return res.json({ id: user.id, email: user.email, name: user.name });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  authRouter.post("/auth/logout", (_req, res) => {
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions);
    res.json({ ok: true });
  });
  
  authRouter.get("/auth/me", async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: "Unauthorized", code: "NO_SESSION" });
    return res.json(user);
  });