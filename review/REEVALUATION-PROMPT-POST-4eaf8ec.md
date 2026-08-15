# Prompt for a fresh adversarial reevaluation

**Project: lumo-ui — independent reevaluation of an uncommitted repair pass**

Repo:
`/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui`

Branch: `experiment/base-ui`.

The committed base must be:
`4eaf8ece7eb9a58672076874952b1532f4537e7f`.
Run `git rev-parse HEAD` first. The repairs to evaluate are intentionally
**uncommitted working-tree changes on top of that base**. Do not stop merely
because the tree is dirty; preserve every existing modified and untracked file.
Do not commit, push, publish, install, reset, checkout, or clean.

## Independence rule

Rate the current working tree BLIND on these eight dimensions before opening
anything under `review/`: accessibility/i18n/RTL/calendar, testing/tooling,
API/DX, architecture/maintainability, design system/visual consistency,
documentation/examples, product depth/breadth, and distribution/adoption.
Write the blind numbers to a temporary file first.

Only then read, in this order:

1. `review/EVALUATION-OF-FIXES-4eaf8ec.md`
2. `review/REPAIR-EVIDENCE-POST-4eaf8ec.md`

The second file was written by the fixing session. Assume self-certification
bias. Try to reject its claims, not confirm them.

## Required adversarial checks

Re-evaluate every P-1 through P-7 finding from the independent evaluation, plus
the additional tooling/doc repairs:

1. DataGrid validation text is rendered, announced, associated, and invalid
   Enter remains blocked.
2. Cascader Persian column names contain Persian rather than Latin digits.
3. Cascader with a disabled first option still has one usable roving stop.
4. ComboBox and MultiSelect update `dismissLabel` while already open.
5. TreeSelect `mode="multiple"` round-trips a selected parent independently;
   do not conflate this with descendant-cascade checkbox mode.
6. Public API descriptions are actually visible in the documentation table.
7. The digit-floor policy grows mechanically beyond a fixed 12-route list and
   cannot pass vacuously when a previously floored page loses all digits.
8. Treemap registry text comes from the Treemap export, not `TileRect`.
9. README/site counts equal the generated registry: 111 UI, 30 blocks, 141
   total.
10. Current architecture/installation/introduction/CLI copy describes React 19
    + Base UI, not retired Preact/React-Aria runtime behavior; chart evidence is
    stamped against the installed TanStack Charts 0.11.1.
11. The live popup tier truly opens and grades all 18 claimed families. Hunt
    exclusions that are unproved or broad enough to conceal real defects.
12. Unsupported Tab link/React-Aria/style fields reject real values at compile
    time and do not appear as usable generated API props.
13. Mutation runs in a distinct CI job, and the campaign's wording does not
    overstate its operator breadth.

For at least five product fixes, prove non-vacuity by making a byte-for-byte
temporary copy of the file, reverting only the repair to the `HEAD` form (or
applying an equivalent minimal mutation), running the named related assertion,
then restoring the exact bytes in `finally`/trap logic. Do not use
`git checkout`, `git reset`, or anything that could erase the shared patch.
Suggested targets: DataGrid, Cascader digit shaping, Cascader disabled-first
roving stop, ComboBox live relabel, MultiSelect live relabel, and TreeSelect
multiple parent state.

Run these long commands sequentially on the low-RAM machine, never together:

```sh
pnpm run verify
pnpm run mutation:components
```

Do not edit or inspect mutable source while the mutation campaign runs. After
it finishes, prove restoration with `git diff --check` and compare the working
tree to a pre-campaign status/diff hash. A narrow component test is not enough
to declare a mutation survivor; confirm against the full related suite.

Also independently sample 20 generated prop descriptions and 10 registry
descriptions for semantic accuracy. Include adversarial, non-random picks around
compatibility carriers, composed props, chart modules, and helper-before-export
files.

## Rating and honesty constraints

Use the same anchored scale as the prior review: shadcn/ui = 8, Mantine = 8,
Ark UI = 7.5. Separate code quality from external adoption. Lumo is still
private, `0.0.0`, not on npm, and has no public registry URL, so do not raise
distribution merely because local copy-registry tests are strong.

Do not claim browser, visual, NVDA, JAWS, TalkBack, VoiceOver, hosted CI, or
publication evidence unless you actually run it. The fixing session explicitly
did **not** run those. Treat these as known remaining limitations, along with a
mutation campaign that is still mostly style-assignment and the copied Treemap
upgrade seam.

Finding that a claimed repair is partial or wrong is a success. Label every
item **CONFIRMED / PARTIALLY CONFIRMED / REJECTED**, name the assertion and
mutation evidence, and report every overstatement.

Deliver:
`review/REEVALUATION-OF-POST-4eaf8ec.md`

That report is the only persistent file you may add. Nothing committed or
pushed.
