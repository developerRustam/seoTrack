export const CHECK_FREQUENCIES = [
    "HOURLY",
    "EVERY_6_HOURS",
    "EVERY_12_HOURS",
    "DAILY",
    "WEEKLY",
    "MONTHLY",
  ] as const;

  export type CheckFrequencyEnum = (typeof CHECK_FREQUENCIES)[number];