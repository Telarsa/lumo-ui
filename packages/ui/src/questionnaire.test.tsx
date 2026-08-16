import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Questionnaire, type QuestionnaireItem } from "./questionnaire.tsx";

afterEach(cleanup);

const items: readonly QuestionnaireItem[] = [
  {
    id: "scope",
    title: "دامنهٔ تغییر چیست؟",
    description: "یک گزینه را انتخاب کنید.",
    required: true,
    requiredMessage: "یک دامنه انتخاب کنید",
    choices: [
      { value: "component", label: "فقط کامپوننت" },
      { value: "feature", label: "کل قابلیت" },
    ],
  },
  {
    id: "checks",
    title: "کدام بررسی‌ها اجرا شوند؟",
    multiple: true,
    allowSkip: true,
    choices: [
      { value: "tests", label: "آزمون‌ها" },
      { value: "types", label: "بررسی نوع‌ها" },
    ],
  },
];

const strings = {
  progressLabel: "پیشرفت پرسش‌نامه",
  progressTemplate: "پرسش {current} از {total}",
  previous: "قبلی",
  next: "بعدی",
  skip: "رد کردن",
  submit: "ثبت پاسخ‌ها",
};

describe("Questionnaire", () => {
  it("server-renders the first active fieldset, localized progress, and native answers", () => {
    const html = renderToStaticMarkup(
      <Questionnaire
        locale="fa-IR"
        items={items}
        strings={strings}
        defaultValue={{ scope: ["component"] }}
      />,
    );

    expect(html).toContain('aria-label="پیشرفت پرسش‌نامه"');
    expect(html).toContain("پرسش ۱ از ۲");
    expect(html).toContain("دامنهٔ تغییر چیست؟");
    expect(html).not.toContain("کدام بررسی‌ها اجرا شوند؟");
    expect(html).toContain('name="scope"');
    expect(html).toContain('value="component"');
    expect(html).toContain("checked");
  });

  it("blocks required navigation with the caller-authored message", () => {
    render(<Questionnaire locale="fa-IR" items={items} strings={strings} />);

    fireEvent.click(screen.getByRole("button", { name: strings.next }));

    expect(screen.getByRole("alert").textContent).toContain("یک دامنه انتخاب کنید");
    expect(
      screen.getByRole("group", { name: "دامنهٔ تغییر چیست؟" }).getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("advances after an answer and reports both answer and active-id changes", () => {
    const onValueChange = vi.fn();
    const onActiveIdChange = vi.fn();
    render(
      <Questionnaire
        locale="fa-IR"
        items={items}
        strings={strings}
        onValueChange={onValueChange}
        onActiveIdChange={onActiveIdChange}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "فقط کامپوننت" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ scope: ["component"] });
    fireEvent.click(screen.getByRole("button", { name: strings.next }));

    expect(onActiveIdChange).toHaveBeenLastCalledWith("checks");
    expect(document.activeElement).toBe(
      screen.getByRole("group", { name: "کدام بررسی‌ها اجرا شوند؟" }),
    );
    expect(screen.getByText("پرسش ۲ از ۲")).not.toBeNull();
  });

  it("supports multiple answers, explicit skip, and backward navigation", () => {
    render(
      <Questionnaire
        locale="en-US"
        items={items}
        strings={{ ...strings, progressTemplate: "Question {current} of {total}" }}
        defaultActiveId="checks"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "آزمون‌ها" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "بررسی نوع‌ها" }));
    expect((screen.getByRole("checkbox", { name: "آزمون‌ها" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("checkbox", { name: "بررسی نوع‌ها" }) as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: strings.previous }));
    expect(screen.getByRole("group", { name: "دامنهٔ تغییر چیست؟" })).not.toBeNull();
  });

  it("submits the complete answer model from the last item", () => {
    const onSubmitAnswers = vi.fn();
    render(
      <Questionnaire
        locale="fa-IR"
        items={items}
        strings={strings}
        defaultActiveId="checks"
        defaultValue={{ scope: ["feature"], checks: ["tests"] }}
        onSubmitAnswers={onSubmitAnswers}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: strings.submit }));
    expect(onSubmitAnswers).toHaveBeenCalledWith({ scope: ["feature"], checks: ["tests"] });
  });

  it("skips disabled items and rejects invalid active ids", () => {
    const conditional: readonly QuestionnaireItem[] = [
      items[0]!,
      { ...items[1]!, disabled: true },
      {
        id: "finish",
        title: "آماده‌اید؟",
        allowSkip: true,
        choices: [{ value: "yes", label: "بله" }],
      },
    ];
    render(
      <Questionnaire
        locale="fa-IR"
        items={conditional}
        strings={strings}
        defaultValue={{ scope: ["component"] }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: strings.next }));
    expect(screen.getByRole("group", { name: "آماده‌اید؟" })).not.toBeNull();

    expect(() =>
      renderToStaticMarkup(
        <Questionnaire
          locale="fa-IR"
          items={items}
          strings={strings}
          activeId="missing"
        />,
      ),
    ).toThrow(/activeId/i);
  });
});
