import type { ProjectMetricKey } from "../types/metrics";
import { METRIC_THRESHOLDS, type MetricLevel } from "./metricThresholds";

export function evaluateMetric(
  key: ProjectMetricKey,
  value: number
): MetricLevel {
  const thresholds = METRIC_THRESHOLDS[key];
  if (!thresholds) return "good";

  if (key === "seoScore") {
    if (value >= thresholds.good) return "good";
    if (value >= thresholds.warning) return "warning";
    return "critical";
  } else {
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.warning) return "warning";
    return "critical";
  }
}
