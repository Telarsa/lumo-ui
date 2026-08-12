import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { DateText, Num } from "./num.tsx";

describe("Intl option surfaces", () => {
  it("forwards the complete NumberFormat options surface", () => {
    const html = renderToStaticMarkup(
      <Num value={12} locale="en-US" style="unit" unit="kilometer" unitDisplay="long" signDisplay="always" />,
    );
    expect(html).toContain("+12 kilometers");
  });

  it("forwards time and time-zone DateTimeFormat options", () => {
    const html = renderToStaticMarkup(
      <DateText
        value={new Date("2026-08-12T12:30:00.000Z")}
        locale="en-US"
        timeZone="UTC"
        hour="2-digit"
        minute="2-digit"
      />,
    );
    expect(html).toContain("12:30");
  });
});
