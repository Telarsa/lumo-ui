export interface FilterClause {
  id: string;
  fieldId: string;
  operatorId: string;
  values: readonly string[];
}

export type QueryCombinator = "and" | "or";

export interface FilterGroup {
  id: string;
  combinator: QueryCombinator;
  children: readonly FilterExpression[];
}

export type FilterExpression = FilterClause | FilterGroup;

/** A clause array remains the backwards-compatible implicit AND root. */
export type FilterQuery = readonly FilterExpression[] | FilterExpression;

export interface QueryShapeOperator {
  id: string;
}

export interface QueryShapeField {
  id: string;
  operators: readonly QueryShapeOperator[];
}

export interface QueryExecutionOperator<Row> extends QueryShapeOperator {
  test: (fieldValue: unknown, values: readonly string[], row: Row) => boolean;
}

export interface QueryExecutionField<Row> extends QueryShapeField {
  read: (row: Row) => unknown;
  operators: readonly QueryExecutionOperator<Row>[];
}

export type QueryIssue =
  | { code: "duplicate-field"; fieldId: string }
  | { code: "duplicate-operator"; fieldId: string; operatorId: string }
  | { code: "duplicate-id"; id: string }
  | { code: "unknown-field"; id: string; fieldId: string }
  | { code: "unknown-operator"; id: string; fieldId: string; operatorId: string };

export type ParseQueryResult =
  | { ok: true; value: FilterQuery }
  | { ok: false; code: "invalid-json" | "invalid-shape" };

/** Directive-free clause factory, safe to call from server-rendered examples. */
export function createFilter(
  fieldId: string,
  operatorId: string,
  values: readonly string[] = [],
  id = `${fieldId}-${operatorId}`,
): FilterClause {
  return { id, fieldId, operatorId, values: [...values] };
}

/** Directive-free group factory for nested AND/OR query trees. */
export function createFilterGroup(
  combinator: QueryCombinator,
  children: readonly FilterExpression[],
  id: string,
): FilterGroup {
  return { id, combinator, children: [...children] };
}

function isGroup(expression: FilterExpression): expression is FilterGroup {
  return "children" in expression;
}

function walkQuery(query: FilterQuery, visit: (expression: FilterExpression) => void): void {
  const walk = (expression: FilterExpression) => {
    visit(expression);
    if (isGroup(expression)) expression.children.forEach(walk);
  };
  if (Array.isArray(query)) query.forEach(walk);
  else walk(query as FilterExpression);
}

/** Returns machine-readable structural/semantic problems without authoring UI text. */
export function queryIssues(
  query: FilterQuery,
  fields: readonly QueryShapeField[],
): readonly QueryIssue[] {
  const issues: QueryIssue[] = [];
  const fieldsById = new Map<string, QueryShapeField>();
  for (const field of fields) {
    if (fieldsById.has(field.id)) issues.push({ code: "duplicate-field", fieldId: field.id });
    else fieldsById.set(field.id, field);
    const operators = new Set<string>();
    for (const operator of field.operators) {
      if (operators.has(operator.id)) {
        issues.push({ code: "duplicate-operator", fieldId: field.id, operatorId: operator.id });
      }
      operators.add(operator.id);
    }
  }

  const ids = new Set<string>();
  walkQuery(query, (expression) => {
    if (ids.has(expression.id)) issues.push({ code: "duplicate-id", id: expression.id });
    ids.add(expression.id);
    if (isGroup(expression)) return;
    const field = fieldsById.get(expression.fieldId);
    if (field === undefined) {
      issues.push({ code: "unknown-field", id: expression.id, fieldId: expression.fieldId });
      return;
    }
    if (!field.operators.some((operator) => operator.id === expression.operatorId)) {
      issues.push({
        code: "unknown-operator",
        id: expression.id,
        fieldId: expression.fieldId,
        operatorId: expression.operatorId,
      });
    }
  });
  return issues;
}

function issueMessage(issue: QueryIssue): string {
  switch (issue.code) {
    case "duplicate-field":
      return `Query field ids must be unique; received duplicate field "${issue.fieldId}".`;
    case "duplicate-operator":
      return `Query field "${issue.fieldId}" operator ids must be unique; received "${issue.operatorId}" twice.`;
    case "duplicate-id":
      return `Query expression ids must be unique; received "${issue.id}" twice.`;
    case "unknown-field":
      return `Query clause "${issue.id}" references unknown field "${issue.fieldId}".`;
    case "unknown-operator":
      return `Query clause "${issue.id}" references unknown operator "${issue.operatorId}" for field "${issue.fieldId}".`;
  }
}

/** Throws a developer error for a query that cannot be executed safely. */
export function assertQuery(query: FilterQuery, fields: readonly QueryShapeField[]): void {
  const issue = queryIssues(query, fields)[0];
  if (issue !== undefined) throw new RangeError(issueMessage(issue));
}

/** Executes the same query tree locally that a remote adapter can receive serialized. */
export function executeQuery<Row>(
  rows: readonly Row[],
  query: FilterQuery,
  fields: readonly QueryExecutionField<Row>[],
): readonly Row[] {
  assertQuery(query, fields);
  const fieldsById = new Map(fields.map((field) => [field.id, field] as const));

  const matches = (row: Row, expression: FilterExpression): boolean => {
    if (isGroup(expression)) {
      return expression.combinator === "and"
        ? expression.children.every((child) => matches(row, child))
        : expression.children.some((child) => matches(row, child));
    }
    const field = fieldsById.get(expression.fieldId)!;
    const operator = field.operators.find((candidate) => candidate.id === expression.operatorId)!;
    return operator.test(field.read(row), expression.values, row);
  };

  return rows.filter((row) =>
    Array.isArray(query)
      ? query.every((expression) => matches(row, expression))
      : matches(row, query as FilterExpression),
  );
}

function canonicalExpression(expression: FilterExpression): FilterExpression {
  return isGroup(expression)
    ? {
        id: expression.id,
        combinator: expression.combinator,
        children: expression.children.map(canonicalExpression),
      }
    : {
        id: expression.id,
        fieldId: expression.fieldId,
        operatorId: expression.operatorId,
        values: [...expression.values],
      };
}

/** Stable JSON wire format used for hidden inputs, URLs and async query keys. */
export function serializeQuery(query: FilterQuery): string {
  return JSON.stringify(
    Array.isArray(query)
      ? query.map((expression) => canonicalExpression(expression))
      : canonicalExpression(query as FilterExpression),
  );
}

function parseExpression(value: unknown, depth: number): FilterExpression | null {
  if (depth > 20 || value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string") return null;

  if (candidate.combinator === "and" || candidate.combinator === "or") {
    if (!Array.isArray(candidate.children)) return null;
    const children: FilterExpression[] = [];
    for (const child of candidate.children) {
      const parsed = parseExpression(child, depth + 1);
      if (parsed === null) return null;
      children.push(parsed);
    }
    return { id: candidate.id, combinator: candidate.combinator, children };
  }

  if (
    typeof candidate.fieldId !== "string" ||
    typeof candidate.operatorId !== "string" ||
    !Array.isArray(candidate.values) ||
    !candidate.values.every((item) => typeof item === "string")
  ) {
    return null;
  }
  return {
    id: candidate.id,
    fieldId: candidate.fieldId,
    operatorId: candidate.operatorId,
    values: candidate.values as string[],
  };
}

/** Parses untrusted serialized state into a prototype-free canonical query. */
export function parseQuery(serialized: string): ParseQueryResult {
  let value: unknown;
  try {
    value = JSON.parse(serialized) as unknown;
  } catch {
    return { ok: false, code: "invalid-json" };
  }

  if (Array.isArray(value)) {
    const expressions: FilterExpression[] = [];
    for (const item of value) {
      const parsed = parseExpression(item, 0);
      if (parsed === null) return { ok: false, code: "invalid-shape" };
      expressions.push(parsed);
    }
    return { ok: true, value: expressions };
  }
  const expression = parseExpression(value, 0);
  return expression === null
    ? { ok: false, code: "invalid-shape" }
    : { ok: true, value: expression };
}
