import { render, screen } from "@testing-library/react";
import type { Project } from "../../shared/types/project";
import { ProjectMetricsPanel } from "./ProjectMetricsPanel";

const mockProject: Project = {
  id: "p1",
  name: "Storefront",
  status: "ok",
  description: "Main store page",
  alerts: 0,
  lastIncidentAt: "",
  user: {
    id: "u1",
    email: "owner@example.com",
    createAt: "2026-01-01T00:00:00.000Z",
    name: "Owner",
  },
  metrics: {
    desc: {
      lcp: 1200,
      cls: 0.08,
      inp: 180,
      ttfb: 700,
      seoScore: 96,
    },
    mob: {
      lcp: 2600,
      cls: 0.14,
      inp: 320,
      ttfb: 1100,
      seoScore: 84,
    },
  },
  scripts: [],
};

describe("ProjectMetricsPanel", () => {
  it("renders desktop metric values for desc view", () => {
    render(<ProjectMetricsPanel metricView="desc" project={mockProject} />);

    expect(screen.getByText("1200")).toBeInTheDocument();
    expect(screen.getByText("96")).toBeInTheDocument();
  });

  it("renders mobile metric values for mob view", () => {
    render(<ProjectMetricsPanel metricView="mob" project={mockProject} />);

    expect(screen.getByText("2600")).toBeInTheDocument();
    expect(screen.getByText("84")).toBeInTheDocument();
  });
});
