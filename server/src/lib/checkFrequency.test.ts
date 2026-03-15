import { describe, it, expect } from "vitest";
import { shouldRunProjectCheck } from "./checkFrequency.js";

describe("shouldRunProjectCheck", () => {
    const now = new Date();
    it("returns true when lastRunAt is null", () => {
        expect(shouldRunProjectCheck("HOURLY", null, now)).toBe(true);
    });

    it("returns false if interval has not elapsed", () => {
        const lastRunAt = new Date(now.getTime() - 30 * 60 * 1000);
        expect(shouldRunProjectCheck("HOURLY", lastRunAt, now)).toBe(false);
    });
    it("returns true if interval has elapsed exactly 1 hour", () => {
        const lastRunAt = new Date(now.getTime() - 60 * 60 * 1000);
        expect(shouldRunProjectCheck("HOURLY", lastRunAt, now)).toBe(true);
    });
    it("returns true if interval has elapsed", () => {
        const lastRunAt = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        expect(shouldRunProjectCheck("HOURLY", lastRunAt, now)).toBe(true);
    });

    it("respects different frequencies", () => {
        const lastRun6h = new Date(now.getTime() - 7 * 60 * 60 * 1000);
        expect(shouldRunProjectCheck("EVERY_6_HOURS", lastRun6h, now)).toBe(true);

        const lastRun6hNotElapsed = new Date(now.getTime() - 5 * 60 * 60 * 1000);
        expect(shouldRunProjectCheck("EVERY_6_HOURS", lastRun6hNotElapsed, now)).toBe(false);
    });

    it("throws on invalid frequency", () => {
        const lastRunAt = new Date(now.getTime() - 60 * 60 * 1000);
      
        // @ts-expect-error
        expect(() => shouldRunProjectCheck("INVALID", lastRunAt, now)).toThrow();
      });

});
