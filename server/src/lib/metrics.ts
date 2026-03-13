export type PageMetrics = {
    lcp: number;
    cls: number;
    inp: number;
    ttfb: number;
    seoScore: number;
};

export type PageMetricSnapshot = {
    mob: PageMetrics;
    desc: PageMetrics;
};

export type AuditKey =
    | "largest-contentful-paint"
    | "cumulative-layout-shift"
    | "interaction-to-next-paint"
    | "server-response-time";


export type Strategy = "mobile" | "desktop";
export interface LighthouseAudits {
    [key: string]: { numericValue?: number };
}

export interface LighthouseResult {
    audits?: LighthouseAudits;
    categories?: {
        performance?: {
            score?: number;
        };
    };
}

function pickMetric(audits: Record<string, { numericValue?: number }>, key: AuditKey): number {
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
function emptyPageMetrics(): PageMetrics {
    return {
        lcp: 0,
        cls: 0,
        inp: 0,
        ttfb: 0,
        seoScore: 0,
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
function getPageStatus(metrics: PageMetricSnapshot): "ok" | "warning" | "error" {
    const totalAlerts = countAlerts(metrics.mob) + countAlerts(metrics.desc);

    if (totalAlerts === 0) return "ok";
    if (totalAlerts < 4) return "warning";
    return "error";
}

export {
    getPageStatus,
    countAlerts,
    emptyPageMetrics,
    normalizeMetrics,
    pickMetric
}