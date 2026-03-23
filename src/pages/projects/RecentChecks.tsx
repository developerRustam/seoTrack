import { Link } from "react-router-dom";
import type { CheckRun } from "../../shared/types/run";
import { formatDate } from "../../shared/lib/formatDate";

type RecentChecksProps = {
  runs?: CheckRun[];
  metricView: "desc" | "mob";
};

export function RecentChecks({ runs, metricView }: RecentChecksProps) {
  const checks = runs ?? [];
  return (
    <div>
      <table className="recent-checks-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Status</th>
            <th>LCP</th>
            <th>CLS</th>
            <th>INP</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((item) => {
            const url = `/projects/${item.projectId}/history/${item.id}`;
            const view = item.metrics?.[metricView];

            return (
              <tr key={item.id + item.finishedAt}>
                <td>
                  <Link to={url} className='recent-checks-table-link'>
                    {formatDate(item.finishedAt)}
                  </Link>
                </td>
                <td>
                  <span className={`status status--${item.status?.toLocaleLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>{view?.lcp ?? "-"}</td>
                <td>{view?.cls ?? "-"}</td>
                <td>{view?.inp ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

