import { emptyPageMetrics, getPageStatus, type PageMetricSnapshot } from "./metrics.js";

export type PageScript = {
    domain: string;
    impactDescription: string;
    impactMs: number;
    sizeKb: number;
    type: "third-party" | "internal";
    url: string;
};

export type StoredAdditionalPage = {
    id: string;
    title: string;
    url: string;
    enabled: boolean;
    status: "ok" | "warning" | "error";
    metrics: PageMetricSnapshot;
    scripts: PageScript[];
};

export type NormalizedCheckRun = {
    id: string;
    projectId: string;
    status: string;
    createdAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    error: string | null;
    metrics: PageMetricSnapshot;
    scripts: PageScript[];
    additionalPages: StoredAdditionalPage[];
};

export function normalizeMetricsSnapshot(value: unknown): PageMetricSnapshot {
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


export function normalizeScripts(value: unknown): PageScript[] {
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



export function normalizeAdditionalPage(value: unknown): StoredAdditionalPage | null {
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

export function normalizeAdditionalPages(value: unknown): StoredAdditionalPage[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => normalizeAdditionalPage(item))
        .filter((item): item is StoredAdditionalPage => item !== null);
}
