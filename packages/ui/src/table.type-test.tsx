/**
 * Compile-time pin for the Table family: `label` and `locale` are required and
 * the grid owns its name (`aria-label`/`role` rejected), a sortable column
 * carries BOTH sort labels, selection/resizer cells carry their `label`, and a
 * bare number child does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Cell, Column, ColumnResizer, Row, Table, TableBody, TableHeader, TableSelectAllColumn, TableSelectionCell, type TableProps } from "./table.tsx";

// @ts-expect-error label is required: it names the grid
void <Table locale="fa-IR" />;
// @ts-expect-error locale is required: it formats every number in the grid
void <Table label="جدول" />;
// @ts-expect-error aria-label is owned: `label` is the one name
const named: TableProps = { label: "جدول", locale: "fa-IR", "aria-label": "جدول" };
void named;
// @ts-expect-error role is owned: the grid decides grid/treegrid
void <Table label="جدول" locale="fa-IR" role="table" />;
// @ts-expect-error allowsSorting without its labels: the sort button would be nameless
void <Column id="a" allowsSorting>نام</Column>;
// @ts-expect-error a sort label without allowsSorting: a label for a button that never renders
void <Column id="a" sortAscendingLabel="صعودی">نام</Column>;
// @ts-expect-error the select-all column's label is required
void <TableSelectAllColumn />;
// @ts-expect-error the selection cell's label is required
void <TableSelectionCell />;
// @ts-expect-error the resizer's label is required
void <ColumnResizer valueText={(v) => `${v}`} />;
// @ts-expect-error a bare number child is not a LumoNode
void <Cell>{5}</Cell>;

void (
  <Table label="جدول" locale="fa-IR">
    <TableHeader>
      <Column id="a" isRowHeader allowsSorting sortAscendingLabel="صعودی" sortDescendingLabel="نزولی" resizer={<ColumnResizer label="تغییر عرض" valueText={(v) => `${v}`} />}>نام</Column>
    </TableHeader>
    <TableBody renderEmptyState="خالی">
      <Row><Cell isRowHeader>الف</Cell></Row>
    </TableBody>
  </Table>
);
