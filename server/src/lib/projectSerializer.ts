import { getPageStatus } from "./metrics.js";
import { normalizeAdditionalPages, normalizeMetricsSnapshot } from "./projectNormalization.js";

export function serializeProject(project: {
    id: string;
    name: string;
    url: string;
    description: string | null;
    alerts: number;
    lastIncidentAt: Date | null;
    metrics: unknown;
    additionalPages: unknown;
    checkFrequency: string;
    user?: unknown;
    userId?: string;
    createdAt?: Date;
  }) {
    const metrics = normalizeMetricsSnapshot(project.metrics);
  
    return {
      ...project,
      description: project.description ?? "",
      lastIncidentAt: project.lastIncidentAt?.toISOString() ?? "",
      metrics,
      additionalPages: normalizeAdditionalPages(project.additionalPages),
      scripts: [],
      status: getPageStatus(metrics),
    };
  }