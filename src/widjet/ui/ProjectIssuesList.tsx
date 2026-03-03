import type { MetricView, ProjectMetricKey } from "../../shared/types/metrics";
import type { CheckRun } from "../../shared/types/run";
import { getIssues } from "../../shared/lib/metricThresholds";
import { useMemo } from "react";

export function ProjectIssuesList({
  currentCheckRun,
  metricView,
}: {
  currentCheckRun: CheckRun | undefined;
  metricView: MetricView;
}) {
  const safeCurrentMetrics: Record<ProjectMetricKey, number> | undefined =
    currentCheckRun?.metrics?.[metricView];

  const checkRunIssue = useMemo(() => {
    if (safeCurrentMetrics) {
      return getIssues(safeCurrentMetrics);
    }
    return [];
  }, [safeCurrentMetrics]);

  if (checkRunIssue && checkRunIssue.length > 0) {
    return (
      <div className="panel">
        <h2 className="section__header">Проблемы</h2>
        <ul className="project-details__rows">
          {checkRunIssue.map((item) => (
            <li
              key={item.key}
              className={`issues-list__item issues-list__item--${item.level}`}
            >
              <div className="issues-list__metric">
                <span className="issues-list__key">{item.key.toUpperCase()}</span>
                <span
                  className={`issues-list__level issues-list__level--${item.level}`}
                >
                  <span className="issues-list__level-symbol">
                    {item.level === "warning" ? "⚠️" : "❗"}
                  </span>{" "}
                  {item.level}
                </span>
              </div>
              <div className="issues-list__details">
                <span className="issues-list__value">
                  Значение: <b>{item.value}</b>
                </span>
                <span className="issues-list__threshold">
                  Порог: <b>{item.threshold}</b>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  } else {
    return <div className="panel__empty">Нет выявленных проблем.</div>;
  }
}