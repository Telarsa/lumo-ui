/**
 * Spread an attribute only when it has a value.
 *
 * Plumbing for `exactOptionalPropertyTypes`: Base UI types most forwardable props
 * as `id?: string`, so `id={maybeUndefined}` is a type error — only an ABSENT key
 * is safe to spread.
 */
export function attr<K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
}
