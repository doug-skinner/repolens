import { describe, expect, test, mock, afterEach } from "bun:test";
import React from "react";
import { render, cleanup } from "ink-testing-library";
import { HelpOverlay } from "../src/components/help-overlay.js";

const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

afterEach(() => {
  cleanup();
});

describe("HelpOverlay", () => {
  test("renders keybinding sections", () => {
    const { lastFrame } = render(<HelpOverlay onClose={() => {}} />);
    const frame = lastFrame()!;

    expect(frame).toContain("Keybindings");
    expect(frame).toContain("Global");
    expect(frame).toContain("List views");
    expect(frame).toContain("Quit");
    expect(frame).toContain("Refresh all data");
    expect(frame).toContain("Navigate items");
    expect(frame).toContain("Open in browser");
  });

  test("calls onClose when ? is pressed", async () => {
    const onClose = mock(() => {});
    const { stdin } = render(<HelpOverlay onClose={onClose} />);

    await delay();
    stdin.write("?");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("calls onClose when Escape is pressed", async () => {
    const onClose = mock(() => {});
    const { stdin } = render(<HelpOverlay onClose={onClose} />);

    await delay();
    stdin.write("\x1B");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("does not call onClose for other keys", async () => {
    const onClose = mock(() => {});
    const { stdin } = render(<HelpOverlay onClose={onClose} />);

    await delay();
    stdin.write("a");
    stdin.write("r");
    stdin.write("q");
    expect(onClose).toHaveBeenCalledTimes(0);
  });
});
