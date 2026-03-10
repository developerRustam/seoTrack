import { PROJECT_METRICS } from "../../shared/lib/projectMetrics";
import type { MetricView, Metrics, ProjectMetricKey } from "../../shared/types/metrics";
export function ProjectMetricsPanel ({ metricView, metrics }: { metricView: MetricView, metrics: Metrics }) {
    
    const metricPercents: Record<ProjectMetricKey, { good: number; betterToBeLower: boolean }> = {
        lcp: { good: 2500, betterToBeLower: true },
        cls: { good: 0.1, betterToBeLower: true },
        inp: { good: 200, betterToBeLower: true },
        ttfb: { good: 800, betterToBeLower: true },
        seoScore: { good: 100, betterToBeLower: false },
      };
      
      const radius = 42.5;
      const circumference = 2 * Math.PI * radius;
      const safeProjectMetrics: Partial<Record<ProjectMetricKey, number>> = metrics?.[metricView] ?? {};
      

    return(
        <div className="project-details__flex">
              {PROJECT_METRICS.map((metric) => {
                const value = safeProjectMetrics[metric.key];
                const config =
                  metricPercents[metric.key] || {
                    good: 1,
                    betterToBeLower: false,
                  };
                let percentFilled = 0;

                if (typeof value === "number" && config.good > 0) {
                  if (config.betterToBeLower) {
                    percentFilled = Math.max(0, Math.min(1, config.good / value));
                  } else {
                    percentFilled = Math.max(0, Math.min(1, value / config.good));
                  }
                }
                percentFilled = Math.min(percentFilled, 1);
                const strokeDashoffset = circumference * (1 - percentFilled);

                return (
                  <div className="metric-panel-wrap" key={metric.key}>
                    <div
                      className={`panel panel--sub metric-panel metric-panel-${metric.key}`}
                    >
                      <div className="metric-panel__content">
                        <div className="metric__progress-circle">
                          <svg width="99" height="99" viewBox="0 0 99 99">
                            <circle
                              cx="49.5"
                              cy="49.5"
                              r="42.5"
                              stroke="#e5e7eb"
                              strokeWidth="4"
                              fill="none"
                            />
                            {typeof value === "number" && (
                              <circle
                                className="metric-panel-fill"
                                cx="49.5"
                                cy="49.5"
                                r={radius}
                                stroke="#2778f7"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                style={{
                                  transition:
                                    "stroke-dashoffset 0.6s cubic-bezier(.25,.8,.25,1)",
                                }}
                                transform="rotate(-90 49.5 49.5)"
                              />
                            )}
                          </svg>
                          <div className="metric__value metric__value--large metric__value--progress">
                            {typeof value === "number" ? value : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="metric__label">{metric.label}</div>
                  </div>
                );
              })}
            </div>
    )
}
