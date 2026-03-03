
import { PROJECT_METRICS } from "../../shared/lib/projectMetrics";
import styles from './ProjectTable.module.css'
import { Link } from "react-router-dom";
import loading from '../../assets/loader.gif';
import { useGetProjectsQuery } from "../../entities/project/api/projectsApi";
import { formatDate } from "../../shared/lib/formatDate";
export function ProjectsTable() {
  const { data, isLoading, error} = useGetProjectsQuery();
  const fetchedProjects = data ?? [];
  const errorText =
  error && "status" in error
    ? `Ошибка: ${error.status}`
    : error
      ? "Неизвестная ошибка"
      : null;



    return (
      isLoading ? (
        <div className="table-container">
          <img src={loading} alt="Загрузка" />
          <p className="muted">Загрузка проектов...</p>
        </div>
      ) : error ? (
        <div className="table-container">
          {errorText && <p className="muted">{errorText}</p>}
        </div>
      ) : fetchedProjects.length ? (
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeader}>
              <th>Project</th>
              <th>Status</th>
              {/* <th>Description</th> */}
              <th>Alerts</th>
              <th>Last incident</th>
              {PROJECT_METRICS.map((metric) => (
                <th key={metric.key}>{metric.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fetchedProjects.map((project) => (
                 <tr key={project.id}>
                 <td className={styles.tableRowName}>
                   <Link to={`/projects/${project.id}`} className="table__link">
                     <div className="table__project-name">{project.name}</div>
                     {/* <div className="muted">{project.owner}</div> */}
                   </Link>
                 </td>
                 <td>
                   <span className={`status status--${project.status}`}>{project.status}</span>
                 </td>
                 {/* <td>
                   <span className="muted">{project.description}</span>
                 </td> */}
                 <td>{project.alerts}</td>
                 <td>
                   <span className="muted">
                    {formatDate(project.lastIncidentAt)}
                   </span>
                 </td>
                 {PROJECT_METRICS.map((metric) => (
                   <td key={metric.key}>
                     {project.metrics?.desc?.[metric.key] !== undefined
                       ? project.metrics.desc[metric.key]
                       : "-"}
                   </td>
                 ))}
               </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="table-container">
          <p className="muted">Проекты не найдены</p>
          <Link to="/projects/add" className="button button--primary">Добавить проект</Link>
        </div>
      )
    )
}
