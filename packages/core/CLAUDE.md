# packages/core
- Owns `Locale`, `direction()`, `LumoNode`, formatting, the prop vocabulary (`props.ts`), and the string catalog. React is a peer; no imports from `ui`/`theme`.
- No React Aria compatibility carriers remain; do not reintroduce a prop that reaches nothing.
- Adding a locale: `types.ts` union, `strings.ts` catalog, gate `KNOWN` table, and the CI ICU probe.
