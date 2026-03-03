import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckRunPopup } from "./CheckRunPopup";
import { describe, expect, it, vi } from "vitest";

describe("CheckRunPopup", () => {
  it("does not render when open is false", () => {
    render(
      <CheckRunPopup
        open={false}
        status="idle"
        title="Hidden title"
        onClose={() => {}}
      />
    );

    expect(screen.queryByText("Hidden title")).not.toBeInTheDocument();
  });

  it("renders content and handles close button click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <CheckRunPopup
        open
        status="success"
        title="Run finished"
        subtitle="Project: storefront"
        message="Metrics updated"
        onClose={onClose}
      />
    );

    expect(screen.getByText("Run finished")).toBeInTheDocument();
    expect(screen.getByText("Project: storefront")).toBeInTheDocument();
    expect(screen.getByText("Metrics updated")).toBeInTheDocument();

    const [closeButton] = screen.getAllByRole("button");
    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
