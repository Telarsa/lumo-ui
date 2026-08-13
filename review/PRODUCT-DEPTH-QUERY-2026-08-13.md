# Product-depth foundation — shared query model

Date: 13 August 2026  
Base commit: `4b39aee`

## Outcome

Filters, local DataGrid execution and future PowerSearch/remote adapters now
share one serializable query tree. Existing `FilterClause[]` values remain an
implicit AND query, so current Filters consumers and hidden-form payloads do not
break. Nested groups add explicit AND/OR without inventing a second model.

The directive-free module now owns:

- typed field readers and operator predicates;
- nested AND/OR execution with native short-circuit behavior;
- structured issues for duplicate ids/schema entries and unknown fields or
  operators;
- canonical JSON serialization for hidden inputs, URLs and async `queryKey`;
- bounded, prototype-free parsing of untrusted serialized state;
- `useLumoQueryTable`, which projects local source rows through that model
  before TanStack table state.

`Filters` now calls the shared validator and serializer instead of maintaining
its own parallel field/operator/id walk. The `table` registry payload carries
`filters.shared.ts`, so copied DataGrid/Table consumers receive the engine.
No runtime dependency was added and no announced English default was added.

## Current Astryx comparison, inspected in the live official Storybook

Astryx describes PowerSearch as field/operator/value tokens selected through a
typeahead and edited in a popover. Its current stories cover presets, string,
enum-list/entity, number, date, boolean/empty, nested filters, content-search
routing, read-only/disabled, status messages, result counts, token overflow,
custom editors and `PowerSearchWithTable`.

Lumo now has the shared semantics and the direct local table seam. It does not
yet have the token/typeahead/popover product surface, typed editor catalog,
overflow treatment or saved-view UI. Those remain the next tranche; this report
does not claim PowerSearch parity early.

## Red/green and mutation evidence

| Behavior | Mutation | Assertion that failed |
| --- | --- | --- |
| Nested logic | Swapping AND's `every` with `some` and OR's `some` with `every`. | `executes nested AND/OR groups without flattening their meaning` expected rows `1,2` and received none. |
| DataGrid integration | Bypassing `executeQuery` inside `useLumoQueryTable`. | `projects local rows through the shared typed operators before table state` expected `one` and received `one,two,three`. |
| Previous Filters contract | Before implementation all six new query tests failed because the functions did not exist; after integration the existing serialization and interaction suite remained green. | `serves a named query-builder and serializes its initial clauses` still pins the original hidden input bytes. |

## Deliberate limits

- Operator predicates are caller-owned because field meaning belongs to the
  product; Lumo supplies the execution/validation model, not guessed semantics.
- Serialized query parsing validates shape. Semantic validation requires the
  actual field schema and is performed by `queryIssues`/`assertQuery`.
- The parser stops after twenty nested levels to prevent untrusted URL/form
  state from turning recursive traversal into an unbounded resource cost.
- PowerSearch UI, remote adapters and saved views are not yet shipped.
- `review/INDEPENDENT-REVIEW-9eb90a7.md` remains untouched and untracked.
