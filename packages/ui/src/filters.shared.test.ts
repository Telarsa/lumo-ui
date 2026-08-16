import { describe, expect, it, vi } from "vitest";
import {
  createFilter,
  createFilterGroup,
  executeQuery,
  parseQuery,
  queryIssues,
  serializeQuery,
  type QueryExecutionField,
} from "./filters.shared.ts";

interface Order {
  id: string;
  status: "open" | "closed";
  title: string;
  total: number;
}

const rows: readonly Order[] = [
  { id: "1", status: "open", title: "Quarterly report", total: 120 },
  { id: "2", status: "closed", title: "Incident report", total: 40 },
  { id: "3", status: "open", title: "Invoice", total: 15 },
];

const fields: readonly QueryExecutionField<Order>[] = [
  {
    id: "status",
    read: (row) => row.status,
    operators: [
      { id: "is", test: (value, values) => values.includes(String(value)) },
      { id: "is-not", test: (value, values) => !values.includes(String(value)) },
    ],
  },
  {
    id: "title",
    read: (row) => row.title,
    operators: [
      {
        id: "contains",
        test: (value, values) => String(value).toLocaleLowerCase().includes(values[0]?.toLocaleLowerCase() ?? ""),
      },
    ],
  },
  {
    id: "total",
    read: (row) => row.total,
    operators: [{ id: "gte", test: (value, values) => Number(value) >= Number(values[0]) }],
  },
];

describe("query execution", () => {
  it("keeps the existing clause-array model as an implicit AND query", () => {
    const query = [
      createFilter("status", "is", ["open"], "status-open"),
      createFilter("title", "contains", ["report"], "title-report"),
    ];

    expect(executeQuery(rows, query, fields).map((row) => row.id)).toEqual(["1"]);
  });

  it("executes nested AND/OR groups without flattening their meaning", () => {
    const query = createFilterGroup(
      "or",
      [
        createFilter("status", "is", ["closed"], "closed"),
        createFilterGroup(
          "and",
          [
            createFilter("status", "is", ["open"], "open"),
            createFilter("total", "gte", ["100"], "large"),
          ],
          "large-open",
        ),
      ],
      "root",
    );

    expect(executeQuery(rows, query, fields).map((row) => row.id)).toEqual(["1", "2"]);
  });

  it("short-circuits AND groups before an expensive later predicate", () => {
    const expensive = vi.fn(() => true);
    const queryFields: readonly QueryExecutionField<Order>[] = [
      ...fields,
      { id: "expensive", read: (row) => row, operators: [{ id: "run", test: expensive }] },
    ];
    const query = [
      createFilter("status", "is", ["missing"], "never"),
      createFilter("expensive", "run", [], "expensive"),
    ];

    expect(executeQuery(rows, query, queryFields)).toEqual([]);
    expect(expensive).not.toHaveBeenCalled();
  });
});

describe("query validation and transport", () => {
  it("returns structured issues for unknown fields, operators, and duplicate ids", () => {
    const query = createFilterGroup(
      "and",
      [
        createFilter("missing", "is", [], "same"),
        createFilter("status", "missing", [], "same"),
      ],
      "root",
    );

    expect(queryIssues(query, fields)).toEqual([
      { code: "unknown-field", id: "same", fieldId: "missing" },
      { code: "duplicate-id", id: "same" },
      { code: "unknown-operator", id: "same", fieldId: "status", operatorId: "missing" },
    ]);
  });

  it("serializes a canonical wire shape and parses it without retaining extra keys", () => {
    const query = createFilterGroup(
      "or",
      [createFilter("status", "is", ["open"], "open")],
      "root",
    );
    const serialized = serializeQuery(query);

    expect(serialized).toBe(
      '{"id":"root","combinator":"or","children":[{"id":"open","fieldId":"status","operatorId":"is","values":["open"]}]}',
    );
    expect(parseQuery(serialized)).toEqual({ ok: true, value: query });
    expect(
      parseQuery(
        '{"id":"x","fieldId":"status","operatorId":"is","values":[],"ignored":"value"}',
      ),
    ).toEqual({
      ok: true,
      value: { id: "x", fieldId: "status", operatorId: "is", values: [] },
    });
  });

  it("rejects malformed JSON and malformed recursive nodes without throwing", () => {
    expect(parseQuery("{")).toEqual({ ok: false, code: "invalid-json" });
    expect(
      parseQuery('{"id":"root","combinator":"and","children":[{"id":1}]}'),
    ).toEqual({ ok: false, code: "invalid-shape" });
  });
});
