import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { Kbd } from "./kbd.tsx";

afterEach(cleanup);

describe("Kbd public root", () => {
  it("delivers DOM props while retaining its LTR island", () => {
    render(<Kbd keys={["Ctrl", "K"]} aria-label="میانبر جستجو" data-testid="shortcut" />);
    const root = screen.getByTestId("shortcut");
    expect(root.getAttribute("aria-label")).toBe("میانبر جستجو");
    expect(root.getAttribute("dir")).toBe("ltr");
  });
});
