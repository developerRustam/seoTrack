import { Router } from "express";

import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getSingleParam } from "../lib/http.js";
import { serializeProject } from "../lib/projectSerializer.js";

export const settingsRouter = Router();

settingsRouter.patch("/projects/:id/settings", requireAuth, async (req, res) => {
    const id = getSingleParam(req.params.id);
    const { name, url, checkFrequency } = req.body as {
      name?: string;
      url?: string;
      checkFrequency?: "HOURLY" | "EVERY_6_HOURS" | "EVERY_12_HOURS" | "DAILY" | "WEEKLY" | "MONTHLY";
    };
    
    if (!id || !name || !url || !checkFrequency) {
      return res.status(400).json({ error: "name, url, checkFrequency are required" });
    }
  
    const project = await prisma.project.findFirst({ where: { id, userId: req.user!.id } });
    if (!project) return res.status(404).json({ error: "Project not found" });
  
    const updated = await prisma.project.update({
      where: { id },
      data: { name, url, checkFrequency },
    });
  
    return res.json(serializeProject(updated));
  });