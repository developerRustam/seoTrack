import type { ProjectMetricKey } from "../types/metrics";

import { evaluateMetric } from "./evaluateMetric";
export type MetricLevel = "good" | "warning" | "critical";
type Threshold = {
    good: number;
    warning: number;
}
export const METRIC_THRESHOLDS: Record<ProjectMetricKey, Threshold> = {
    lcp: { good: 2500, warning: 4000 },
    cls: { good: 0.1, warning: 0.25 },
    inp: { good: 200, warning: 500 },
    ttfb: { good: 800, warning: 1800 },
    seoScore: { good: 90, warning: 75 },
  };


export type Issue = {
  key: ProjectMetricKey;
  level: "warning" | "critical";
  value: number;
  threshold: number;
};

export function getIssues(metrics: Record<ProjectMetricKey, number>): Issue[] {
  const keys = Object.keys(metrics) as ProjectMetricKey[];
    
  return keys
    .map((key) => {
      const value = metrics[key];
      const level = evaluateMetric(key, value);
      if (level === "good") return null;

      const t = METRIC_THRESHOLDS[key];
      const threshold = level === "warning" ? t.good : t.warning;

      return { key, level, value, threshold };
    })
    .filter(Boolean) as Issue[];
}
