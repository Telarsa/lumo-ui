# Independent adversarial evaluation — 15 August 2026

## Scope and base

The requested base was `48653d7`. The checked-out branch was instead
`709f79293f0d947a3bc47c210000b49df9bf5c39`. `git diff --name-status
48653d7..HEAD` showed one added file only,
`docs/history/review-brief-2026-08-15.md`; no product, test, tool, generated
artifact, or current documentation differed. I therefore evaluated the product
state at `48653d7` without resetting the documentation-only child commit.

This rating was written before opening `docs/history/evaluations.md` or any
earlier evaluation. Anchors supplied by the brief: shadcn/ui = 8, Mantine = 8,
Ark UI = 7.5, ordinary internal library = 5.

## Blind rating

| Dimension | Score | Evidence |
|---|---:|---|
| Accessibility, Persian, RTL, calendar, first byte | **9.1** | `packages/gate/src/rules.ts:206-781` grades language/direction, native digits, spoken strings, names, idrefs, composite tab stops, calendars, ids, scripts, and role descriptions. `packages/base-ui-ssr/src/field-wiring.ts:33-95` resolves label/description relationships during render. A direct gate run graded 594 documents with 0 violations and 63 digit floors. The score is not higher because dialog-like roles fall outside the name rule and 74.8% of Persian-route text nodes are exempt from digit/visible-script inspection. |
| Testing and verification honesty | **8.7** | Five focused UI suites passed 75/75; the gate's six suites passed 162/162; `pnpm run gate:props` graded 142 files with no inert/root-contract finding. `packages/ui/src/popup-interiors.test.tsx:38-60` opens 18 popup families. `scripts/mutate-components.mjs:37-113`, however, gives only 11 modules a behaviour mutation and gives the other 100 the same `className`-removal probe. |
| Public API and developer experience | **7.8** | Required strings are common and explicit (`packages/ui/src/phone-input.tsx:107-129`; `packages/ui/src/tabs.tsx:224-240`), and generated reference documentation has a zero-undocumented-prop floor (`api-docs.floor.json:1-4`). The Dialog composition can still express an unnamed popup, while `PhoneInput` exposes description/error props that its native input does not consume. |
| Architecture | **8.2** | The package seams have purposes: core contracts, theme, source gate, SSR repair layer, components, and blocks (`docs/architecture.md:13-67`). Example discovery is genuinely single-source (`apps/website/src/lib/catalog.ts:7-18`, `apps/website/src/lib/examples-loader.ts:83-117`). The cost is high: engine-shaped translations, generated artifacts, a source gate, an HTML gate, and an SSR compatibility package must all move together. |
| Design system and RTL styling | **8.3** | The sample uses logical spacing and shared control tokens (`packages/ui/src/select.tsx:38-68`), motion reduction and direction-neutral animation (`packages/ui/src/skeleton.tsx:5-30`), and locale-shaped digits plus a deliberate bidi island (`packages/ui/src/phone-input.tsx:203-221`). The class mutation floor proves class delivery, not visual correctness or cross-browser layout. |
| Documentation and onboarding | **7.0** | Current architecture, verification, contribution, generated API, bilingual examples, and a per-component site are unusually deep. Five checked claims were four true and one materially false: the 111/30/141 census, 594/0/63 output, single example registration, and separate CI mutation job match code; the PhoneInput page says it uses a native country selector (`apps/website/src/examples/phone-input.tsx:164-172`) while source uses Lumo `SelectField` (`packages/ui/src/phone-input.tsx:186-201`). The changelog says it is derived from git history but stops on 10 August (`apps/website/src/app/[lang]/docs/changelog/page.tsx:5-23`) despite five more days of substantive commits. |
| Breadth and product depth | **8.2** | `registry.json` independently counted 111 UI modules and 30 blocks, and every implementation module has an examples page (112 component pages because IconButton has a separate alias page). Gantt, scheduling, data-grid, upload, query building, async collections, charts, and product blocks put it above most internal libraries. Maturity still lags Mantine's long-lived form/hook ecosystem and all anchors' installed-user feedback. |
| Distribution and release readiness | **4.7** | All contract packages remain `0.0.0` (`packages/ui/package.json:1-4` and siblings). `components.json:21-23` and install tabs advertise `https://lumo-ui.com/r/{name}.json`; a direct GET of `/r/button.json` returned `text/html` containing “Parked Domain name on Hostinger DNS system”, not a registry item. The installation page itself says no public registry and git-tagged contract packages (`apps/website/src/app/[lang]/docs/installation/page.tsx:153-161`) but supplies neither an operational private registry URL nor an exact contract-package git command. This penalises broken consumption, not the decision to remain private. |

**OVERALL: 7.8/10**

**COMPLEXITY: high, partly justified.** The source/HTML gates, locale contracts,
SSR repairs, and generated registry/API earn most of their complexity because
they catch defects ordinary component tests structurally cannot. The shallow
100-module mutation tier, duplicated engine-translation surfaces, and current
distribution scaffolding do not yet earn all of theirs.

## Three strongest facts

1. **The output gate is real and self-tested.** A direct run over the existing
   export reported `594 document(s) graded, 0 violation(s)` and `63` armed
   floors; the poison-fixture suite passed 162 tests. The rules do more than
   lint source: `native-calendar` distinguishes a Persian-looking Gregorian date
   from a Jalali date (`packages/gate/src/rules.ts:544-610`).
2. **First-byte repairs are designed at the correct seam.** Field labels,
   descriptions, and errors are paired during render in
   `packages/base-ui-ssr/src/field-wiring.ts:41-95`; the permanent Base UI
   string tripwire uses server markup and independent English literals
   (`packages/ui/src/base-ui-strings.test.tsx:53-76,134-248`).
3. **The breadth is documented and install-artifact-aware.** The registry count
   is derived rather than hand-maintained (`scripts/build-registry.mjs:384-410`),
   every UI module has examples, and the API floor refuses any new undocumented
   Lumo prop (`api-docs.floor.json:1-4`).

## Five most important weaknesses

1. **The advertised install path is not an install path.** The configured URL
   returns a parked-domain HTML page. Until there is an authenticated private
   registry or a precise git-copy workflow, the library can pass all local gates
   and still fail on the first consumer command.
2. **The name gate stops short of important named roles.** `INTERACTIVE` covers
   menu/listbox/tree/treegrid/grid but not `dialog`, `alertdialog`, `tablist`, or
   `region` (`packages/gate/src/rules.ts:140-147`). TabList happens to require a
   label, but Dialog does not; a broad gate cannot certify what it never selects.
3. **The mutation number overstates behavioural assurance.** Eleven specific
   operators are valuable; one hundred modules are tested only by replacing
   `className=` (`scripts/mutate-components.mjs:37-113`). “111/111 killed” means
   every module has an observed styling assignment, not that every component's
   owned behaviour has survived adversarial mutation.
4. **The exemption is necessary but large.** The gate reported 74.8% of text
   nodes and 67.2% of characters on Persian routes beneath
   `data-lumo-latn`. `packages/gate/src/rules.ts:149-167` skips the entire marked
   subtree. Code samples explain much of it, but one misplaced marker can hide a
   product-language defect; the percentage is disclosure, not containment.
5. **Docs/release truth has drifted.** PhoneInput describes a native selector
   that no longer exists, the dated changelog ends before the current work, and
   package READMEs show `pnpm add @lumo-ui/base-ui-ssr` although the package is
   private and version `0.0.0` (`packages/base-ui-ssr/README.md:175-193`,
   `packages/base-ui-ssr/package.json:1-4`).

## Real defects proved in Phase A

### P1 — PhoneInput's help/error text is not connected to its telephone input

**PROVED from the public render path.** `Field` generates description/error IDs
and exposes them only through `useFieldControl()`
(`packages/ui/src/form.tsx:72-89`,
`packages/base-ui-ssr/src/field-wiring.ts:78-93`). PhoneInput renders a plain
`<input>` and manually supplies `aria-label`, `aria-invalid`, disabled,
placeholder, name, value, and onChange, but never spreads `useFieldControl()`
(`packages/ui/src/phone-input.tsx:203-222`). Its visible Description and
FieldError are rendered at `:225-226`. Therefore the input's first byte has no
`aria-describedby` reference to either text. Phase B must pin this with a server
render before changing code.

### P2 — selecting another PhoneInput country does not update the controlled E.164 value

**PROVED from the interaction path and a vacuous assertion.** The country
selection handler only calls `setCountryCode(key)`
(`packages/ui/src/phone-input.tsx:187-200`); `onChange` is invoked only by typing
in `commit` (`:171-174`). With `value="+989…"`, choosing UAE changes the visible
dial code to `+971` while leaving the caller's value `+989…`; the next edit then
parses the old dial as national digits. The existing test is titled “switching
country re-reads the same typed number under the new plan”, but its only post-
selection assertion is that the telephone input exists
(`packages/ui/src/phone-input.test.tsx:134-146`). Phase B must replace that with
an observable E.164 assertion, not weaken it.

### P3 — an unnamed dialog is expressible and invisible to `named-controls`

**PROVED contract/gate gap; live-name assertion required before the fix.**
`DialogProps` requires only the close button's label; heading and inherited ARIA
labeling remain optional (`packages/ui/src/dialog.tsx:238-277`). The actual
`role="dialog"` element is `DialogModal`'s Base UI Popup
(`packages/ui/src/dialog.tsx:208-235`), while an `aria-label` passed to Dialog
lands on a descendant plain div. The popup test passes such a descendant label
but queries the dialog without a name (`packages/ui/src/popup-interiors.test.tsx:131-145`).
Because `named-controls` omits dialog roles, both the component contract and the
test can stay green with an unnamed popup. Phase B must first assert the live
dialog's computed name, then close the API and gate holes without weakening the
test.

### P4 — PhoneInput documentation describes the opposite implementation

**PROVED.** The page calls the country control a native selector and says the
platform picker is the reason for that choice
(`apps/website/src/examples/phone-input.tsx:164-172`). Source renders Lumo's
custom `SelectField` (`packages/ui/src/phone-input.tsx:186-201`), and the test
explicitly asserts `document.querySelector("select")` is null
(`packages/ui/src/phone-input.test.tsx:125-132`).

### P5 — generated install commands resolve to the wrong artifact

**PROVED externally and locally.** `components.json:21-23` expands the command
to `https://lumo-ui.com/r/{name}.json`. On 15 August 2026 a GET of
`https://lumo-ui.com/r/button.json` returned HTTP 200 `text/html` for Hostinger's
parked-domain page, not JSON. This cannot be repaired honestly without the
owner's private hosting/tag decision, so it is a release blocker rather than an
unauthorised local rewrite.

## Adversarial probes that did not find a defect

- Random sample: Select, PhoneInput, Skeleton. Select's placeholder is required,
  selected keys are resolved to Persian labels on the server, and the open
  listbox is named; Skeleton owns `aria-hidden=true` and disables motion under
  reduced-motion; PhoneInput formats displayed digits and isolates the phone run
  with `<bdi dir="ltr" data-lumo-latn>`. The five relevant suites passed 75/75.
- A source search found no English default for label/title/message props in
  product modules. The current 18-family popup suite and existing exported HTML
  gate both reported no English spoken-string violation.
- `pnpm run gate:props` found no inert prop or root-contract violation in 142
  component files. This does not refute P1: PhoneInput renders the text it accepts,
  so the source gate sees the prop as used; the missing relationship is semantic.
- The digit floors are not a hand-picked twelve-route sample anymore.
  `packages/gate/src/index.ts:202-217` requires every non-Latin route with at
  least 30 visible native digits to enter the ledger, while committed entries
  remain after density falls. The API documentation floor is a hard zero.
- No actual screen-reader, Safari/WebKit, Firefox, NVDA, JAWS, Narrator, or
  TalkBack run was performed, and no claim about them is made here.

## Earlier-evaluation comparison

Only after recording the 7.8 did I read `docs/history/evaluations.md`. Its latest
blind score was 7.3 and the maintainer's anchored score was 7.8. We independently
agree on high/partly-justified complexity, shallow one-operator mutation coverage,
the absence of browser/AT evidence, and release immaturity. This pass found four
items the retained summary does not mention: PhoneInput's disconnected help/error
text, its country-change value desynchronisation and vacuous assertion, the
Dialog/name-gate hole, and the advertised registry URL returning parked-domain
HTML. The earlier arc found historical failures I did not rediscover blind—chart
mirroring, circular mutation accounting, inert React Aria carriers, and DataGrid
validation—because the current code now contains direct tests/fixes for them.

## Phase B — fixes and adversarial proof

The implementation is in `2d5b80e` and the documentation correction is in
`8b3e770`. Both commits carry the required co-author trailer. Nothing was pushed,
published, or installed.

| Finding | Outcome | Red proof and assertion | Fix and independent proof |
|---|---|---|---|
| P1 — PhoneInput help/error disconnected | **FIXED** | Before the fix, `describedBy` was `[]`; the new server assertion requires two ids and requires both to exist in the same markup (`packages/ui/src/phone-input.test.tsx:68-83`: `expect(describedBy).toHaveLength(2)`). | The telephone control is now `FieldInput`, which consumes the field wiring (`packages/ui/src/phone-input.tsx:176-181,215-228`). The full UI suite passed 2,148 tests. |
| P2 — country switch desynchronises controlled E.164 | **FIXED** | Before the fix, the strengthened test observed zero callback calls. It now requires the visible UAE selection and `onChange("+9719121234567")` (`packages/ui/src/phone-input.test.tsx:152-165`). | The handler preserves the national digits, substitutes the selected dial code, and emits the new canonical value (`packages/ui/src/phone-input.tsx:192-200`). Removing `onChange?.(nextValue)` was killed by the related tests. |
| P3 — unnamed Dialog/Drawer and blind name gate | **FIXED** | The live popup initially had computed name `""`; the poison fixture for `<div role="dialog">` initially returned no violation. The new gate assertions require all four unnamed roles to fire (`packages/gate/src/gate.test.ts:821-826`). | `Dialog.label` and `Drawer.label` are required and land on the actual popup (`packages/ui/src/dialog.tsx:219-260`; `packages/ui/src/drawer.tsx:103-134`). `named-controls` now includes dialog, alertdialog, tablist, and region (`packages/gate/src/rules.ts:140-148`). Dropping either popup name was killed: Dialog, Drawer, and PhoneInput mutation run = **3/3 killed**. |
| P4 — PhoneInput docs claim a native selector | **FIXED** | The existing test proves the country control is a button and that `querySelector("select")` is null (`packages/ui/src/phone-input.test.tsx:145-149`). | The bilingual part documentation now says “compact Lumo country selector” and describes its actual keyboard/localisation trade-off (`apps/website/src/examples/phone-input.tsx:164-173`). |
| P5 — advertised registry endpoint is parked HTML | **NOT FIXED — OWNER DECISION** | A direct request returned HTTP 200 `text/html` and the Hostinger parked-domain page, while `components.json` expands that host into install commands. | Fixing this requires choosing and operating a private registry host or replacing the command flow with an exact pinned-git workflow. The brief forbids registry-host assumptions and structural changes without approval, so I did not substitute another fictional URL. |
| P6 — Dialog inherited description idrefs land on the wrong element | **FIXED (found during Phase B)** | Regenerated API docs exposed `aria-describedby`/`aria-details` on `DialogProps`. With the omission reverted, the object-literal type assertions failed as unused `@ts-expect-error` directives (`packages/ui/src/api-honesty-a.test.tsx:43-50`). JSX was deliberately not used for this proof because TypeScript permits arbitrary `aria-*` JSX attributes. | Both props are omitted from the descendant Dialog surface (`packages/ui/src/dialog.tsx:252-260`); the same assertions pass only while they remain absent. The generated reference returned to 0/0 undocumented props. |

The stale public changelog was also corrected to identify itself as selected
milestones, cover the 15 August state, and stop claiming all running code was
written on 8–10 August. The base-ui-ssr README no longer offers an impossible
public `pnpm add` command; it now states the package's private workspace/git
consumption status.

## Final verification

- `pnpm run verify` passed once after the two fix commits: all workspace
  typechecks; 142-file prop/root gate; lint; CSS policy; 3,040 tests across the
  tested packages; generated registry/API checks; 141-item clean-room consumer;
  594-page static build; and `594 document(s) graded, 0 violation(s)` with 63
  Persian digit floors.
- `node scripts/mutate-components.mjs --only
  phone-input.tsx,dialog.tsx,drawer.tsx` reported `3/3 killed; 0 survived; 0
  unobserved; 0 invalid`.
- `graphify update .` completed: 4,580 nodes, 12,092 edges, 303 communities. It
  warned that three JSON floor/generated files produce zero graph nodes; that is
  graph extraction scope, not a product verification failure.
- The build warned that `baseline-browser-mapping` data is over two months old.
  I declined the suggested dependency update because no dependency addition or
  update was authorised, and the warning did not fail the build.

## Post-fix rating

The blind score remains the historical before-fix score. Re-rating the changed
state yields:

| Dimension | Blind | Post-fix | Reason for movement |
|---|---:|---:|---|
| Accessibility / Persian / RTL / calendar | 9.1 | **9.3** | Field descriptions and popup names now reach the elements AT reads; the served-byte gate covers the missing named roles. |
| Testing and verification | 8.7 | **8.8** | Three new behavioural mutants are killed and the type-level inert-prop regression has a revert proof. Most modules still have only the class-strip floor. |
| Public API / DX | 7.8 | **8.1** | Dialog and Drawer make the announced name impossible to omit, and Dialog no longer advertises role-level idrefs on a descendant. This is an intentional breaking migration. |
| Architecture | 8.2 | **8.2** | No new layer or dependency; the fixes reuse Field wiring and the existing prop-lift seam. Complexity remains high. |
| Design system / RTL styling | 8.3 | **8.3** | No visual-system claim was changed. |
| Documentation / onboarding | 7.0 | **7.4** | PhoneInput, changelog, and private package installation claims are now accurate. The component install endpoint remains unusable. |
| Breadth / product depth | 8.2 | **8.2** | No breadth work was attempted. |
| Distribution / release readiness | 4.7 | **4.7** | The registry endpoint is still a parked domain and packages remain private `0.0.0`. |

**POST-FIX OVERALL: 7.9/10** (blind before-fix: **7.8/10**).

The ceiling is now distribution and external evidence, not another local
component tranche: the operational install path needs an owner decision; no
browser/AT matrix was run; and 98 of 111 modules still have only the styling
mutation floor. Those were reported, not disguised as completed work.
