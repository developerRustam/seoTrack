import { describe, it, expect } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("formats ISO string to ru-RU short date-time", () => {

    const input = "2023-11-10T15:45:00Z";
    const formatted = formatDate(input);
    expect(formatted).toMatch(/10\.11\.23, \d{2}:45/);
  });
  it('if  function  gets empty string',  () => {
    const value  =  '';
    expect(formatDate(value)).toBe('N/A');
  })
});
