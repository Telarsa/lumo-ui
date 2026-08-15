# Independent reevaluation of the 15 August fix pass — HEAD `9edd398`

**Preconditions.** Branch `experiment/base-ui`; `git rev-parse HEAD` =
`9edd398e4176baa72bb40a3972df8aeac813c392`; working tree clean before, during
(between proofs) and after this review (`git status --short` empty every time
it was checked). Nothing was pushed, published or installed. No product file
was changed: every mutation below was restored with `git checkout -- <file>`
and confirmed with `git diff --quiet`; two temporary probe files
(`packages/ui/src/zz-reeval-probe*.test.tsx`, one `.type-test.tsx`) were
created for the independent proofs and deleted in the same command. This
report is the only file written.

**Disclosure.** All evidence is jsdom (Vitest + Testing Library), linkedom
(the served-HTML gate), `tsc`, `renderToStaticMarkup`, `curl`, and the repo's
own scripts. **No browser, NVDA, JAWS, Narrator, VoiceOver, TalkBack, Firefox,
Safari or WebKit run was performed**, and no claim about them is made.

---

## 1. Blind scores (recorded 17:03 CEST, before opening either history file)

Anchors: shadcn/ui = 8, Mantine = 8, Ark UI = 7.5, ordinary internal library = 5.
Basis: the tree at `9edd398`, direct probes (registry homepage, versions, no
`CHANGELOG.md`), and my prior familiarity with the codebase up to `709f792` — I
cannot claim to be blind to the *codebase*, only to the two history documents.

| # | Dimension | Blind |
|---|---|---:|
| 1 | Accessibility, Persian, RTL, calendars, first byte | 8.0 |
| 2 | Testing and verification honesty | 7.5 |
| 3 | Public API and developer experience | 7.0 |
| 4 | Architecture and complexity | 7.0 |
| 5 | Design system and RTL styling | 7.5 |
| 6 | Documentation and onboarding | 7.5 |
| 7 | Breadth and product depth | 7.5 |
| 8 | Distribution and release readiness | 4.5 |
| | **Blind overall** (1–2 weighted ×2) | **7.2** |

## 2. Final scores (after reproducing every Phase B claim)

| # | Dimension | Blind | Final | Why it moved |
|---|---|---:|---:|---|
| 1 | Accessibility / Persian / RTL / first byte | 8.0 | **8.1** | P1 (describedby), P3 (popup names), gate roles all confirmed; held back by P7 (a body field's `label` lifted onto an alertdialog) and by `Dialog.label` being inert inside `Drawer`. |
| 2 | Testing honesty | 7.5 | **7.6** | Three new behavioural mutants really die (3/3) and five revert proofs each name one assertion; the drawer popup fixture lost its `DialogHeading`, so the heading-named path is no longer graded live; 98/111 modules keep only the class-strip floor. |
| 3 | Public API / DX | 7.0 | **7.0** | Unnamed dialogs are now unrepresentable (real gain) but the mechanism forces the name to be typed twice when a heading exists, is overridden by the heading after hydration, is dead inside `Drawer`, and reintroduces an underscore discard (`label: _label`) that decision §20 removed. |
| 4 | Architecture / complexity | 7.0 | **7.0** | No new layer; still high, mostly earned. |
| 5 | Design system / RTL styling | 7.5 | **7.5** | Untouched by this pass. |
| 6 | Documentation / onboarding | 7.5 | **7.7** | P4 wording, changelog (now reaches 15 Aug and calls itself "selected milestones"), base-ui-ssr README install claim — all confirmed. |
| 7 | Breadth / product depth | 7.5 | **7.5** | Untouched. |
| 8 | Distribution / release readiness | 4.5 | **4.5** | Advertised consumer URL is a parked domain (reproduced); packages `0.0.0`; no CHANGELOG file. Unchanged, correctly left to the owner. |
| | **Final overall** | 7.2 | **7.3** | |

**Is 7.9/10 justified? No.** The fixes are real and every one I could test reproduces, but they are four component-level defects plus documentation truth. The two things that cap the library — a consumer path that returns HTML instead of a registry item, and zero external (browser/AT) evidence — are exactly where they were, and the pass introduced one new defect (P7) and one inert required prop. On these anchors 7.3–7.5 is defensible; 7.9 credits the pass with movement it did not make. (The prior evaluator's *blind* 7.8 was itself ~0.5 above both independent blind scores on record: 7.3 earlier today and 7.2 here.)

---

## 3. Verdict per claimed fix

| Claim | Verdict | Independent proof (this review, not the repo's tests) |
|---|---|---|
| **P1** PhoneInput help/error text → two valid `aria-describedby` idrefs | **CONFIRMED** | Own SSR probe: `<input … type="tel" aria-describedby="_R_0_description _R_0_error" …>`; both ids exist on the elements carrying «راهنما» and «خطا»; description-only → 1 idref; neither → no attribute. `<label for="base-ui-_R_1_">` still points at the input's id. Code: `packages/ui/src/phone-input.tsx:215` (`<FieldInput`), `:179` (`explicit={{ "aria-label": label }}`). |
| **P2** Iran → UAE with `+989121234567` emits `+9719121234567` | **CONFIRMED** | Own probe (`locale="en-US"`, controlled): `onChange` called exactly once with `"+9719121234567"`. Uncontrolled: no emission. Edge (not a defect, noted): controlled bare `"+98"` emits `""` — the dial code is dropped rather than re-based. Code: `phone-input.tsx:192-200`. |
| **P3** open Dialog and Drawer carry the caller-authored computed name | **PARTIALLY CONFIRMED** | Dialog with `label` only: `aria-label="گفتگو"`, `getByRole("dialog", {name})` resolves. Drawer: one `role="dialog"`, `aria-label="کشو"`. **But**: with a `DialogHeading` of different text, live `aria-labelledby` (Base UI Title) wins — name = heading, not `label`; and inside a `Drawer`, `Dialog.label` reaches nothing in the DOM (probe: «نام گفتگو» absent from `document.body`; only `Drawer.label` names the panel). "Caller-authored" holds; "the required prop is the name" holds only when no heading exists. |
| **P3'** unnamed `dialog`, `alertdialog`, `tablist`, `region` fire `named-controls` | **CONFIRMED** | Own fixtures graded through the exported `gradeHtml` (not `gate.test.ts`): unnamed ×4 → 4 `named-controls` violations; named ×4 (`aria-labelledby` heading, `aria-label`, `aria-label`, `<section role=region aria-label>`) → 0. Code: `packages/gate/src/rules.ts:146-148`. |
| **P6** `DialogProps` rejects `aria-describedby` / `aria-details` (object-literal excess-property check) | **CONFIRMED** | Temporary `.type-test.tsx` **without** `@ts-expect-error`: `tsc` reports `TS2353 … '"aria-describedby"' does not exist in type 'DialogProps'`, same for `"aria-details"` and `"aria-labelledby"`; `{ closeLabel }` → `TS2741 Property 'label' is missing`; `DrawerProps = {}` → TS2741; the two valid literals compile. JSX was not used. Code: `dialog.tsx:252-260`. |
| **P4** PhoneInput docs no longer claim a native selector | **CONFIRMED** | `apps/website/src/examples/phone-input.tsx:169-171`: "a compact Lumo country selector … custom list", both locales; the test still proves `querySelector("select")` is null. |
| **P5** `https://lumo-ui.com/r/button.json` | **NOT FIXED — CONFIRMED BROKEN** | `curl -L`: `HTTP/2 200`, `content-type: text/html`, `server: hcdn`, body `<title>Parked Domain name on Hostinger DNS system</title>`; `JSON.parse` fails. `components.json:22` still maps `@lumo` to that host; the site prints `shadcn@latest add @lumo/<name>` (`apps/website/src/lib/install-commands.ts:10-13`); `registry.json` `homepage` is that host. Not rewarded; not "fixed" by the local generator being correct. |
| Changelog / README truth | **CONFIRMED** | Changelog page adds a `d20260815` entry and self-describes as "selected dated milestones"; `packages/base-ui-ssr/README.md:178-179` states private workspace/git consumption; no `pnpm add @lumo-ui/*` remains in package READMEs. |
| `pnpm run verify` green | **CONFIRMED** | Run once, alone, at the end: typechecks; 142 files / 0 inert; lint; 3,040 tests (31/427/10/163/13/2,148/160/88); registry 141; api 0/0; smoke 141; build + `594 document(s) graded, 0 violation(s)`. |
| Mutation `--only phone-input.tsx,dialog.tsx,drawer.tsx` | **CONFIRMED** | `3/3 killed; 0 survived; 0 unobserved; 0 invalid`; tree clean afterwards. |

## 4. Revert / mutation proofs (each restored byte-for-byte)

| # | Mutation | Exact failing assertion |
|---|---|---|
| R1 | `phone-input.tsx`: `<FieldInput` → `<input data-lumo="">` (pre-fix control) | `phone-input.test.tsx › connects its visible help and error text … first byte` — `AssertionError: expected [] to have a length of 2 but got +0` (26 others pass) |
| R2 | `phone-input.tsx`: `onChange?.(nextValue);` → `void nextValue;` | `phone-input.test.tsx › switching country re-reads the same typed number under the new plan` — `expected "vi.fn()" to be called with arguments: [ '+9719121234567' ]` |
| R3 | `dialog.tsx`: delete `{...attr("aria-label", popupName(children))}` | `popup-interiors.test.tsx › dialog` — `Unable to find an accessible element with the role "dialog" and name "گفتگو"` |
| R4 | `drawer.tsx`: `aria-label={label}` → `aria-label={undefined}` | `popup-interiors.test.tsx › drawer` — `Unable to find … role "dialog" and name "فهرست"` |
| R5 | `rules.ts`: drop `[role=dialog],[role=alertdialog],[role=tablist],[role=region]` | `gate.test.ts › grades unnamed dialog, tablist and region roles` — `expected [] to deeply equal [ 'named-controls' ]` |

## 5. Vacuous, narrowed or overstated

- **New defect P7 (introduced by `2d5b80e`).** `popupName` (`dialog.tsx:220-225`) runs `findChildProp(children, "label")` over the *whole* subtree before it looks at `title`. `findChildProp` (`packages/base-ui-ssr/src/children.ts:11-22`) returns the first non-string element with that prop, depth-first. Probe: `<AlertDialog title="حذف فاکتور" …><TextField label="دلیل حذف"/></AlertDialog>` renders the alertdialog popup with **`aria-label="دلیل حذف"`** (the field's label) and `aria-labelledby=<title id>`. The computed name is still the title only because `aria-labelledby` outranks `aria-label`; the attribute is wrong and would become the name wherever the Title's id wiring is absent (it is a Base UI layout effect — see `@lumo-ui/base-ui-ssr`). Fix shape: read `label` from the direct `Dialog` child only (or check `title` before descending). Not fixed here (report-only mandate).
- **`Dialog.label` is required but inert inside `Drawer`.** Nothing lifts it there (only `DialogModal` calls `popupName`); the consumer must also pass `Drawer.label`, and one of the two strings goes nowhere. This is the accepted-and-inert class that decision §20 removed. The docblock ("Announced name lifted onto the role=dialog popup") is false in that composition. `gate:props` does not see it because the prop is read in the same file.
- **`label: _label` in `Dialog`** reintroduces the underscore-discard pattern §20 retired; `Menu` handles the same lift by simply not destructuring the prop.
- **Popup-tier narrowing.** The drawer fixture in `popup-interiors.test.tsx:338-345` replaced `<DialogHeading>فهرست</DialogHeading>` with plain text, and the dialog fixture never had a heading, so the live tier no longer grades a heading-named dialog/drawer at all. `overlays.test.tsx` still renders headings (with `label` equal to the heading text), so the common composition remains covered elsewhere — but not by the tier whose job is to grade open interiors with the full rule set.
- **The 3/3 kills are one-line operators** on the exact fixed lines; honest, but they prove the *assertion exists*, not that the behaviour is otherwise well-covered.
- **The prior report's Phase A blind of 9.1 / 8.7 / 8.2 for dimensions 1, 2, 4** is generous against the anchors: `Mantine = 8` with a decade of installed-user feedback vs. a library with no browser run and a broken install URL. Its post-fix arithmetic is internally consistent; the anchoring is what I dispute.

## 6. What still prevents a higher rating

1. **Distribution.** The only advertised consumer path returns parked-domain HTML. Until an operational private registry host or an exact pinned-git workflow exists, a perfect local `verify` cannot lift dimension 8 above ~4.5, and it caps the overall near 7.5 regardless of component quality. Owner decision; deliberately not proposed here.
2. **No external evidence.** Everything is jsdom/linkedom. One free Playwright + Chromium accessibility-tree job over `apps/website/out` (labelled honestly as *not* a screen-reader run) would move dimension 2 more than another component tranche.
3. **Mutation depth.** 98/111 modules carry only the class-strip operator.
4. **P7 and the Drawer-inert `Dialog.label`** — small, but they are exactly the class of defect the library exists to make unrepresentable.

## 7. What I declined and why

- Did not fix P7 or the inert prop: the mandate was evaluate/verify/report; product files were only mutated for proofs and restored.
- Did not touch `baseline-browser-mapping` or any dependency (build warning noted by the prior pass; not authorised, and it does not fail the build).
- Did not propose or test a replacement registry hostname; that is the owner's call and a fictional URL would be a worse defect than a parked one.
- Did not run `graphify update .` (writes only to the gitignored `graphify-out/`; unnecessary for a read-only review).
- Did not claim any browser or assistive-technology result (see Disclosure).

**FINAL: 7.3/10 (blind 7.2). Claimed 7.9: not justified. Fixes P1, P2, P3′, P4, P6 confirmed; P3 partially; P5 correctly left open; one new defect (P7) found.**
