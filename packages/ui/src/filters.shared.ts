export interface FilterClause {
  id: string;
  fieldId: string;
  operatorId: string;
  values: readonly string[];
}

/** Directive-free clause factory, safe to call from server-rendered examples. */
export function createFilter(
  fieldId: string,
  operatorId: string,
  values: readonly string[] = [],
  id = `${fieldId}-${operatorId}`,
): FilterClause {
  return { id, fieldId, operatorId, values: [...values] };
}
