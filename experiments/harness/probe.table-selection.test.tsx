/**
 * EXPERIMENT PROBE — branch `experiment/base-ui`.
 *
 * Does `<Checkbox slot="selection">` still select rows once Checkbox is a Base
 * UI component? `table.tsx` is unchanged and still React Aria; only the
 * checkbox it renders was swapped. `data-display.test.tsx` passes either way,
 * because it grades NAMES, not wiring — so this is the probe that asks the
 * question that suite does not.
 *
 *   cp experiments/harness/probe.table-selection.test.tsx packages/ui/src/
 *   pnpm --filter @lumo-ui/ui exec vitest run src/probe.table-selection.test.tsx
 *   rm packages/ui/src/probe.table-selection.test.tsx
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
  TableSelectAllColumn,
  TableSelectionCell,
} from "./table.tsx";

afterEach(cleanup);

const OUT = resolve(process.cwd(), "../../experiments/measurements/probe.table-selection.json");

it("records whether slot=selection still drives row selection", async () => {
  render(
    <Table label="سفارش‌ها" selectionMode="multiple">
      <TableHeader>
        <TableSelectAllColumn label="انتخاب همه" />
        <Column id="name" isRowHeader>
          نام
        </Column>
      </TableHeader>
      <TableBody>
        <Row id="1">
          <TableSelectionCell label="انتخاب ردیف" />
          <Cell>سارا</Cell>
        </Row>
        <Row id="2">
          <TableSelectionCell label="انتخاب ردیف" />
          <Cell>رضا</Cell>
        </Row>
      </TableBody>
    </Table>,
  );

  const rowsSelectedBefore = [...document.querySelectorAll('[role="row"]')].map((r) =>
    r.getAttribute("aria-selected"),
  );

  const selectAll = screen.getByRole("checkbox", { name: "انتخاب همه" });
  await act(async () => {
    (selectAll as HTMLElement).click();
  });

  const rowsSelectedAfter = [...document.querySelectorAll('[role="row"]')].map((r) =>
    r.getAttribute("aria-selected"),
  );

  const record = {
    select_all_found: selectAll !== null,
    select_all_tag: selectAll.tagName.toLowerCase(),
    select_all_role_source:
      selectAll.getAttribute("role") ?? `native ${selectAll.tagName.toLowerCase()}`,
    select_all_aria_checked_after_click: selectAll.getAttribute("aria-checked"),
    rows_aria_selected_before: rowsSelectedBefore,
    rows_aria_selected_after: rowsSelectedAfter,
    selection_propagated: rowsSelectedBefore.join(",") !== rowsSelectedAfter.join(","),
  };

  writeFileSync(OUT, `${JSON.stringify(record, null, 2)}\n`);
  expect(record.select_all_found).toBe(true);
});
