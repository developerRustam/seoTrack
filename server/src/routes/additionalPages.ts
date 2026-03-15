import { Router } from "express";

import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getSingleParam } from "../lib/http.js";
import { isValidHttpUrl } from "../lib/validators.js";
import { normalizeAdditionalPage, normalizeAdditionalPages } from "../lib/projectNormalization.js";

export const additionalPagesRouter = Router();

additionalPagesRouter.post("/projects/:id/additional-pages", requireAuth, async (req, res) => {
  const id = getSingleParam(req.params.id);
  const { page } = req.body as { page?: unknown };

  if (!id || !page) {
    return res.status(400).json({ error: "Project id and page are required" });
  }

  if (typeof page !== "object" || page === null) {
    return res.status(400).json({ error: "Invalid additional page payload" });
  }

  const rawTitle = "title" in page ? page.title : undefined;
  const rawUrl = "url" in page ? page.url : undefined;

  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const url = typeof rawUrl === "string" ? rawUrl.trim() : "";

  if (!title) {
    return res.status(400).json({ error: "Page title is required" });
  }

  if (title.length <3) {
    return res.status(400).json({ error: "Title must be at least 3 characters long" });
  }

  if (!url) {
    return res.status(400).json({ error: "Page URL is required" });
  }

  if (!isValidHttpUrl(url)) {
    return res.status(400).json({ error: "Page URL must be a valid http/https URL" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id, userId: req.user!.id },
      select: { additionalPages: true },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const currentPages = normalizeAdditionalPages(project.additionalPages);
    const nextPage = normalizeAdditionalPage({
      ...page,
      title,
      url,
    });

    if (!nextPage) {
      return res.status(400).json({ error: "Invalid additional page payload" });
    }

    currentPages.push(nextPage);

    await prisma.project.update({
      where: { id },
      data: { additionalPages: currentPages },
    });

    return res.json(currentPages);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
});

additionalPagesRouter.get("/projects/:id/additional-pages", requireAuth, async (req, res) => {
  const id = getSingleParam(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Project id required" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id, userId: req.user!.id },
      select: { additionalPages: true },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json(normalizeAdditionalPages(project.additionalPages));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
});
