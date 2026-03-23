import cron from "node-cron";

import { prisma } from "../db/prisma.js";
import { shouldRunProjectCheck } from "../lib/checkFrequency.js";
import { enqueueCheckRun, failStaleCheckRuns } from "../services/checkRunService.js";

export function startCronJobs() {
  cron.schedule("0 * * * *", async () => {
    try {
      await failStaleCheckRuns();
      const now = new Date();

      const projects = await prisma.project.findMany({
        select: { id: true, url: true, checkFrequency: true, additionalPages: true },
      });

      for (const project of projects) {
        const lastRun = await prisma.checkRun.findFirst({
          where: { projectId: project.id },
          orderBy: { createdAt: "desc" },
          select: {
            status: true,
            createdAt: true,
            finishedAt: true,
          },
        });
        if (lastRun?.status === "QUEUED" || lastRun?.status === "RUNNING") {
          continue;
        }
        const lastRunAt = lastRun?.finishedAt ?? lastRun?.createdAt ?? null;
        const shouldRun = shouldRunProjectCheck(project.checkFrequency, lastRunAt, now);

        if (!shouldRun) continue;

        await enqueueCheckRun(project);
      }
    } catch (e) {
      console.error("CRON CHECK RUN ERROR:", e);
    }
  });
}
