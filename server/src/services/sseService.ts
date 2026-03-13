
import type express from "express";

export const sseClients = new Map<string, Set<express.Response>>();

export function publishSse(projectId: string, payload: unknown) {
    const clients = sseClients.get(projectId);
    if (!clients) return;
    const data = `event: check-run\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of clients) {
      res.write(data);
    }
  }