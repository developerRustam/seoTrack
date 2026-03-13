import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { SESSION_COOKIE, JWT_SECRET } from '../app/config.js';
import type { AuthTokenPayload, AuthUser } from '../types/auth.js';

export async function getUserFromRequest(req: express.Request): Promise<AuthUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name };
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized", code: "NO_SESSION" });
  req.user = user;
  next();
}