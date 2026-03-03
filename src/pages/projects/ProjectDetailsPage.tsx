import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { ProjectChart } from "./ProjectChart";
import type { CheckRun } from "../../shared/types/run";
import { RecentChecks } from "./RecentChecks";
import loading from '../../assets/loader.gif';
import { useGetProjectQuery, useGetCheckRunsQuery, useStartCheckRunMutation } from "../../entities/project/api/projectsApi";
import type { MetricView} from "../../shared/types/metrics";
import { ProjectMetricsPanel } from "../../widjet/ui/ProjectMetricsPanel";
import { ProjectIssuesList } from "../../widjet/ui/ProjectIssuesList";
import { ProjectScriptsList } from "../../widjet/ui/ProjectScriptsList";
import { formatDate } from "../../shared/lib/formatDate";
import settingIcon from '../../assets/settings.png'
import { ProjectSettingsPopup } from "../../shared/ui/projectSettingsPopup/ProjectSettingsPopup";
import { ProjectAdditionalPages } from "../../widjet/ui/ProjectAdditionalPages";
export function ProjectDetailsPage() {
  const { id, historyId } = useParams();
  const [isOpenSetting, setIsOpenSetting] = useState(false)
  const [startCheckRun, {error: startCheckRunError}] = useStartCheckRunMutation();
  const {
    data: projectData,
    error: projectError,
    isLoading: isProjectLoading,
  } = useGetProjectQuery(id as string, { skip: !id });

  const {
    data: checkRunsData,
    error: checkRunsError
  } = useGetCheckRunsQuery(id as string, { skip: !id });

  const project = projectData;
  const checkRuns = checkRunsData;
  
  const [metricView, setMetricView] = useState<MetricView>("desc");

  const currentCheckRun: CheckRun | undefined = useMemo(() => {
    if (!checkRuns || checkRuns.length === 0) return undefined;
    if (historyId) {
      return checkRuns.find((run: CheckRun) => run.id === historyId);
    }
    return checkRuns.reduce((latest, current) => {
      const getTimestamp = (run: CheckRun) => {
        const ts = Date.parse(run.createdAt);
        return isNaN(ts) ? 0 : ts;
      };
      return getTimestamp(current) > getTimestamp(latest) ? current : latest;
    }, checkRuns[0]);
  }, [checkRuns, historyId]);


  const [isStarting, setIsStarting] = useState(false);
  const isPending =
    currentCheckRun?.status === "RUNNING" || currentCheckRun?.status === "QUEUED";
    



  const chartRuns = useMemo(() => { 
      if(Array.isArray(checkRuns)) {
        return checkRuns.filter((run: CheckRun) => run?.metrics?.[metricView])
      }
      return []
    },[checkRuns, metricView])


  if(isProjectLoading) {
    return (
      <div className="table-container">
      <img src={loading} alt="Загрузка" />
      <p className="muted">Загрузка проектов...</p>
    </div>
    )
  }
  if (!project) {
    return (
      <div className="page">
        <div className="panel panel-mainText">
          <div className="page__header">
            
          {checkRunsError || projectError ? (
            <h1 className="page__title">
              {"Что-то пошло не так"}
            </h1>
          ) : (
            <h1 className="page__title">Такого проекта не существует</h1>
          )}
          </div>
          <p className="page__subtitle">Если  проблема на нашей стороне сообщите  пожалуйста  об   этом в техническую поддержку</p>
          <Link to="/projects" className="button button--primary">
            Вернуться  к другим проектам
          </Link>
        </div>
      </div>
    );
  } 
  return (
    <>
      <ProjectSettingsPopup open={isOpenSetting} initialValues={project} onClose={() => setIsOpenSetting(false)} />
      <div className="page">

        {checkRuns && (
          <div className="panel panel-mainText">
            <div className="page__header">
              <div>
                <div style={{display:"flex"}}>
                  <h1 className="page__title">{project.name}</h1>
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      marginLeft: "10px",
                      verticalAlign: "middle",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      height: "17px"
                    }}
                    aria-label="Открыть настройки проекта"
                    onClick={() => setIsOpenSetting(true)}
                  >
                    <img
                      src={settingIcon}
                      alt="Настройки проекта"
                      style={{
                        width: "17px",
                        height: "17px"
                      }}
                    />
                  </button>
                </div>
                <p className="page__subtitle">{project.description}</p>
              </div>
              <button
                className="button button--primary"
                type="button"
                disabled={isStarting || isPending}
                onClick={async () => {
                  if (!id) return;
                  setIsStarting(true);
                  try {
                    await  startCheckRun(id).unwrap();
                  } finally {
                    setIsStarting(false);
                  }
                }}
              >
                {isStarting
                  ? "Запускаем..."
                  : isPending
                  ? "Ожидайте"
                  :  startCheckRunError ?
                  "Произошла  ошибка"
                  : "Запустить проверку"}
              </button>
            </div>

            <div className="project-details__meta">
              <span className="pill">Owner: {project.user?.email ?? "-"}</span>
              <span className="pill">Open alerts: {project.alerts ?? 0}</span>
              <span className="pill">
                Last incident:
                {formatDate(project.lastIncidentAt)}
              </span>
            </div>
            <div className="switch-type-data">
              <button
                className="button button--secondary"
                type="button"
                aria-pressed={metricView === "desc"}
                onClick={() => setMetricView("desc")}
              >
                Десктоп
              </button>
              <button
                className="button button--secondary"
                type="button"
                aria-pressed={metricView === "mob"}
                onClick={() => setMetricView("mob")}
              >
                Мобайл
              </button>
            </div>
            <ProjectMetricsPanel
              metricView={metricView}
              project={project}
            />
          </div>
        )}
        <ProjectAdditionalPages/>
        {checkRuns && historyId === undefined ? (
          chartRuns.length > 1 ? (
            <ProjectChart checkRuns={chartRuns} metricView={metricView} />
          ) : (
            <div className="panel panel--empty panel--first-run">
              <div className="panel__content">
                {checkRuns.length === 0 ? (
                  <h2 className="panel__title">
                    Сделай свой первый запуск для {project.name}
                  </h2>
                ) : (
                  <h2 className="panel__title">
                    Слишком мало данных для {project.name}
                  </h2>
                )}
                <p className="panel__subtitle">
                  Для отображения графика истории метрик нужно хотя бы два запуска проверки. Запустите проверку проекта, чтобы начать сбор статистики!
                </p>
                <button
                  className="button"
                  type="button"
                  disabled={isStarting || isPending}
                  onClick={async () => {
                    if (!id) return;
                    setIsStarting(true);
                    try {
                      await startCheckRun(id).unwrap();
                    } finally {
                      setIsStarting(false);
                    }
                  }}
                >
                  {isStarting
                    ? "Запускаем..."
                    : isPending
                    ? "Ожидайте..."
                    : "Запустить проверку"}
                </button>
              </div>
            </div>
          )
        ) : null}
      </div>
      <ProjectScriptsList currentCheckRun={currentCheckRun}/>
      <ProjectIssuesList currentCheckRun={currentCheckRun}  metricView={metricView}/>
      <RecentChecks runs={chartRuns} metricView={metricView} />
    </>
  );
}
