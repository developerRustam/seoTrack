import { Link, useParams } from "react-router-dom";
import { ProjectChart } from "../../ProjectChart";
import { RecentChecks } from "../../RecentChecks";
import loading from "../../../../assets/loader.gif";
import { ProjectMetricsPanel } from "../../../../widgets/ui/ProjectMetricsPanel";
import { ProjectIssuesList } from "../../../../widgets/ui/ProjectIssuesList";
import { ProjectScriptsList } from "../../../../widgets/ui/ProjectScriptsList";
import { formatDate } from "../../../../shared/lib/formatDate";
import settingIcon from "../../../../assets/settings.png";
import { ProjectSettingsPopup } from "../../../../shared/ui/projectSettingsPopup/ProjectSettingsPopup";
import { ProjectAdditionalPages } from "../../../../widgets/ui/ProjectAdditionalPages";
import { useProjectDetailsPage } from "../model/useProjectDetailsPage";

export function ProjectDetailsPage() {
  const { id, historyId } = useParams();
  const {
    project, projectError, isProjectLoading, checkRuns,
    checkRunsError, metricView, setMetricView,
    selectedPageId, setSelectedPageId, isOpenSetting, setIsOpenSetting,
    isStarting, startCheckRunError, startCheck, resolvedAdditionalPages,
    isPending, activeCheckRun, displayedMetrics, activeSubtitle, activeTitle,
    activeStatus, chartRuns
  } = useProjectDetailsPage({ projectId: id, historyId });





  if (isProjectLoading) {
    return (
      <div className="table-container">
        <img src={loading} alt="Загрузка" />
        <p className="muted">Загрузка проектов...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page">
        <div className="panel panel-mainText">
          <div className="page__header">
            {checkRunsError || projectError ? (
              <h1 className="page__title">{"Что-то пошло не так"}</h1>
            ) : (
              <h1 className="page__title">Такого проекта не существует</h1>
            )}
          </div>
          <p className="page__subtitle">
            Если проблема на нашей стороне сообщите пожалуйста об этом в техническую поддержку
          </p>
          <Link to="/projects" className="button button--primary">
            Вернуться к другим проектам
          </Link>
        </div>
      </div>
    );
  }


  return (
    <>
      {isOpenSetting && (
        <ProjectSettingsPopup
          initialValues={project}
          onClose={() => setIsOpenSetting(false)}
        />
      )}
      <div className="page">
        {checkRuns && (
          <div className="panel panel-mainText">
            <div className="page__header">
              <div>
                <div className="panel-mainText-flex">
                  <h1 className="page__title">{activeTitle}</h1>
                  <button
                    type="button"
                    className="panel-mainText__btn"
                    aria-label="Открыть настройки проекта"
                    onClick={() => setIsOpenSetting(true)}
                  >
                    <img
                      src={settingIcon}
                      alt="Настройки проекта"
                      className="panel-mainText__img"
                    />
                  </button>
                </div>
                <p className="page__subtitle">{activeSubtitle}</p>
              </div>
              <button
                className="button button--primary"
                type="button"
                disabled={isStarting || isPending}
                onClick={startCheck}
              >
                {isStarting
                  ? "Запускаем..."
                  : isPending
                    ? "Ожидайте"
                    : startCheckRunError
                      ? "Произошла ошибка"
                      : "Запустить проверку"}
              </button>
            </div>

            <div className="project-details__meta">
              <span className="pill">Owner: {project.user?.email ?? "-"}</span>
              <span className="pill">Scope: {selectedPageId ? "Additional page" : "Main page"}</span>
              <span className="pill">Status: {activeStatus ?? "-"}</span>
              <span className="pill">Open alerts: {project.alerts ?? 0}</span>
              <span className="pill">Last incident: {formatDate(project.lastIncidentAt)}</span>
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
            <ProjectMetricsPanel metricView={metricView} metrics={displayedMetrics} />
          </div>
        )}
        <ProjectAdditionalPages
          projectId={project.id}
          additionalPages={resolvedAdditionalPages}
          selectedPageId={selectedPageId}
          onSelectPage={setSelectedPageId}
        />
        {checkRuns && historyId === undefined ? (
          chartRuns.length > 1 ? (
            <ProjectChart checkRuns={chartRuns} metricView={metricView} />
          ) : (
            <div className="panel panel--empty panel--first-run">
              <div className="panel__content">
                {checkRuns.length === 0 ? (
                  <h2 className="panel__title">Сделай свой первый запуск для {activeTitle}</h2>
                ) : (
                  <h2 className="panel__title">Слишком мало данных для {activeTitle}</h2>
                )}
                <p className="panel__subtitle">
                  Для отображения графика истории метрик нужно хотя бы два запуска проверки.
                  Запустите проверку проекта, чтобы начать сбор статистики!
                </p>
                <button
                  className="button"
                  type="button"
                  disabled={isStarting || isPending}
                  onClick={startCheck}
                >
                  {isStarting ? "Запускаем..." : isPending ? "Ожидайте..." : "Запустить проверку"}
                </button>
              </div>
            </div>
          )
        ) : null}
      </div>
      <ProjectScriptsList currentCheckRun={activeCheckRun} />
      <ProjectIssuesList currentCheckRun={activeCheckRun} metricView={metricView} />
      <RecentChecks runs={chartRuns} metricView={metricView} />
    </>
  );
}
