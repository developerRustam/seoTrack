import { prisma } from "../db/prisma.js";
import { enqueueCheckRun } from "../services/checkRunService.js";

import cron from "node-cron";

export function startCronJobs () {
    cron.schedule("0 * * * *", async () => {
    try {
      const projects = await prisma.project.findMany({
        select: { id: true, url: true },
      });
      for (const project of projects) {
        const active = await prisma.checkRun.findFirst({
          where: {
            projectId: project.id,
            status: { in: ["QUEUED", "RUNNING"] },
          },
          select: { id: true },
        });
        if (active) continue;
        const fullProject = await prisma.project.findFirst({
          where: { id: project.id },
          select: { id: true, url: true, additionalPages: true },
        });
        if (!fullProject) continue;
        await enqueueCheckRun(fullProject);
      }
    } catch (e) {
      console.error("CRON CHECK RUN ERROR:", e);
    }
  })
}