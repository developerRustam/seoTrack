import { describe, it, expect } from "vitest";
import { evaluateMetric } from "./evaluateMetric";
import { METRIC_THRESHOLDS } from "./metricThresholds";
import type { ProjectMetricKey } from "../types/metrics";

describe("evaluateMetric", () => {
  const keys: ProjectMetricKey[] = ["lcp", "cls", "inp", "ttfb", "seoScore"];

  it("returns good at or below the good threshold", () => {
    keys.forEach((key) => {
      const t = METRIC_THRESHOLDS[key];
      expect(evaluateMetric(key, t.good)).toBe("good");
    });
  });

  it("returns warning between good and warning thresholds", () => {
    keys.forEach((key) => {
      const t = METRIC_THRESHOLDS[key];
      const value = (t.good + t.warning) / 2;
      expect(evaluateMetric(key, value)).toBe("warning");
    });
  });

  it("returns critical above the warning threshold", () => {
    keys.forEach((key) => {
      const t = METRIC_THRESHOLDS[key];
      let value;
      if(key  == "seoScore") {
        value  =  t.warning - 1;
      } else {
        value = t.warning + 1;
      }
        expect(evaluateMetric(key, value)).toBe("critical");
    });
  });
});
