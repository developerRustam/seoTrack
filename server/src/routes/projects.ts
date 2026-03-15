import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { serializeProject } from "../lib/projectSerializer.js";
import { getSingleParam } from "../lib/http.js";
import {isValidHttpUrl } from "../lib/validators.js";

export const projectRouter = Router();
projectRouter.post("/projects", requireAuth, async (req, res) => {
    const { name: rawName, url: rawUrl } = req.body as {
      name?: string;
      url?: string;
    };

    const name = typeof rawName === "string" ? rawName.trim() : "";
    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }
    if (!url) {
      return res.status(400).json({ error: "Project URL is required" });
    }
    if (name.length < 3) {
      return res.status(400).json({ error: "Name must be longer than 3 characters" });
    }
    if (!isValidHttpUrl(url)) {
      return res.status(400).json({
        error: "Project URL must be a valid http/https URL",
      });
    }
  
    try {
      const project = await prisma.project.create({
        data: { userId: req.user!.id, name, url },
      });
  
      return res.status(201).json(serializeProject(project));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  projectRouter.get("/projects", requireAuth, async (req, res) => {
    try {
      const projects = await prisma.project.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
      });
  
      return res.json(projects.map((project: {
        id: string;
        name: string;
        url: string;
        description: string | null;
        alerts: number;
        lastIncidentAt: Date | null;
        metrics: unknown;
        additionalPages: unknown;
        checkFrequency: string;
        userId: string;
        createdAt: Date;
      }) => serializeProject(project)));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal error" });
    }
  });
  projectRouter.get("/projects/:id", requireAuth, async (req, res) => {
    const id = getSingleParam(req.params.id);
    if (!id) return res.status(400).json({ error: "project id is required" });
  
    try {
      const project = await prisma.project.findFirst({
        where: { id, userId: req.user!.id },
        include: {
          user: true,
        },
      });
  
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
  
      return res.json(serializeProject(project));
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal error" });
    }
  });
  