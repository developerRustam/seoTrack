import {type Metrics} from  './metrics'
export type ProjectStatus = "ok" | "warning" | "error";

export type ProjectScript = {
  url: string;
  domain: string;
  type: string;
  impactMs: number;
  impactDescription: string;
};
export type AdditionalPage = { 
  id: string; 
  status: ProjectStatus;
  title: string; 
  url: string; 
  enabled: boolean 
  metrics: Metrics;
  scripts:ProjectScript[]
}
export type Project = {
    id: string;
    name: string;
    status: ProjectStatus;
    description: string;
    alerts: number;
    url: string;
    additionalPages: AdditionalPage[];
    lastIncidentAt: string;
    user: {
      id: string,
      email: string,
      createAt:string,
      name: string
    };
    metrics: Metrics;
    scripts:ProjectScript[]
  };
  export const CHECK_FREQUENCIES = [
    "DISABLED",
    "HOURLY",
    "EVERY_6_HOURS",
    "EVERY_12_HOURS",
    "DAILY",
    "WEEKLY",
    "MONTHLY",
  ] as const;

  export type CheckFrequencyEnum = (typeof CHECK_FREQUENCIES)[number];
