type CheckFrequency =
  | "HOURLY"
  | "EVERY_6_HOURS"
  | "EVERY_12_HOURS"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY";

export function shouldRunProjectCheck(checkFrequency: CheckFrequency, lastRunAt: Date | null, now: Date):boolean {
    if (lastRunAt === null) {
        return true;
      }
    const intervalMs = getFrequencyIntervalMs(checkFrequency);
    const elapsedMs = now.getTime() - lastRunAt.getTime();
    return elapsedMs >= intervalMs;
}

export function getFrequencyIntervalMs(checkFrequency: CheckFrequency):number  {
    switch (checkFrequency) {
        case "HOURLY":
          return 60 * 60 * 1000;
        case "EVERY_6_HOURS":
          return 6 * 60 * 60 * 1000;
        case "EVERY_12_HOURS":
          return 12 * 60 * 60 * 1000;
        case "DAILY":
          return 24 * 60 * 60 * 1000;
        case "WEEKLY":
          return 7 * 24 * 60 * 60 * 1000;
        case "MONTHLY":
          return 30 * 24 * 60 * 60 * 1000;
        default:
          throw new Error(`Unsupported check frequency: ${checkFrequency}`);
      }
}