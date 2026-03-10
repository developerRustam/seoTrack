import type {Metrics} from  './metrics'
export type RunStatus = "ok" | "warning" | "critical" | "RUNNING" | "QUEUED" | "FAIL";


export type ScriptChange =
  | { type: "added"; src: string }
  | { type: "removed"; src: string }
  | { type: "weightChanged"; src: string; prevKb: number; nextKb: number };

export type ScriptInfo = {
  domain: string;
  impactDescription: string;
  impactMs: number;
  sizeKb: number;
  type: "third-party" | "internal";
  url: string;
};

export type CheckRunPageSnapshot = {
  id: string;
  title: string;
  url: string;
  enabled: boolean;
  status: "ok" | "warning" | "error";
  metrics: Metrics;
  scripts: ScriptInfo[];
};

export type CheckRun = {
  id: string;
  projectId: string;
  createdAt:string;
  finishedAt: string;
  status: RunStatus;
  metrics: Metrics;
  scriptChanges: ScriptChange[];
  scripts: ScriptInfo[];
  additionalPages?: CheckRunPageSnapshot[];
};
export type ActiveCheckRun = {
  runId: string;
  projectId: string;
  projectName: string;
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAIL";
  active: boolean;
  startedAt?: string | null;
  finishedAt?: string | null;
} | null;

export type IncidentLevel = "warning" | "critical";

export type IncidentItem = {
  id: string;
  projectId: string | null;
  projectName: string;
  metric: string;
  level: IncidentLevel;
  timeText: string;
  createdAt: string;
};
