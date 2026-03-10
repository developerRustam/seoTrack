import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { ProjectChart } from "./ProjectChart";
import type { CheckRun, CheckRunPageSnapshot } from "../../shared/types/run";
import { RecentChecks } from "./RecentChecks";
import loading from "../../assets/loader.gif";
import {
  useGetProjectQuery,
  useGetCheckRunsQuery,
  useStartCheckRunMutation,
  useGetAdditionalPagesQuery,
} from "../../entities/project/api/projectsApi";
import type { MetricView, Metrics } from "../../shared/types/metrics";
import { ProjectMetricsPanel } from "../../widgets/ui/ProjectMetricsPanel";
import { ProjectIssuesList } from "../../widgets/ui/ProjectIssuesList";
import { ProjectScriptsList } from "../../widgets/ui/ProjectScriptsList";
import { formatDate } from "../../shared/lib/formatDate";
import settingIcon from "../../assets/settings.png";
import { ProjectSettingsPopup } from "../../shared/ui/projectSettingsPopup/ProjectSettingsPopup";
import { ProjectAdditionalPages } from "../../widgets/ui/ProjectAdditionalPages";
import type { AdditionalPage } from "../../shared/types/project";

export function ProjectDetailsPage() {
  const { id, historyId } = useParams();
  const [isOpenSetting, setIsOpenSetting] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const { data: additionalPages } = useGetAdditionalPagesQuery(id as string, { skip: !id });
  const [startCheckRun, { error: startCheckRunError }] = useStartCheckRunMutation();
  const {
    data: projectData,
    error: projectError,
    isLoading: isProjectLoading,
  } = useGetProjectQuery(id as string, { skip: !id });

  const {
    data: checkRunsData,
    error: checkRunsError,
  } = useGetCheckRunsQuery(id as string, { skip: !id });

  const project = projectData;
  const checkRuns = checkRunsData;
  const resolvedAdditionalPages = useMemo(() => {
    return additionalPages ?? project?.additionalPages ?? [];
  }, [additionalPages, project?.additionalPages]);
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

  const activePage: AdditionalPage | null = useMemo(() => {
    if (!selectedPageId) return null;
    return resolvedAdditionalPages.find((page) => page.id === selectedPageId) ?? null;
  }, [resolvedAdditionalPages, selectedPageId]);

  const activeCheckRun: CheckRun | undefined = useMemo(() => {
    if (!currentCheckRun) return undefined;
    if (!selectedPageId) return currentCheckRun;

    const pageSnapshot = currentCheckRun.additionalPages?.find(
      (page: CheckRunPageSnapshot) => page.id === selectedPageId
    );
    if (!pageSnapshot) return undefined;

    return {
      ...currentCheckRun,
      metrics: pageSnapshot.metrics,
      scripts: pageSnapshot.scripts,
    };
  }, [currentCheckRun, selectedPageId]);

  const chartRuns = useMemo(() => {
    if (!Array.isArray(checkRuns)) {
      return [];
    }

    if (!selectedPageId) {
      return checkRuns.filter((run: CheckRun) => run?.metrics?.[metricView]);
    }

    return checkRuns.flatMap((run: CheckRun) => {
      const pageSnapshot = run.additionalPages?.find((page) => page.id === selectedPageId);

      if (!pageSnapshot?.metrics?.[metricView]) {
        return [];
      }

      return [
        {
          ...run,
          metrics: pageSnapshot.metrics,
          scripts: pageSnapshot.scripts,
        },
      ];
    });
  }, [checkRuns, metricView, selectedPageId]);

  const activeTitle = activePage?.title ?? project?.name ?? "";
  const activeSubtitle = activePage?.url ?? project?.description ?? "";
  const activeStatus = activePage?.status ?? project?.status;

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

  const displayedMetrics: Metrics = activeCheckRun?.metrics ?? activePage?.metrics ?? project.metrics;

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
