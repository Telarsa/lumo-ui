/**
 * Spread an attribute only when it has a value.
 *
 * This one is PLUMBING, not a Base UI fix, and the README's cost table counts it
 * as such. It exists because `exactOptionalPropertyTypes` is on: against Base
 * UI's `disabled?: boolean | undefined`, `disabled={maybeUndefined}` is fine, but
 * against `id?: string` — which is how Base UI types most of the props a wrapper
 * needs to forward — `id={maybeUndefined}` is a type error. An absent key and an
 * `undefined` key are different things to that flag, and only the absent one is
 * safe to spread.
 *
 * It lives here rather than in a component file because fourteen call sites need
 * the identical three lines, and because a copied component must not have to
 * carry its own copy.
 */
export function attr<K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
}
