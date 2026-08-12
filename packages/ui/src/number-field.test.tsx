import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { NumberField } from "./number-field.tsx";

afterEach(cleanup);

const labels = {
  label: "تعداد",
  decrementLabel: "کم کردن تعداد",
  incrementLabel: "زیاد کردن تعداد",
  roleDescription: "ورودی عدد",
};

describe("NumberField validation and errors", () => {
  it("renders and associates an authored error", () => {
    render(<NumberField {...labels} errorMessage="تعداد نامعتبر است" />);
    const input = screen.getByRole("textbox");
    const error = screen.getByRole("alert");
    expect(error.textContent).toBe("تعداد نامعتبر است");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(error.id);
  });

  it("runs validate and exposes its result through the same error seam", () => {
    const { rerender } = render(
      <NumberField {...labels} value={-1} validate={(value) => value < 0 ? "عدد منفی است" : true} />,
    );
    expect(screen.getByRole("alert").textContent).toBe("عدد منفی است");
    rerender(
      <NumberField {...labels} value={1} validate={(value) => value < 0 ? "عدد منفی است" : true} />,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
