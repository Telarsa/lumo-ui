import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EXAMPLES } from "./table";

afterEach(cleanup);

describe("Table examples", () => {
  it("ships a working Persian column-resize handle", () => {
    const resizing = EXAMPLES.examples.find((example) => example.id === "resizing");
    if (resizing === undefined) throw new Error("The resizing example is missing");

    render(resizing.render("fa-IR"));

    const handle = screen.getByRole("separator", { name: "تغییر پهنای ستون" });
    expect(handle.getAttribute("aria-valuenow")).toBe("200");

    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle.getAttribute("aria-valuenow")).toBe("190");
  });
});
