import { countAlerts, getPageStatus, normalizeMetrics } from "../lib/metrics.js";
import { runPageSpeed } from "./pageSpeedService.js"
import { prisma } from "../db/prisma.js";
import { normalizeAdditionalPages } from "../lib/projectNormalization.js";
import { publishSse } from "./sseService.js";

export async function runChecksForPage(url: string) {
    const [mobileJson, desktopJson] = await Promise.all([
      runPageSpeed(url, "mobile"),
      runPageSpeed(url, "desktop"),
    ]);
  
    const mobLhr = (mobileJson as { lighthouseResult?: unknown })?.lighthouseResult;
    const descLhr = (desktopJson as { lighthouseResult?: unknown })?.lighthouseResult;
  
    return {
      metrics: {
        mob: normalizeMetrics(mobLhr),
        desc: normalizeMetrics(descLhr),
      },
      scripts: [],
    };
  }

  
export async function runCheckForProject(project: { id: string; url: string; additionalPages?: unknown }, runId: string) {
    try {
      const storedAdditionalPages = normalizeAdditionalPages(project.additionalPages);
      const enabledAdditionalPages = storedAdditionalPages.filter((page) => page.enabled);
      const mainPageResult = await runChecksForPage(project.url);
      const checkedAdditionalPages = await Promise.all(
        enabledAdditionalPages.map(async (page) => {
          const result = await runChecksForPage(page.url);
  
          return {
            ...page,
            metrics: result.metrics,
            scripts: result.scripts,
            status: getPageStatus(result.metrics),
          };
        })
      );
  
      const additionalPagesById = new Map(checkedAdditionalPages.map((page) => [page.id, page]));
      const nextAdditionalPages = storedAdditionalPages.map((page) => additionalPagesById.get(page.id) ?? page);
      const rawJson = {
        mob: mainPageResult.metrics.mob,
        desc: mainPageResult.metrics.desc,
        additionalPages: checkedAdditionalPages,
      };
      await prisma.metricSnapshot.create({
        data: {
          checkRunId: runId,
          rawJson,
        },
      });
  
      await prisma.scriptSnapshot.create({
        data: {
          checkRunId: runId,
          scripts: {
            mainPage: mainPageResult.scripts,
            additionalPages: checkedAdditionalPages.map((page) => ({
              id: page.id,
              scripts: page.scripts,
            })),
          },
        },
      });
  
      const finishedAt = new Date();
      await prisma.checkRun.update({
        where: { id: runId },
        data: { status: "SUCCESS", finishedAt },
      });
  
      const totalAlerts =
        countAlerts(mainPageResult.metrics.mob) +
        countAlerts(mainPageResult.metrics.desc) +
        checkedAdditionalPages.reduce(
          (sum, page) => sum + countAlerts(page.metrics.mob) + countAlerts(page.metrics.desc),
          0
        );
  
      await prisma.project.update({
        where: { id: project.id },
        data: {
          metrics: mainPageResult.metrics,
          alerts: totalAlerts,
          lastIncidentAt: totalAlerts > 0 ? finishedAt : null,
          additionalPages: nextAdditionalPages,
        },
      });
  
      publishSse(project.id, { runId, status: "SUCCESS", finishedAt });
    } catch (e: unknown) {
      await prisma.checkRun.update({
        where: { id: runId },
        data: { status: "FAIL", finishedAt: new Date(), error: String((e as Error)?.message ?? e) },
      });
      publishSse(project.id, { runId, status: "FAIL" });
    }
  }
  
export async function enqueueCheckRun(project: { id: string; url: string; additionalPages?: unknown }) {
    const run = await prisma.checkRun.create({
      data: {
        projectId: project.id,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });
  
    void runCheckForProject(project, run.id);
    return run;
  }

