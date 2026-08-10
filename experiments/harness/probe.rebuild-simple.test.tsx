/**
 * EXPERIMENT PROBE — branch `experiment/base-ui`.
 *
 * Renders the four rebuilt components under `fa-IR` and records what the DOM
 * and the served bytes actually carry, so `rebuild-simple.json` holds measured
 * attribute names rather than remembered ones.
 *
 * It is a `.test.tsx` because it needs jsdom and the repo's React plugin, and
 * `packages/ui/vitest.config.ts` supplies both. To re-run:
 *
 *   cp experiments/harness/probe.rebuild-simple.test.tsx packages/ui/src/
 *   pnpm --filter @lumo-ui/ui exec vitest run src/probe.rebuild-simple.test.tsx
 *   rm packages/ui/src/probe.rebuild-simple.test.tsx
 *
 * It is kept OUT of packages/ui/src so a `vitest run` with no path argument —
 * a sibling agent's, or CI's — does not pick up an experiment's probe.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { Button, IconButton } from "./button.tsx";
import { Checkbox, CheckboxGroup } from "./checkbox.tsx";
import { Switch } from "./switch.tsx";
import { IconToggle, Toggle } from "./toggle.tsx";
import { LumoProvider } from "./provider.tsx";

afterEach(cleanup);

/**
 * `import.meta.url` is a Vite `/@fs/…` URL under vitest, not a filesystem path,
 * so the output location is resolved from `process.cwd()` — which vitest sets
 * to `packages/ui`, the config's root.
 */
const OUT = resolve(process.cwd(), "../../experiments/measurements/probe.rebuild-simple.json");

/** Every attribute on every element, flattened, so nothing is assumed. */
function attributesIn(root: Element): string[] {
  const seen = new Set<string>();
  for (const el of [root, ...root.querySelectorAll("*")]) {
    for (const a of el.attributes) seen.add(`${el.tagName.toLowerCase()}[${a.name}]`);
  }
  return [...seen].sort();
}

/** Latin words of 3+ letters in any spoken attribute or in the text. */
function englishIn(html: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/(?:aria-label|aria-roledescription|aria-valuetext|title)="([^"]*)"/g)) {
    for (const w of m[1].match(/[A-Za-z]{3,}/g) ?? []) out.add(w);
  }
  for (const w of html.replace(/<[^>]+>/g, " ").match(/[A-Za-z]{3,}/g) ?? []) out.add(w);
  return [...out].sort();
}

function fa(node: React.ReactElement) {
  return <LumoProvider locale="fa-IR">{node}</LumoProvider>;
}

it("records what the Base UI rebuilds emit", () => {
  const record: Record<string, unknown> = {};

  // ── button ──────────────────────────────────────────────────────────────
  {
    const { container } = render(fa(<Button variant="solid">ذخیره</Button>));
    const el = container.querySelector("button")!;
    record.button = {
      tag: el.tagName.toLowerCase(),
      attributes: attributesIn(el),
      has_data_hovered: el.hasAttribute("data-hovered"),
      has_data_pressed: el.hasAttribute("data-pressed"),
      has_data_focus_visible: el.hasAttribute("data-focus-visible"),
      has_data_disabled: el.hasAttribute("data-disabled"),
      html: el.outerHTML,
    };
    cleanup();
    const disabled = render(fa(<Button isDisabled>ذخیره</Button>)).container.querySelector("button")!;
    (record.button as Record<string, unknown>).disabled_attributes = attributesIn(disabled);
    cleanup();
    const ssr = renderToStaticMarkup(
      fa(
        <IconButton label="حذف">
          <svg aria-hidden="true" />
        </IconButton>,
      ),
    );
    (record.button as Record<string, unknown>).icon_ssr = ssr;
    (record.button as Record<string, unknown>).icon_ssr_english = englishIn(ssr);
  }

  // ── toggle ──────────────────────────────────────────────────────────────
  {
    const { container } = render(fa(<Toggle defaultSelected>پررنگ</Toggle>));
    const on = container.querySelector("button")!;
    cleanup();
    const off = render(fa(<Toggle>پررنگ</Toggle>)).container.querySelector("button")!;
    record.toggle = {
      on_attributes: attributesIn(on),
      off_attributes: attributesIn(off),
      on_has_data_selected: on.hasAttribute("data-selected"),
      on_has_data_pressed: on.hasAttribute("data-pressed"),
      on_aria_pressed: on.getAttribute("aria-pressed"),
      off_aria_pressed: off.getAttribute("aria-pressed"),
      on_html: on.outerHTML,
    };
    cleanup();
    const ssr = renderToStaticMarkup(
      fa(
        <IconToggle label="بی‌صدا">
          <svg aria-hidden="true" />
        </IconToggle>,
      ),
    );
    (record.toggle as Record<string, unknown>).icon_ssr = ssr;
    (record.toggle as Record<string, unknown>).icon_ssr_english = englishIn(ssr);
  }

  // ── switch ──────────────────────────────────────────────────────────────
  {
    const { container } = render(
      fa(
        <Switch defaultSelected description="هر روز صبح">
          خلاصهٔ روزانه
        </Switch>,
      ),
    );
    const root = container.firstElementChild!;
    const control = container.querySelector('[role="switch"]');
    record.switch = {
      role_switch_found: control !== null,
      role_switch_tag: control?.tagName.toLowerCase() ?? null,
      aria_checked: control?.getAttribute("aria-checked") ?? null,
      control_attributes: control === null ? [] : attributesIn(control),
      all_attributes: attributesIn(root),
      has_data_selected_anywhere: container.querySelector("[data-selected]") !== null,
      has_data_checked_anywhere: container.querySelector("[data-checked]") !== null,
      description_wired:
        control?.getAttribute("aria-describedby") !== null &&
        control?.getAttribute("aria-describedby") !== undefined,
      html: root.outerHTML,
    };
    cleanup();
    const ssr = renderToStaticMarkup(
      fa(
        <Switch isInvalid errorMessage="نمایه باید عمومی باشد">
          نمایهٔ عمومی
        </Switch>,
      ),
    );
    (record.switch as Record<string, unknown>).invalid_ssr = ssr;
    (record.switch as Record<string, unknown>).invalid_ssr_english = englishIn(ssr);
  }

  // ── checkbox ────────────────────────────────────────────────────────────
  {
    const { container } = render(fa(<Checkbox defaultSelected>شرایط را می‌پذیرم</Checkbox>));
    const root = container.firstElementChild!;
    const control = container.querySelector('[role="checkbox"], input[type="checkbox"]');
    record.checkbox = {
      control_role_tag: control?.tagName.toLowerCase() ?? null,
      aria_checked: control?.getAttribute("aria-checked") ?? null,
      all_attributes: attributesIn(root),
      has_data_selected_anywhere: container.querySelector("[data-selected]") !== null,
      has_data_checked_anywhere: container.querySelector("[data-checked]") !== null,
      // Both marks carry `hidden` and only a `group-data-selected:` utility to
      // reveal them. If nothing in the tree carries `data-selected`, the tick
      // is unreachable in CSS — this records the class strings as shipped.
      mark_classes: [...container.querySelectorAll("svg")].map((s) => s.getAttribute("class")),
      html: root.outerHTML,
    };
    cleanup();
    const group = render(
      fa(
        <CheckboxGroup label="کانال‌های اطلاع‌رسانی">
          <Checkbox value="email">ایمیل</Checkbox>
          <Checkbox value="sms">پیامک</Checkbox>
        </CheckboxGroup>,
      ),
    ).container;
    const roleGroup = group.querySelector('[role="group"]');
    (record.checkbox as Record<string, unknown>).group = {
      role_group_found: roleGroup !== null,
      aria_labelledby: roleGroup?.getAttribute("aria-labelledby") ?? null,
      resolved_name:
        group.ownerDocument.getElementById(roleGroup?.getAttribute("aria-labelledby") ?? "")
          ?.textContent ?? null,
      html: group.innerHTML,
    };
    cleanup();
    const ssr = renderToStaticMarkup(
      fa(
        <CheckboxGroup label="کانال‌های اطلاع‌رسانی">
          <Checkbox value="email">ایمیل</Checkbox>
        </CheckboxGroup>,
      ),
    );
    (record.checkbox as Record<string, unknown>).group_ssr_english = englishIn(ssr);
    (record.checkbox as Record<string, unknown>).group_ssr = ssr;
  }

  writeFileSync(OUT, `${JSON.stringify(record, null, 2)}\n`);
  expect(record.button).toBeTruthy();
});
