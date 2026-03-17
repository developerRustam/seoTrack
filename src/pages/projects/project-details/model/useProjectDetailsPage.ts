import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  useGetAdditionalPagesQuery,
  useGetCheckRunsQuery,
  useGetProjectQuery,
  useStartCheckRunMutation,
} from "../../../../entities/project/api/projectsApi";
import type { Metrics, MetricView } from "../../../../shared/types/metrics";
import type { AdditionalPage } from "../../../../shared/types/project";
import type { CheckRun, CheckRunPageSnapshot } from "../../../../shared/types/run";

type UseProjectDetailsPageParams = {
  projectId?: string;
  historyId?: string
};

type UseProjectDetailsPageResult = {
  project: ReturnType<typeof useGetProjectQuery>["data"];
  projectError: ReturnType<typeof useGetProjectQuery>["error"];
  isProjectLoading: boolean;
  checkRuns: ReturnType<typeof useGetCheckRunsQuery>["data"];
  checkRunsError: ReturnType<typeof useGetCheckRunsQuery>["error"];
  additionalPages: ReturnType<typeof useGetAdditionalPagesQuery>["data"];
  metricView: MetricView;
  setMetricView: Dispatch<SetStateAction<MetricView>>;
  selectedPageId: string | null;
  setSelectedPageId: Dispatch<SetStateAction<string | null>>;
  isOpenSetting: boolean;
  setIsOpenSetting: Dispatch<SetStateAction<boolean>>;
  isStarting: boolean;
  startCheckRunError: ReturnType<typeof useStartCheckRunMutation>[1]["error"];
  startCheck: () => Promise<void>;
  resolvedAdditionalPages: Array<AdditionalPage>;
  currentCheckRun: CheckRun | undefined;
  activeCheckRun: CheckRun | undefined;
  activePage: AdditionalPage | null;
  chartRuns: CheckRun[];
  activeTitle:  string;
  activeSubtitle:  string;
  isPending: boolean;
  activeStatus:  string | undefined;
  displayedMetrics: Metrics;
};

export function useProjectDetailsPage({projectId, historyId}: UseProjectDetailsPageParams): UseProjectDetailsPageResult {
  const [metricView, setMetricView] = useState<MetricView>("desc");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isOpenSetting, setIsOpenSetting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const { data: additionalPages } = useGetAdditionalPagesQuery(projectId as string, {
    skip: !projectId,
  });
  const [startCheckRun, { error: startCheckRunError }] = useStartCheckRunMutation();
  const {
    data: project,
    error: projectError,
    isLoading: isProjectLoading,
  } = useGetProjectQuery(projectId as string, { skip: !projectId });
  const { data: checkRuns, error: checkRunsError } = useGetCheckRunsQuery(
    projectId as string,
    { skip: !projectId }
  );
  const resolvedAdditionalPages = useMemo(() => {
    return additionalPages ?? project?.additionalPages ?? [];
  }, [additionalPages, project?.additionalPages]);

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

  const activePage: AdditionalPage | null = useMemo(() => {
    if (!selectedPageId) return null;
    return resolvedAdditionalPages.find((page) => page.id === selectedPageId) ?? null;
  }, [resolvedAdditionalPages, selectedPageId]);

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
  const EMPTY_METRICS: Metrics = {
    desc: { lcp: 0, cls: 0, inp: 0, ttfb: 0, seoScore: 0 },
    mob: { lcp: 0, cls: 0, inp: 0, ttfb: 0, seoScore: 0 },
  };
  const displayedMetrics: Metrics = activeCheckRun?.metrics ?? activePage?.metrics ?? project?.metrics ?? EMPTY_METRICS;

  const isPending =
  currentCheckRun?.status === "RUNNING" || currentCheckRun?.status === "QUEUED";
  async function startCheck() {
    if (!projectId) return;

    setIsStarting(true);
    try {
      await startCheckRun(projectId).unwrap();
    } finally {
      setIsStarting(false);
    }
  }

  return {
    project,
    activeTitle,
    activeSubtitle,
    activeStatus,
    projectError,
    isProjectLoading,
    checkRuns,
    checkRunsError,
    additionalPages,
    activePage,
    isPending,
    displayedMetrics,
    chartRuns,
    metricView,
    currentCheckRun,
    resolvedAdditionalPages,
    activeCheckRun,
    setMetricView,
    selectedPageId,
    setSelectedPageId,
    isOpenSetting,
    setIsOpenSetting,
    isStarting,
    startCheckRunError,
    startCheck,
  };
}
