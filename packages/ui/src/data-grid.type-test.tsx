/**
 * Compile-time pin for the DataGrid family: `locale`, the search's `clearLabel`,
 * the editable cell's `cancelLabel` and the pagination's five strings are
 * required, page sizes are all-or-nothing, and a bare number child does not
 * compile. An unused `@ts-expect-error` fails `tsc`.
 */
import {
  DataGrid,
  DataGridEditableCell,
  DataGridPagination,
  DataGridSearch,
  DataGridToolbar,
  type DataGridTableInstance,
} from "./data-grid.tsx";

declare const table: DataGridTableInstance;

// @ts-expect-error locale is required: it formats every number in the grid
void <DataGrid table={table} />;
// @ts-expect-error clearLabel is required: the clear button would be nameless
void <DataGridSearch label="جستجو" />;
// @ts-expect-error cancelLabel is required: the cancel button would be nameless
void <DataGridEditableCell label="نام" value="" onCommit={() => undefined} />;
// @ts-expect-error label is required: it names the pagination nav
void <DataGridPagination previousLabel="قبلی" nextLabel="بعدی" pageLabel={(p) => p} rangeLabel={(a, b, c) => `${a}${b}${c}`} />;
// @ts-expect-error pageSizes without pageSizeLabel: the size select would be nameless
void <DataGridPagination label="صفحه‌بندی" previousLabel="قبلی" nextLabel="بعدی" pageLabel={(p) => p} rangeLabel={(a, b, c) => `${a}${b}${c}`} pageSizes={[10, 20]} />;
// @ts-expect-error a bare number child is not a LumoNode
void <DataGridToolbar>{5}</DataGridToolbar>;

void <DataGrid locale="fa-IR" table={table}><DataGridToolbar><DataGridSearch label="جستجو" clearLabel="پاک کردن" /></DataGridToolbar></DataGrid>;
void <DataGridPagination label="صفحه‌بندی" previousLabel="قبلی" nextLabel="بعدی" pageLabel={(p) => `صفحه ${p}`} rangeLabel={(a, b, c) => `${a}–${b} از ${c}`} pageSizes={[10, 20]} pageSizeLabel="اندازه صفحه" />;
