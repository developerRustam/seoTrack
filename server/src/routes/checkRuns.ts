import { Router } from "express";
import type express from "express";

import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getSingleParam } from "../lib/http.js";
import { enqueueCheckRun } from "../services/checkRunService.js";
import { normalizeAdditionalPages, normalizeMetricsSnapshot, normalizeScripts, type NormalizedCheckRun, type PageScript } from "../lib/projectNormalization.js";
import { sseClients } from "../services/sseService.js";

export const checkRunsRouter = Router();

checkRunsRouter.post("/projects/:id/check-runs", requireAuth, async (req, res) => {
    const id = getSingleParam(req.params.id);
    if (!id) return res.status(400).json({ error: "project id is required" });
  
    try {
      const project = await prisma.project.findFirst({
        where: { id, userId: req.user!.id },
      });
      if (!project) return res.status(404).json({ error: "Project not found" });
  
      const run = await enqueueCheckRun({
        id: project.id,
        url: project.url,
        additionalPages: project.additionalPages,
      });
      res.status(202).json({ ok: true, runId: run.id });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal error" });
    }
  });
  
  
  checkRunsRouter.get("/projects/:id/check-runs/stream", requireAuth, async (req, res) => {
    const id = getSingleParam(req.params.id);
    if (!id) return res.status(400).end();
  
    const project = await prisma.project.findFirst({
      where: { id, userId: req.user!.id },
      select: { id: true },
    });
    if (!project) return res.status(404).end();
  
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
  
    const set = sseClients.get(id) ?? new Set<express.Response>();
    set.add(res);
    sseClients.set(id, set);
  
    req.on("close", () => {
      set.delete(res);
      if (set.size === 0) sseClients.delete(id);
    });
  });
  
  checkRunsRouter.get("/projects/:projectId/check-runs", requireAuth, async (req, res) => {
    const projectId = getSingleParam(req.params.projectId);
  
    try {
      if (!projectId) return res.status(400).json({ error: "Project id is required" });
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId: req.user!.id },
        select: { id: true },
      });
      if (!project) return res.status(404).json({ error: "Project not found" });
  
      const runs = await prisma.checkRun.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        include: { metrics: true, scripts: true, project: false },
      });
      const normalized = runs.map((r: {
        id: string;
        projectId: string;
        status: string;
        createdAt: Date;
        startedAt: Date | null;
        finishedAt: Date | null;
        error: string | null;
        metrics: { rawJson: unknown } | null;
        scripts: { scripts: unknown } | null;
      }): NormalizedCheckRun => {
        const metricsSource = r.metrics?.rawJson as Record<string, unknown> | null;
        const scriptsSource = r.scripts?.scripts as Record<string, unknown> | PageScript[] | null;
        const additionalPageMetrics = normalizeAdditionalPages(metricsSource?.additionalPages);
        const additionalPageScripts = typeof scriptsSource === "object" && scriptsSource !== null && !Array.isArray(scriptsSource)
          ? (scriptsSource.additionalPages as Array<{ id?: string; scripts?: unknown }> | undefined) ?? []
          : [];
        const additionalPages = additionalPageMetrics.map((page) => {
          const scripts = additionalPageScripts.find((item) => item.id === page.id)?.scripts;
  
          return {
            ...page,
            scripts: normalizeScripts(scripts ?? page.scripts),
          };
        });
        const mainScripts =
          Array.isArray(scriptsSource)
            ? normalizeScripts(scriptsSource)
            : normalizeScripts(
                typeof scriptsSource === "object" && scriptsSource !== null ? scriptsSource.mainPage : []
              );
  
        return {
          id: r.id,
          projectId: r.projectId,
          status: r.status,
          createdAt: r.createdAt,
          startedAt: r.startedAt,
          finishedAt: r.finishedAt,
          error: r.error,
          metrics: normalizeMetricsSnapshot(metricsSource),
          scripts: mainScripts,
          additionalPages,
        };
      });
  
      res.json(normalized);
    } catch (e: unknown) {
      console.error("CHECK RUNS ERROR:", e);
      return res.status(500).json({
        error: "Failed to load check runs",
        details: (e as Error)?.message ?? String(e),
      });
    }
  });
  
  checkRunsRouter.get("/check-runs/active", requireAuth, async (req, res) => {
    try {
      const projects = await prisma.project.findMany({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      const projectIds = projects.map((p: { id: string }) => p.id);
      if (projectIds.length === 0) return res.json(null);
  
      const latestRun = await prisma.checkRun.findFirst({
        where: {
          projectId: { in: projectIds },
        },
        orderBy: { createdAt: "desc" },
        include: { project: { select: { name: true } } },
      });
  
      if (!latestRun) return res.json(null);
      const active = latestRun.status === "QUEUED" || latestRun.status === "RUNNING";
  
      return res.json({
        runId: latestRun.id,
        projectId: latestRun.projectId,
        projectName: latestRun.project?.name ?? "",
        status: latestRun.status,
        active,
        startedAt: latestRun.startedAt,
        finishedAt: latestRun.finishedAt,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to load active check runs" });
    }
  });