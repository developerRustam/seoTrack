import styles from "./RecentIncidents.module.css";
import { useFetchIncidentsQuery } from "../../entities/project/api/projectsApi";


export function RecentIncidents() {
  const {data: incidentItems } = useFetchIncidentsQuery();
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Recent incidents</h3>
          <p className={styles.subtitle}>Latest alerts across your watchlist.</p>
        </div>
        <button className="button button--ghost" type="button">
          View all
        </button>
      </div>

      <ul className={styles.list}>
        {incidentItems &&  incidentItems.map((it) => {
          const levelClass =
            it.level === "critical" ? styles.levelCritical : styles.levelWarning;

          return (
            <li key={it.id} className={styles.row}>
              <div>
                <div className={styles.project}>{it.projectName}</div>
                <div className={styles.meta}>
                  <span className={styles.badge}>{it.metric}</span>
                  <span className={`${styles.level} ${levelClass}`}>{it.level}</span>
                </div>
              </div>

              <div className={styles.time}>{it.timeText}</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
