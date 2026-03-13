import { Router } from "express";

import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const incidentsRouter = Router(); 
incidentsRouter.get("/incidents", requireAuth, async (req, res) => {
    try {
      const projects = await prisma.project.findMany({
        where: { userId: req.user!.id },
        select: { id: true },
      });
  
      const projectIds = projects.map((p: { id: string }) => p.id);
      if (projectIds.length === 0) return res.json([]);
  
      const incidents = await prisma.incident.findMany({
        where: {
          projectId: { in: projectIds },
        },
        orderBy: [{ createdAt: "desc" }],
      });
  
      const priority = (lvl: string) => (lvl === "critical" ? 2 : 1);
  
      incidents.sort((a: { level: string; createdAt: Date }, b: { level: string; createdAt: Date }) => {
        return priority(b.level) - priority(a.level) || +new Date(b.createdAt) - +new Date(a.createdAt);
      });
  
      res.json(
        incidents.map((i: {
          id: string;
          projectId: string | null;
          projectName: string;
          metric: string;
          level: string;
          timeText: string;
          createdAt: Date;
        }) => ({
          id: i.id,
          projectId: i.projectId,
          projectName: i.projectName,
          metric: i.metric,
          level: i.level,
          timeText: i.timeText,
          createdAt: i.createdAt,
        }))
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to load incidents" });
    }
  });