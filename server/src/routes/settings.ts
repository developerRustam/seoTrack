import { Router } from "express";

import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getSingleParam } from "../lib/http.js";
import { serializeProject } from "../lib/projectSerializer.js";
import { isValidHttpUrl } from "../lib/validators.js";
import { CHECK_FREQUENCIES, type CheckFrequencyEnum } from "../types/frequency.js";

export const settingsRouter = Router();

settingsRouter.patch("/projects/:id/settings", requireAuth, async (req, res) => {
    const id = getSingleParam(req.params.id);
    const { name: rawName, url: rawUrl, checkFrequency } = req.body as {
      name?: string;
      url?: string;
      checkFrequency?: CheckFrequencyEnum;
    };
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";

    if (!id || !name || !url || !checkFrequency) {
      return res.status(400).json({ error: "name, url, checkFrequency are required" });
    }
    if (!CHECK_FREQUENCIES.includes(checkFrequency)) {
      return res.status(400).json({ error: "Invalid checkFrequency value" });
    }
    if (name.length < 3) {
      return res.status(400).json({ error: "Name must be longer than 3 characters" });
    }
    if (!isValidHttpUrl(url)) {
      return res.status(400).json({
        error: "Project URL must be a valid http/https URL",
      });
    }
    const project = await prisma.project.findFirst({ where: { id, userId: req.user!.id } });
    if (!project) return res.status(404).json({ error: "Project not found" });
  
    const updated = await prisma.project.update({
      where: { id },
      data: { name, url, checkFrequency },
    });
  
    return res.json(serializeProject(updated));
  });