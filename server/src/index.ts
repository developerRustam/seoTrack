import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cron from "node-cron";
import { prisma } from "./db/prisma.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);

const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const IS_PROD = process.env.NODE_ENV === "production";

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: (IS_PROD ? "none" : "lax") as "none" | "lax",
  secure: IS_PROD,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: "/",
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, "");
      const isAllowed = CLIENT_ORIGINS.includes(normalizedOrigin);
      return callback(isAllowed ? null : new Error("Not allowed by CORS"), isAllowed);
    },
    credentials: true,
  })
);

const SESSION_COOKIE = "pm_session";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret";
const SESSION_TTL = "7d";
const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY ?? "";

type AuthTokenPayload = {
  userId: string;
  email: string;
};

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type PageMetrics = {
  lcp: number;
  cls: number;
  inp: number;
  ttfb: number;
  seoScore: number;
};

type PageMetricSnapshot = {
  mob: PageMetrics;
  desc: PageMetrics;
};

type PageScript = {
  domain: string;
  impactDescription: string;
  impactMs: number;
  sizeKb: number;
  type: "third-party" | "internal";
  url: string;
};

type StoredAdditionalPage = {
  id: string;
  title: string;
  url: string;
  enabled: boolean;
  status: "ok" | "warning" | "error";
  metrics: PageMetricSnapshot;
  scripts: PageScript[];
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function emptyPageMetrics(): PageMetrics {
  return {
    lcp: 0,
    cls: 0,
    inp: 0,
    ttfb: 0,
    seoScore: 0,
  };
}


function normalizeMetricsSnapshot(value: unknown): PageMetricSnapshot {
  const source = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const parseMetrics = (key: "mob" | "desc") => {
    const metrics = typeof source[key] === "object" && source[key] !== null
      ? (source[key] as Record<string, unknown>)
      : {};
    const defaults = emptyPageMetrics();

    return {
      lcp: typeof metrics.lcp === "number" ? metrics.lcp : defaults.lcp,
      cls: typeof metrics.cls === "number" ? metrics.cls : defaults.cls,
      inp: typeof metrics.inp === "number" ? metrics.inp : defaults.inp,
      ttfb: typeof metrics.ttfb === "number" ? metrics.ttfb : defaults.ttfb,
      seoScore: typeof metrics.seoScore === "number" ? metrics.seoScore : defaults.seoScore,
    };
  };

  return {
    mob: parseMetrics("mob"),
    desc: parseMetrics("desc"),
  };
}

function normalizeScripts(value: unknown): PageScript[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const script = item as Record<string, unknown>;

      return {
        domain: typeof script.domain === "string" ? script.domain : "",
        impactDescription: typeof script.impactDescription === "string" ? script.impactDescription : "",
        impactMs: typeof script.impactMs === "number" ? script.impactMs : 0,
        sizeKb: typeof script.sizeKb === "number" ? script.sizeKb : 0,
        type: script.type === "internal" ? "internal" : "third-party",
        url: typeof script.url === "string" ? script.url : "",
      } satisfies PageScript;
    })
    .filter((item): item is PageScript => item !== null);
}

function getPageStatus(metrics: PageMetricSnapshot): "ok" | "warning" | "error" {
  const totalAlerts = countAlerts(metrics.mob) + countAlerts(metrics.desc);

  if (totalAlerts === 0) return "ok";
  if (totalAlerts < 4) return "warning";
  return "error";
}

function normalizeAdditionalPage(value: unknown): StoredAdditionalPage | null {
  if (!value || typeof value !== "object") return null;
  const page = value as Record<string, unknown>;

  if (typeof page.id !== "string" || typeof page.title !== "string" || typeof page.url !== "string") {
    return null;
  }

  const metrics = normalizeMetricsSnapshot(page.metrics);

  return {
    id: page.id,
    title: page.title,
    url: page.url,
    enabled: typeof page.enabled === "boolean" ? page.enabled : true,
    status:
      page.status === "warning" || page.status === "error" || page.status === "ok"
        ? page.status
        : getPageStatus(metrics),
    metrics,
    scripts: normalizeScripts(page.scripts),
  };
}

function normalizeAdditionalPages(value: unknown): StoredAdditionalPage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeAdditionalPage(item))
    .filter((item): item is StoredAdditionalPage => item !== null);
}

function serializeProject(project: {
  id: string;
  name: string;
  url: string;
  description: string | null;
  alerts: number;
  lastIncidentAt: Date | null;
  metrics: unknown;
  additionalPages: unknown;
  checkFrequency: string;
  user?: unknown;
  userId?: string;
  createdAt?: Date;
}) {
  const metrics = normalizeMetricsSnapshot(project.metrics);

  return {
    ...project,
    description: project.description ?? "",
    lastIncidentAt: project.lastIncidentAt?.toISOString() ?? "",
    metrics,
    additionalPages: normalizeAdditionalPages(project.additionalPages),
    scripts: [],
    status: getPageStatus(metrics),
  };
}

function setSessionCookie(res: express.Response, payload: AuthTokenPayload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_TTL });
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions);
}

type AuditKey =
  | "largest-contentful-paint"
  | "cumulative-layout-shift"
  | "interaction-to-next-paint"
  | "server-response-time";

type Strategy = "mobile" | "desktop";

interface LighthouseAudits {
  [key: string]: { numericValue?: number };
}

interface LighthouseResult {
  audits?: LighthouseAudits;
  categories?: {
    performance?: {
      score?: number;
    };
  };
}

function pickMetric(audits: Record<string, { numericValue?: number }>, key: AuditKey): number {
  console.log(audits);
  const v = audits?.[key]?.numericValue;
  if (typeof v !== "number") return 0;
  if (key === "cumulative-layout-shift") {
    return Number(v.toFixed(3));
  }
  return Math.trunc(v);
}

function normalizeMetrics(lhr: unknown) {
  const result = (lhr || {}) as Partial<LighthouseResult>;
  const audits = result.audits ?? {};
  const scoreRaw = result.categories?.performance?.score;
  const performanceScore =
    typeof scoreRaw === "number" ? Math.round(Number((scoreRaw * 100).toFixed(2))) : 0;

  return {
    lcp: pickMetric(audits, "largest-contentful-paint"),
    cls: pickMetric(audits, "cumulative-layout-shift"),
    inp: pickMetric(audits, "interaction-to-next-paint"),
    ttfb: pickMetric(audits, "server-response-time"),
    seoScore: performanceScore,
  };
}

function countAlerts(metrics: { lcp: number; cls: number; inp: number; ttfb: number }) {
  let alerts = 0;
  if (metrics.lcp > 4000) alerts += 1;
  if (metrics.cls > 0.25) alerts += 1;
  if (metrics.inp > 500) alerts += 1;
  if (metrics.ttfb > 1800) alerts += 1;
  return alerts;
}

async function runPageSpeed(url: string, strategy: Strategy) {
  if (!PAGESPEED_API_KEY) throw new Error("PAGESPEED_API_KEY is not set");
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("key", PAGESPEED_API_KEY);

  const res = await fetch(endpoint);
  
  if (!res.ok) {
    throw new Error(`PageSpeed error: ${res.status}`);
  }
  return res.json();
}



async function runChecksForPage(url: string) {
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

const sseClients = new Map<string, Set<express.Response>>();

function publishSse(projectId: string, payload: unknown) {
  const clients = sseClients.get(projectId);
  if (!clients) return;
  const data = `event: check-run\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    res.write(data);
  }
}

async function runCheckForProject(project: { id: string; url: string; additionalPages?: unknown }, runId: string) {
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

async function enqueueCheckRun(project: { id: string; url: string; additionalPages?: unknown }) {
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

async function getUserFromRequest(req: express.Request): Promise<AuthUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name };
  } catch {
    return null;
  }
}

async function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized", code: "NO_SESSION" });
  req.user = user;
  next();
}
app.post("/projects/:id/additional-pages", requireAuth, async (req, res) => {
  const id = getSingleParam(req.params.id);
  const { page } = req.body as { page?: unknown };

  if (!id || !page) {
    return res.status(400).json({ error: "Project id and page are required" });
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
    const nextPage = normalizeAdditionalPage(page);

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

app.get("/health", (_req, res) => res.json({ ok: true }));

app.patch("/projects/:id/settings", requireAuth, async (req, res) => {
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

app.get("/projects/:id/additional-pages", requireAuth, async (req, res) => {
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


app.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: "Name is required", code: "VALIDATION" });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email", code: "VALIDATION" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password too short", code: "VALIDATION" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "Email taken", code: "EMAIL_TAKEN" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, name: name.trim(), passwordHash },
    });

    setSessionCookie(res, { userId: user.id, email: user.email });
    return res.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required", code: "VALIDATION" });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
    }

    setSessionCookie(res, { userId: user.id, email: user.email });
    return res.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
});

app.post("/auth/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions);
  res.json({ ok: true });
});

app.get("/auth/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized", code: "NO_SESSION" });
  return res.json(user);
});

app.post("/projects", requireAuth, async (req, res) => {
  const { name, url } = req.body as {
    name?: string;
    url?: string;
  };

  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
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

app.get("/projects", requireAuth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json(projects.map((project) => serializeProject(project)));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
});

app.post("/projects/:id/check-runs", requireAuth, async (req, res) => {
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

app.get("/projects/:id", requireAuth, async (req, res) => {
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

app.get("/projects/:id/check-runs/stream", requireAuth, async (req, res) => {
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

app.get("/projects/:projectId/check-runs", requireAuth, async (req, res) => {
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
    const normalized = runs.map((r) => {
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

app.get("/check-runs/active", requireAuth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);
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

app.get("/incidents", requireAuth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      select: { id: true },
    });

    const projectIds = projects.map((p) => p.id);
    if (projectIds.length === 0) return res.json([]);

    const incidents = await prisma.incident.findMany({
      where: {
        projectId: { in: projectIds },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const priority = (lvl: string) => (lvl === "critical" ? 2 : 1);

    incidents.sort((a, b) => {
      return priority(b.level) - priority(a.level) || +new Date(b.createdAt) - +new Date(a.createdAt);
    });

    res.json(
      incidents.map((i) => ({
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
});

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
