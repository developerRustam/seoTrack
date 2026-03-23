import { Link, useParams } from "react-router-dom";
import { ProjectChart } from "../../ProjectChart";
import { RecentChecks } from "../../RecentChecks";
import loading from "../../../../assets/loader.gif";
import { ProjectMetricsPanel } from "../../../../widgets/ui/ProjectMetricsPanel";
import { ProjectIssuesList } from "../../../../widgets/ui/ProjectIssuesList";
import { ProjectScriptsList } from "../../../../widgets/ui/ProjectScriptsList";
import { ProjectSettingsPopup } from "../../../../shared/ui/projectSettingsPopup/ProjectSettingsPopup";
import { ProjectAdditionalPages } from "../../../../widgets/ui/ProjectAdditionalPages";
import { useProjectDetailsPage } from "../model/useProjectDetailsPage";
import { ProjectDetailsHeader } from "./ProjectDetailsHeader";
import { ProjectDetailsMeta } from "./ProjectDetailsMeta";
import { ProjectDetailsMetricSwitch } from "./ProjectDetailsMetricSwitch";

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

            <ProjectDetailsHeader
              title={activeTitle}
              subtitle={activeSubtitle}
              isStarting={isStarting}
              isPending={isPending}
              hasStartError={Boolean(startCheckRunError)}
              onOpenSettings={() => setIsOpenSetting(true)}
              onStartCheck={startCheck}
            />

            <ProjectDetailsMeta pageId={selectedPageId} email={project.user.email}   status={activeStatus} alerts={project.alerts}  lastIncidentAt={project.lastIncidentAt} />

            <ProjectDetailsMetricSwitch metricView={metricView}  onChange={setMetricView}/>
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

