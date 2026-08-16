# `fixtures/root-contract/` — poison for the `ref` / `id` contract

The rule lives beside the inert-prop rule (`packages/gate/src/inert-props.ts`,
`gradeRootContract`) because it needs the same parse and the same notion of
"which function consumes this shape". Its fixtures live here rather than in
`inert-props/` because the two rules fail for different reasons and are fixed by
different edits, and a mixed directory would let a missing fixture hide behind a
present one — the self-test enumerates each directory against its own verdict
list.

**One file per failing verdict, and the poison is again the repository's own
history rather than an invention.**

| fixture | what it was, in this library |
| --- | --- |
| `no-ref-story.bad.tsx` | `card.tsx` until 12 Aug 2026 — `HTMLAttributes<T>`, so `<Card ref={r}>` did not compile, while `<Frame ref={r}>` did, and nothing recorded the difference |
| `undelivered-root.bad.tsx` | `Pagination` and `ScrollArea` — a DOM surface inherited and never spread, so `id` compiled and reached nothing |
| `unexplained-own.bad.tsx` | the shape `TableProps` would have if the two `Omit`s had been made quietly instead of argued |

`good.tsx` holds all four legal shapes: the ordinary "omit what you own, spread
the rest"; an `Omit` explained inside the key union (`table.tsx`'s placement);
one explained before `extends` (`gantt.tsx`'s); and a WIDENED `ref` explained on
its redeclaration (`stack.tsx`'s). It also holds a props type with no DOM base
at all, which is not this rule's business — a rule that fires on a plain options
object would fire on half the library.

The `unexplained-own` check grades that a reason was **written**, not that it is
a good one; no syntactic pass can grade an argument. That is the same standard
`@forwarded` is held to by the rule above it, and for the same reason — a check
nobody can satisfy honestly becomes a check everybody mutes.
