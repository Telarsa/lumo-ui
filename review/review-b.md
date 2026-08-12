# Lumo UI adversarial component review B

Reviewed commit: `1ab37905ec488ba84f7ca17ebf023d44690a7f51` (`HEAD` at review time). Scope: registry components 32–62. Review date: 2026-08-12. This was a read-only review: no source, test, lockfile, commit, branch, remote, or generated artifact was changed. The only written file is this report.

## Method and confidence

- **PROVED** means the behavior follows directly from the checked-in implementation/type, contradicts a checked-in contract, or was reproduced read-only. **SUSPECTED** means the risk is real but needs a browser/AT/integration probe.
- Local citations are absolute `file:line` and include a short exact quote. External comparisons use current first-party documentation fetched during this review. “No direct counterpart” means none appears in that vendor's official component catalog; it does not mean that a consumer cannot compose one.
- In a bullet that cites one absolute local file and then uses `:NN` for additional lines, those suffixes refer to the same immediately preceding absolute path; no citation crosses a bullet. External feature statements in each numbered section are supported by that component's five direct official links in the matrix immediately above; the matrix is the citation index, not a secondary summary.
- I ran the targeted existing suites for IconTile/IconStack/Frame, InputOtp, MessageScroller, and NavigationMenu: 4 files, 41 tests, all green. That green result is specifically not treated as disproof of the vacuity findings below.
- Read-only reproduction for React 19's child traversal: `React.Children.toArray(<><i/><b/></>).length` returned `1` and the sole child was the Fragment. This agrees with Lumo's own correct explanation in ListBox: `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/list-box.tsx:224` — “`Children.toArray` flattens arrays and NOT fragments”.

## Executive findings

1. **PROVED — P0 contract violation:** `NumberField.errorMessage` is dropped. The implementation explicitly excludes it from field wiring and renders `FieldError` outside the context in which `FieldError` returns content. Source admits this is “a defect”.
2. **PROVED — P0 inert public API:** `NavigationMenuItem.onOpenChange` is accepted and never called. The code says exactly that.
3. **PROVED — P1 i18n policy violation:** `lumoValidators()` ships default announced validation prose, although REVIEW-BRIEF §2 says every screen-reader string must be a required prop and “No defaults”.
4. **PROVED — P1 controlled-value corruption:** `PhoneInput` does not infer country from its controlled E.164 value. A `+49…` value with no `defaultCountry` is interpreted under Iran's `98` plan and displayed beside `+98`.
5. **PROVED — P1 root-contract holes:** required labels/semantics in Frame, IconStack, IconTile, and MarkerIcon can be overwritten by inherited DOM props spread last.
6. **PROVED — P1 test vacuity:** IconStack's test says it covers fragments but supplies an array; MessageScroller's logical-end test inspects SSR where the jump button (and therefore its positioning class) is not rendered; InputOtp's “once” test never edits an already-complete code.
7. **PROVED — P1 type defect:** Menubar retains `orientation?: never`, the exact `exactOptionalPropertyTypes` spelling REVIEW-BRIEF says was repaired elsewhere.
8. **PROVED — P1 API/behavior mismatch:** InputOtp says `onComplete` “fires once” but calls it on every full-length commit.
9. **PROVED — P1 misleading audit residue:** NumberField and Message still contain obsolete migration prose that describes current components as React Aria or “not built”, when their imports/current sibling files show otherwise.
10. **PROVED — P2 new-tab inconsistency:** `MenuItem target="_blank"` bypasses Link's required warning and safe-rel contract; a disabled `Link newTab` still announces that it opens a new tab although it cannot.

## Current official competitor surface

Legend: S = shadcn/ui, R = ReUI, X = Radix Primitives, A = Ark UI, M = Mantine. A linked name is a direct official counterpart. “None” links the current official catalog used to establish absence.

| Lumo component | S | R | X | A | M |
|---|---|---|---|---|---|
| FileUpload | [None](https://ui.shadcn.com/docs/components) | [File Upload](https://reui.io/docs/components/base/file-upload) | [None](https://www.radix-ui.com/primitives/docs/components) | [File Upload](https://ark-ui.com/docs/components/file-upload) | [Dropzone](https://mantine.dev/x/dropzone/) / [FileButton](https://mantine.dev/core/file-button/) |
| FormState | [TanStack Form guide](https://ui.shadcn.com/docs/forms/tanstack-form) | [Form patterns](https://reui.io/patterns/field) | [Form](https://www.radix-ui.com/primitives/docs/components/form) | [Field/forms guide](https://ark-ui.com/docs/guides/forms) | [useForm](https://mantine.dev/form/use-form/) |
| Form | [Field](https://ui.shadcn.com/docs/components/base/field) | [Field patterns](https://reui.io/patterns/field) | [Form](https://www.radix-ui.com/primitives/docs/components/form) | [Field](https://ark-ui.com/docs/components/field) | [Input wrappers](https://mantine.dev/core/input/) |
| Frame | [None](https://ui.shadcn.com/docs/components) | [Frame](https://reui.io/docs/components/base/frame) | [None](https://www.radix-ui.com/primitives/docs/components) | [Frame utility](https://ark-ui.com/docs/utilities/frame) | [None](https://mantine.dev/core/package/) |
| Gantt | [None](https://ui.shadcn.com/docs/components) | [Gantt](https://reui.io/docs/components/base/gantt) | [None](https://www.radix-ui.com/primitives/docs/components) | [None](https://ark-ui.com/docs/overview/introduction) | [None](https://mantine.dev/core/package/) |
| HoverCard | [Hover Card](https://ui.shadcn.com/docs/components/base/hover-card) | [Hover Card](https://reui.io/patterns/hover-card) | [Hover Card](https://www.radix-ui.com/primitives/docs/components/hover-card) | [Hover Card](https://ark-ui.com/docs/components/hover-card) | [HoverCard](https://mantine.dev/core/hover-card/) |
| IconStack | [None](https://ui.shadcn.com/docs/components) | [Icon Stack](https://reui.io/docs/components/base/icon-stack) | [None](https://www.radix-ui.com/primitives/docs/components) | [None](https://ark-ui.com/docs/overview/introduction) | [OverflowList (adjacent)](https://mantine.dev/core/overflow-list/) |
| IconTile | [None](https://ui.shadcn.com/docs/components) | [Icon Tile](https://reui.io/docs/components/base/icon-tile) | [None](https://www.radix-ui.com/primitives/docs/components) | [None](https://ark-ui.com/docs/overview/introduction) | [ThemeIcon](https://mantine.dev/core/theme-icon/) |
| InputGroup | [Input Group](https://ui.shadcn.com/docs/components/base/input-group) | [Input Group patterns](https://reui.io/patterns/input-group) | [None](https://www.radix-ui.com/primitives/docs/components) | [Field/Input composition](https://ark-ui.com/docs/components/field) | [Input sections](https://mantine.dev/core/input/) |
| InputOtp | [Input OTP](https://ui.shadcn.com/docs/components/base/input-otp) | [Input OTP patterns](https://reui.io/patterns/input-otp) | [One-Time Password Field](https://www.radix-ui.com/primitives/docs/components/one-time-password-field) | [Pin Input](https://ark-ui.com/docs/components/pin-input) | [PinInput](https://mantine.dev/core/pin-input/) |
| Item | [Item](https://ui.shadcn.com/docs/components/base/item) | [Item patterns](https://reui.io/patterns/item) | [None](https://www.radix-ui.com/primitives/docs/components) | [None](https://ark-ui.com/docs/overview/introduction) | [None](https://mantine.dev/core/package/) |
| Kanban | [None](https://ui.shadcn.com/docs/components) | [Kanban](https://reui.io/docs/components/base/kanban) | [None](https://www.radix-ui.com/primitives/docs/components) | [None](https://ark-ui.com/docs/overview/introduction) | [None](https://mantine.dev/core/package/) |
| Kbd | [Kbd](https://ui.shadcn.com/docs/components/base/kbd) | [Kbd patterns](https://reui.io/patterns/kbd) | [None](https://www.radix-ui.com/primitives/docs/components) | [None](https://ark-ui.com/docs/overview/introduction) | [Kbd](https://mantine.dev/core/kbd/) |
| Link | [None](https://ui.shadcn.com/docs/components) | [None](https://reui.io/docs) | [None](https://www.radix-ui.com/primitives/docs/components) | [None](https://ark-ui.com/docs/overview/introduction) | [Anchor](https://mantine.dev/core/anchor/) |
| ListBox | [None](https://ui.shadcn.com/docs/components) | [None](https://reui.io/docs) | [None](https://www.radix-ui.com/primitives/docs/components) | [Listbox](https://ark-ui.com/docs/components/listbox) | [Combobox store (adjacent)](https://mantine.dev/core/combobox/) |
| Marker | [Marker](https://ui.shadcn.com/docs/components/base/marker) | [None](https://reui.io/docs) | [None](https://www.radix-ui.com/primitives/docs/components) | [None](https://ark-ui.com/docs/overview/introduction) | [Divider (adjacent)](https://mantine.dev/core/divider/) |
| Menu | [Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu) | [Dropdown Menu patterns](https://reui.io/patterns/dropdown-menu) | [Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) | [Menu](https://ark-ui.com/docs/components/menu) | [Menu](https://mantine.dev/core/menu/) |
| Menubar | [Menubar](https://ui.shadcn.com/docs/components/base/menubar) | [Menubar](https://reui.io/docs/menubar) | [Menubar](https://www.radix-ui.com/primitives/docs/components/menubar) | [None](https://ark-ui.com/docs/overview/introduction) | [Menubar](https://mantine.dev/core/menubar/) |
| MessageScroller | [Message Scroller](https://ui.shadcn.com/docs/components/message-scroller) | [None](https://reui.io/docs) | [Scroll Area (adjacent)](https://www.radix-ui.com/primitives/docs/components/scroll-area) | [Scroll Area (adjacent)](https://ark-ui.com/docs/components/scroll-area) | [Scroller (adjacent)](https://mantine.dev/core/scroller/) |
| Message | [Message](https://ui.shadcn.com/docs/components/message) | [None](https://reui.io/docs) | [None](https://www.radix-ui.com/primitives/docs/components) | [None](https://ark-ui.com/docs/overview/introduction) | [None](https://mantine.dev/core/package/) |
| NativeSelect | [Native Select](https://ui.shadcn.com/docs/components/base/native-select) | [Native Select patterns](https://reui.io/patterns/native-select) | [None](https://www.radix-ui.com/primitives/docs/components) | [None](https://ark-ui.com/docs/overview/introduction) | [NativeSelect](https://mantine.dev/core/native-select/) |
| NavigationMenu | [Navigation Menu](https://ui.shadcn.com/docs/components/base/navigation-menu) | [Navigation Menu patterns](https://reui.io/patterns/navigation-menu) | [Navigation Menu](https://www.radix-ui.com/primitives/docs/components/navigation-menu) | [None](https://ark-ui.com/docs/overview/introduction) | [NavLink (adjacent)](https://mantine.dev/core/nav-link/) |
| Num | [None](https://ui.shadcn.com/docs/components) | [None](https://reui.io/docs) | [None](https://www.radix-ui.com/primitives/docs/components) | [Format Number utility](https://ark-ui.com/docs/utilities/format-number) | [NumberFormatter](https://mantine.dev/core/number-formatter/) |
| NumberField | [None](https://ui.shadcn.com/docs/components) | [Number Field](https://reui.io/docs/components/base/number-field) | [None](https://www.radix-ui.com/primitives/docs/components) | [Number Input](https://ark-ui.com/docs/components/number-input) | [NumberInput](https://mantine.dev/core/number-input/) |
| Pagination | [Pagination](https://ui.shadcn.com/docs/components/base/pagination) | [Pagination patterns](https://reui.io/patterns/pagination) | [None](https://www.radix-ui.com/primitives/docs/components) | [Pagination](https://ark-ui.com/docs/components/pagination) | [Pagination](https://mantine.dev/core/pagination/) |
| PhoneInput | [None](https://ui.shadcn.com/docs/components) | [Phone Input](https://reui.io/docs/components/base/phone-input) | [None](https://www.radix-ui.com/primitives/docs/components) | [None](https://ark-ui.com/docs/overview/introduction) | [Input + country select only](https://mantine.dev/core/input/) |
| Popover | [Popover](https://ui.shadcn.com/docs/components/base/popover) | [Popover patterns](https://reui.io/patterns/popover) | [Popover](https://www.radix-ui.com/primitives/docs/components/popover) | [Popover](https://ark-ui.com/docs/components/popover) | [Popover](https://mantine.dev/core/popover/) |
| Progress | [Progress](https://ui.shadcn.com/docs/components/base/progress) | [Progress patterns](https://reui.io/patterns/progress) | [Progress](https://www.radix-ui.com/primitives/docs/components/progress) | [Linear Progress](https://ark-ui.com/docs/components/progress-linear) | [Progress](https://mantine.dev/core/progress/) |
| Provider | [Direction](https://ui.shadcn.com/docs/components/direction) | [None](https://reui.io/docs) | [Direction Provider](https://www.radix-ui.com/primitives/docs/utilities/direction-provider) | [Locale](https://ark-ui.com/docs/utilities/locale) | [MantineProvider](https://mantine.dev/theming/mantine-provider/) |
| RadioGroup | [Radio Group](https://ui.shadcn.com/docs/components/base/radio-group) | [Radio Group patterns](https://reui.io/patterns/radio-group) | [Radio Group](https://www.radix-ui.com/primitives/docs/components/radio-group) | [Radio Group](https://ark-ui.com/docs/components/radio-group) | [Radio.Group](https://mantine.dev/core/radio/) |
| RangeCalendar | [Calendar/Date Picker](https://ui.shadcn.com/docs/components/calendar) | [Calendar patterns](https://reui.io/patterns/calendar) | [None](https://www.radix-ui.com/primitives/docs/components) | [Date Picker](https://ark-ui.com/docs/components/date-picker) | [DatePicker `type="range"`](https://mantine.dev/dates/date-picker/) |

The official catalogs were also checked as catalogs, not just by guessed URLs: [shadcn components](https://ui.shadcn.com/docs/components), [ReUI docs](https://reui.io/docs), [Radix components](https://www.radix-ui.com/primitives/docs/components), [Ark docs](https://ark-ui.com/docs/overview/introduction), and [Mantine core](https://mantine.dev/core/package/).

## Component-by-component review

### 32. FileUpload

**Competitors.** ReUI manages state, previews, errors, max files/size, and removal; Ark is materially deeper: initial/controlled files, min/max size, max count, accept/reject callbacks, custom validation, transformation, directory and camera capture, previews, clear/rejected state, and document-drop prevention. Mantine splits the problem into Dropzone and FileButton. Shadcn and Radix have no direct official component. These gaps matter for production upload workflows; Lumo is currently a picker/drop event adapter plus presentational list, not an upload state machine. Lumo is better at required Persian naming and locale-correct file-size units.

- **PROVED — accepted types are picker-only.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/file-upload.tsx:205` — “`acceptedFileTypes.join(",")`”; dropped/pasted files go straight to delivery at `:241` — “`deliver(event.dataTransfer.files)`”. Unlike [Ark's documented accept/reject pipeline](https://ark-ui.com/docs/components/file-upload), a disallowed dropped file is delivered. This is an API-semantics surprise, not merely a missing convenience.
- **SUSPECTED — disabled/outside drops can navigate the document.** At `:237-240` the disabled branch returns before `preventDefault`: “`if (isDisabled === true) return; event.preventDefault();`”. Ark explicitly documents `preventDocumentDrop` as default-on to prevent accidental navigation. Browser integration should verify both a disabled target and a file dropped just outside it.
- **What Lumo does better.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/file-upload.tsx:157-167` requires both `label` and `triggerLabel`; Ark's `locale` defaults to `en-US`, and ReUI examples contain English literals.

### 33. FormState

**Competitors.** Shadcn documents TanStack Form, React Hook Form and Formisch integration; Radix Form provides client validation parts; Ark Field focuses on field semantics; Mantine `useForm` includes controlled/uncontrolled modes, nested values, async validation with abort signals, schema resolvers, error state, and input-node lookup. Lumo's TanStack wrapper is strong on Persian digits, visible Unicode length, Iranian national ID/mobile validation, SSR default values, and automatic first-invalid focus.

- **PROVED — standing string rule violated.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/form-state.tsx:369-386` says “`A validation message is application copy — it has a sensible default`” and ships `MESSAGES` in both languages; `:535-537` makes `message` optional and falls back to that catalog. These messages reach `errorMessage` and are announced. `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/REVIEW-BRIEF.md:31` says “`Every string a screen reader announces is a REQUIRED prop. No defaults`”. [Mantine validation](https://mantine.dev/form/validation/) takes caller-provided error messages, which is closer to the stated Lumo policy.
- **SUSPECTED — unsafe signature cast can hide future TanStack drift.** `:157-161` ends “`) as unknown as typeof useForm`”. Today the wrapper adds one default, but the body is not type-checked against all overload semantics. Add a compile-time conformance test that fails when TanStack changes its signature/default logic.
- **What Lumo does better.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/form-state.tsx:472-477` routes numeric validators through `parseNumber`, preserving Persian numerals and separators—none of the five competitors documents this Persian-first guarantee.

### 34. Form

**Competitors.** Shadcn's current Field family includes FieldSet, FieldLegend, FieldGroup, FieldContent, FieldSeparator, responsive/horizontal orientation, and multiple-error arrays/Standard Schema issues. Radix Form includes field/message/validity parts. Ark Field/Fieldset likewise provide semantic grouping. Mantine inputs integrate labels, descriptions and errors with `useForm`. Lumo has unusually strong first-byte IDREF wiring and required labeling at composed controls, but its standalone family is narrower.

- **PROVED — missing semantic/grouping surface versus current shadcn/Ark.** Lumo's exported family is Field/Label/Description/FieldError/Form; `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/form.tsx:284-323` defines only a single `FieldProps` and `:600-618` only a scalar `children` error. Shadcn's official Field docs ship fieldset/legend/group/content/separator and an `errors` array. This matters for related radio/checkbox groups and error summaries.
- **PROVED — closed FieldError root surface.** `:621-627` says “`No rest parameter`” and the component binds only class/children, even though `FieldErrorProps` extends global DOM props. That makes declared DOM props inert. This is exactly the source-rule class the audit says is unacceptable.
- **What Lumo does better.** `:627-645` refuses to render a field error without wiring context rather than emitting a loose, unassociated message; first-byte association tests are materially stronger than competitors' examples.

### 35. Frame

**Competitors.** ReUI ships a richer preview Frame; Ark's Frame utility provides aspect-ratio-aware embedding. Shadcn, Radix, and Mantine have no direct component. Lumo's browser/phone/plain variants, server rendering, hidden decorative chrome, and LTR URL island are purposeful.

- **PROVED — required name can be overridden.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/frame.tsx:74-89` inherits all div ARIA props without omitting `aria-label`; render order at `:94-99` is “`aria-label={label} ... {...props}`”. `<Frame label="Persian" aria-label="English">` defeats the required label and no type rejects it.
- **SUSPECTED — wrong polymorphic root type.** The rendered element is `<figure>` at `:94`, but the public base is `ComponentProps<"div">` at `:75`. Most attributes overlap; type-level tests should identify figure-specific omissions/inapplicable props.
- **What Lumo does better.** `:103-114` hides decorative chrome and isolates the address with `dir="ltr"`/`data-lumo-latn`, a direct RTL/a11y improvement over decorative mockups built from faux controls.

### 36. Gantt

**Competitors.** ReUI is the only direct competitor and ships day-through-year scales plus richer dependency/resize/rollup/zoom/critical-path/baseline behavior. Shadcn, Radix, Ark, and Mantine have no direct component. Those omissions matter for project-management use, but Lumo's current smaller contract is honest and its Jalali geometry, logical placement, keyboard moves, required announcements, and SSR tab stop are unusually strong.

- **PROVED — intentionally incomplete rather than defective.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/gantt.tsx:58-88` explicitly lists “`No dependency arrows`”, “`No summary or rollup rows`”, “`No drag-resize`”, “`No free zoom`”, “`No critical path`”, and “`No baseline comparison`”. ReUI's current Gantt makes this a meaningful parity gap.
- **SUSPECTED — invalid task ranges are not rejected at the type boundary.** `:211-226` declares start/end independently and only says end is inclusive. A task with `end < start` needs a rendered/interaction probe; no constructor or branded type prevents it.
- **What Lumo does better.** `:254-259` exposes placement as `insetInlineStart`/`inlineSize`, and `:143-156` computes unequal Jalali months. ReUI's own RTL documentation says Gantt has not been formally verified; Lumo has targeted RTL/calendar tests.

### 37. HoverCard

**Competitors.** All five ship a direct hover card. Radix/Ark expose controlled open state, portal/container, collision and positioning controls; Mantine additionally ships synchronized `HoverCard.Group` delays and clearly documents that the card is ignored by screen readers and keyboard-inaccessible. Lumo instead makes its popup a named dialog reachable to virtual navigation; that is more inclusive, though the semantics diverge from the conventional supplementary-preview model.

- **SUSPECTED — dialog semantics on hover-only preview.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/hover-card.tsx:275-283` sets `role="dialog" aria-label={label}` while retaining hover preview behavior. Mantine explicitly says HoverCard is ignored by screen readers and should hold only optional information; Radix describes it “for sighted users”. Verify VoiceOver/NVDA focus/virtual-cursor behavior before claiming this hybrid is superior.
- **PROVED — disabled implementation is clean.** `:223-236` removes the popup and clones only the trigger classes. Existing tests compare bytes. This is better than an inert popup remaining discoverable.
- **Gap.** Lumo has no equivalent to Mantine's delay group or the broad collision/controlled-state surface in Radix/Ark. It matters in dense profile-link grids.

### 38. IconStack

**Competitors.** ReUI has the direct component; Mantine OverflowList is an adjacent generic overflow primitive. Shadcn, Radix, and Ark have none. Lumo's locale-formatted overflow and logical overlap are better for Persian UI.

- **PROVED — Fragment children are miscounted.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/icon-stack.tsx:95-100` claims “`Children.toArray ... flattens fragments`” and slices that result. It does not flatten Fragments; the read-only React 19 reproduction returned one Fragment for two inner children. Overflow and `max` are therefore wrong for a natural fragment composition.
- **PROVED — test is vacuous/misnamed.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/icon-tile.test.tsx:99-108` names “`fragments and nulls behave`” but passes `{[<span .../>, <span .../>]}`—an array, not a Fragment. This test stays green with the defect.
- **PROVED — accessible name can be overridden.** `icon-stack.tsx:67-83` inherits `aria-label`/`role`; `:103-109` writes required semantics before “`{...props}`”. The consumer can turn the one named image into an anonymous or misleading role.

### 39. IconTile

**Competitors.** ReUI Icon Tile and Mantine ThemeIcon offer richer visual surfaces; Shadcn, Radix and Ark have no direct component. Lumo's semantic default (decorative unless named) and paired tone/foreground tokens are better than a merely styled box.

- **PROVED — semantic contract is overrideable.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/icon-tile.tsx:133-147` inherits all span ARIA props; `:166-170` writes `aria-hidden` or named `role="img"` and then spreads “`{...props}`”. A caller can create the unnamed `role="img"` the comment says is impossible.
- **Test gap.** Existing tests prove default and named cases, but no test supplies conflicting `role`/`aria-hidden`/`aria-label`. The required root-contract omission should be a type assertion.
- **What Lumo does better.** `:116-129` couples semantic tone with contrasting foreground and supports subtle/solid across five tones; Mantine ThemeIcon is more flexible but does not make Persian/a11y semantics part of the component contract.

### 40. InputGroup

**Competitors.** Shadcn and ReUI offer a broader compositional anatomy (addons, text, buttons, textarea, multiple controls); Ark/Mantine cover the use case through Field/Input sections; Radix has no direct component. Lumo's required label and shared Field wiring are better than bare decorative groups.

- **PROVED — narrower but coherent.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/input-group.tsx:137-170` provides only `leading` and `trailing` slots around one FieldInput. This lacks shadcn's inline addon/alignment/textarea patterns, but avoids arbitrary nested interactive geometry.
- **SUSPECTED — addon interaction semantics are caller-dependent.** The slots are generic divs at `:138` and `:166`; only `InputGroupButton` guarantees an icon label at `:175-189`. Add tests for focus order and accessible naming when both addons contain controls.
- **What Lumo does better.** `:123-133` translates validation into Base Field and `:135-170` always wires a real Label/Description/Error around the input; shadcn's primitive remains assembly-by-convention.

### 41. InputOtp

**Competitors.** Every vendor now has a direct OTP/pin input. Shadcn uses `input-otp`; Radix has a native One-Time Password Field; Ark supports paste, blur completion, invalid state, pattern, OTP mode, and API/context; Mantine supports controlled/uncontrolled values, `name`/FormData, regex filtering, one-time-code, success/error, and styles. Lumo's one-input model, Persian-display/ASCII-output normalization, leading-zero preservation, and required label are excellent.

- **PROVED — `onComplete` does not “fire once”.** Contract at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/input-otp.tsx:173-180` says “`Fires once the last box is filled`”. Implementation at `:230-235` calls “`if (digits.length === length) onComplete?.(digits)`” on every full-length change. Replacing digit four after completion fires again.
- **PROVED — existing test does not test once-ness.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/input-otp.test.tsx:121-130` performs only one incomplete change and one complete change. A mutation/removal of any previous-complete guard would be invisible because no such guard exists or is tested.
- **SUSPECTED — visual caret lies after arbitrary cursor movement.** Source admits at `input-otp.tsx:224-226`: “`click box two of a filled code and the highlight still shows box six`”. This matters for editing error codes; Radix/Ark's mature state machines are likely safer.

### 42. Item

**Competitors.** Shadcn and ReUI have direct Item patterns; the other three do not. Lumo improves the upstream RTL alignment, removes false list semantics, and uses a discriminated anchor/button/static root.

- **SUSPECTED — nested interactive content remains expressible.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/item.tsx:105-132` permits arbitrary `LumoNode` children for both anchor and button variants, while `ItemActions` is a generic div at `:222-223`. Nothing prevents a Button/Link inside a pressable Item, producing invalid nested interactivity. Shadcn's compositional Item has the same general risk; Lumo's stronger union does not solve it.
- **PROVED — link form cannot announce new-tab behavior.** `:110-115` explicitly removes `target` and `rel`. This is a defensible decline because Link owns the warning pair, but it also means a whole-row link cannot use the library's safe new-tab behavior without restructuring.
- **What Lumo does better.** `:134-163` selects a real `<a>`, Base Button, or inert `<div>` by discriminant; no role/tab stop is fabricated.

### 43. Kanban

**Competitors.** ReUI is the only direct component. It provides production patterns and recently added `onValueCommit` plus accessibility improvements. Shadcn, Radix, Ark, and Mantine have no direct counterpart. Lumo's keyboard/pointer shared state machine, RTL rect hit testing, endpoint-only live announcements, focus restoration and cancellation are unusually thorough.

- **Gap that matters:** no column/card add/remove, WIP constraints, disabled/locked cards, multi-select, drag overlay, or separate commit callback. Local API is only `columns`, `onColumnsChange`, strings and renderer at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/kanban.tsx:242-257`.
- **SUSPECTED — high-frequency controlled commits.** `:448-453` says pointer move “`pushed through onColumnsChange dozens of times per second`”. ReUI's separate `onValueCommit` is useful: persistence/analytics should not run on every hover slot. This matters materially in remote or expensive state stores.
- **What Lumo does better.** `:625-633` handles `pointercancel`, filters pointer IDs and removes all window listeners; tests cover second fingers, destroyed handles, empty columns and RTL rects.

### 44. Kbd

**Competitors.** Shadcn/ReUI/Mantine ship styled Kbd; Radix and Ark have none. Lumo uniquely treats a chord as an LTR bidi island and owns separators, preventing `Ctrl + K` reversal in Persian.

- **PROVED — closed DOM surface.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/kbd.tsx:68-87` exposes only `keys`, `separator`, `size`, and `className`; `:89-120` does not spread DOM props. Consumers cannot set `id`, `title`, `aria-label`, `data-*`, or event props on the wrapper. This is one of the “81 closed surfaces” the brief says remain unjudged; here the loss of `aria-label` matters for symbolic chords.
- **SUSPECTED — verbal separator omitted from accessible name.** `:101-107` always marks the separator `aria-hidden`, even if the caller passes a meaningful word rather than punctuation. The doc warns against prose but the type permits it.
- **What Lumo does better.** `:91-116` uses one `dir="ltr"` isolate and separate `<kbd>` elements, a concrete RTL improvement absent from competitor docs.

### 45. Link

**Competitors.** Mantine Anchor is the only direct styled counterpart; the other four rely on native anchors or typography. Lumo's real anchor, server rendering, Arabic-script underline offset, typed `aria-current`, disabled fallback, and required new-tab warning are materially better.

- **PROVED — disabled link can announce a false new-tab promise.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/link.tsx:219-223` appends `newTabLabel` whenever supplied. The disabled/no-href branch at `:234-247` renders a non-activatable span, but does not suppress that label. `<Link href="…" newTab ... isDisabled>` announces “opens in a new tab” and cannot open anything.
- **SUSPECTED — href-less enabled role=link is a keyboard dead end.** `:234-244` gives an href-less span `role="link" tabIndex={0}` but no click/key handler. It is announced and focusable yet cannot navigate. The comment calls it “non-navigating link”; that is an oxymoronic control. Prefer static text unless activation is supplied.
- **What Lumo does better.** `:170-192` makes `_blank` and its announced warning a discriminated pair, which Mantine's raw Anchor does not enforce.

### 46. ListBox

**Competitors.** Ark is the only direct standalone Listbox and ships collection state, controlled selection, grouping, disabled items, typeahead/highlight behavior, form integration and a machine/context API. Mantine Combobox is adjacent; Shadcn, ReUI, and Radix have no direct standalone component. Lumo is impressive: SSR roving tab stop, fragments, single/multiple/none selection, disabled keys, Shift ranges, Ctrl/Command+A, paging, wrap, action, dynamic items, Persian folding, and direction-aware horizontal keys.

- **PROVED — documented parity reductions.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/list-box.tsx:113-134` lists lost drag/drop, empty state, grid layout, replace behavior, escape behavior, press-up selection, autofocus, sections and virtual focus; `:127-130` admits Shift range replaces rather than unions a disjoint selection. Ark's collection/machine is materially deeper for complex lists.
- **SUSPECTED — arbitrary non-item children are cast into descriptors.** `:234-243` pushes every valid non-Fragment element “`as ReactElement<ListBoxItemProps<T>>`” without verifying `child.type`. A conditional wrapper/component can acquire an undefined key and no option semantics while still consuming an index. The API should either validate or type-constrain direct children.
- **What Lumo does better.** `:224-245` correctly implements recursive Fragment flattening—the exact handling missing in IconStack—and tests first-byte single-tab-stop behavior.

### 47. Marker

**Competitors.** Shadcn is the only direct Marker; Mantine Divider is adjacent. ReUI, Radix and Ark have none. Lumo improves shadcn's physical left/right spacing and correctly avoids misusing `role="separator"` for readable conversation text.

- **PROVED — MarkerIcon's hidden contract is overrideable.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/marker.tsx:79-83` inherits all span props; `:91-97` writes `aria-hidden="true"` and then “`{...props}`”. A caller can set `aria-hidden={false}` or a role, contradicting “unconditionally”.
- **SUSPECTED — `variant="border"` uses nonstandard Tailwind spellings.** `:55` contains “`border-be ... pbe-2`”. The audit says logical conventions are enforced, but these utilities should be verified in emitted CSS; a source-only class can silently produce no rule. (No mutation performed.)
- **What Lumo does better.** `:20-34` uses plain text semantics and flex-gap hairlines that mirror with flow; shadcn's current Marker is presentational and does not document this Persian-specific reasoning.

### 48. Menu

**Competitors.** All five ship menu/dropdown menu surfaces except the distinction is styled vs primitive. Radix/Ark/Mantine expose controlled state, nested menus, checkbox/radio items, positioning/collision controls, typeahead and lifecycle callbacks. Lumo has required menu naming, SSR open-state compensation, current-item semantics, submenus, groups and Persian-safe strings, but retains several migration scars.

- **PROVED — unsafe new-tab escape hatch.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/menu.tsx:417-420` permits `href` plus arbitrary `target`; render at `:551-560` forwards target but no required warning and no `rel`. This bypasses Link's explicitly defended new-tab/a11y/security contract.
- **PROVED — type-carrier generality adds confusing dead props.** `:323-337` exposes `items?: (Iterable<T> & never) | undefined`; `:394-411` exposes `value?: (T & never) | undefined`. These preserve source compatibility but make generated API docs advertise values no caller can use. Prefer deprecated type aliases or a breaking major cleanup.
- **What Lumo does better.** `:503-505` couples `isCurrent` to `aria-current` and `:518-530` couples it to the visual tick, making state non-visual-only.

### 49. Menubar

**Competitors.** Shadcn/ReUI/Radix/Mantine ship direct menubars; Ark currently does not. Radix and Mantine expose richer loop/orientation/controlled behavior. Lumo's Base UI engine, first-byte exactly-one tab stop, required row label and direction-aware navigation are strong.

- **PROVED — exact `?: never` defect remains.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/menubar.tsx:193-200` declares “`orientation?: never`”. Under `exactOptionalPropertyTypes`, a spread with `orientation: undefined` is rejected. REVIEW-BRIEF §10 calls the same spelling in `props.ts` a known defect and says the repaired form is `?: undefined`; Menubar was missed.
- **PROVED — many accepted behavior props are inert.** `:250-272` destructures `onPress`, press-start/end/up/change, hover callbacks, focus-change, pending and exclude-from-tab-order solely into underscore names. Documentation explains the engine mismatch, but callers still compile and behavior silently does not happen.
- **What Lumo does better.** `:285-308` gives exactly one pre-hydration tab stop and yields back to the engine after mount; current competitor docs generally discuss hydrated keyboard behavior, not served bytes.

### 50. MessageScroller

**Competitors.** Shadcn now has a direct Message Scroller. Radix/Ark ScrollArea and Mantine Scroller are adjacent scrolling primitives; ReUI has no direct transcript scroller. Lumo adds log/live semantics, pinned-only-follow behavior, logical jump placement, required names and DOM-order preservation.

- **PROVED — logical-end test is vacuous.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/message-scroller.test.tsx:52-57` renders static markup and asserts it lacks `right-4`, while saying “`The class is in the served bytes even though the button is not rendered`”. It cannot be in the bytes: implementation renders the button only when `isPinned` is false at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/message-scroller.tsx:248-258`, and initial state is true at `:153-154`. Replacing `end-4` with `right-4` leaves this test green.
- **SUSPECTED — reduced motion is not honored.** Viewport classes at `message-scroller.tsx:93-95` include unconditional “`scroll-smooth`”; no `motion-reduce:scroll-auto` appears. The older Message design note itself lists reduced-motion handling as required.
- **Gap.** The public surface at `:111-126` has no root/viewport refs, initial pin option, onPinChange, unread count, pause-live option, or imperative scroll method. Shadcn's new specialized component should be evaluated for these before claiming parity.

### 51. Message

**Competitors.** Shadcn now ships the direct Message anatomy; the other four catalogs have no direct chat-message component. Lumo's server-renderable slots, sent/received logical layout, and formatted-string timestamp contract are good.

- **PROVED — source documentation is stale and factually false.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/message.tsx:35-63` is headed “`MessageScroller: MEASURED, AND NOT BUILT`” and says “`it is not here`”; `packages/ui/src/message-scroller.tsx:128` exports `MessageScroller`, and it has a dedicated suite. This is exactly the audit-fix drift the brief asks reviewers to attack.
- **PROVED — another false claim in that stale prose.** `message.tsx:53-56` says the bookkeeping is “`every line of it untestable in jsdom`”. The dedicated test defines scroll geometry at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/message-scroller.test.tsx:25-34` and tests scroll state. The brief explicitly warns that comments asserting untestability are not evidence.
- **What Lumo does better.** `message.tsx:147-176` chooses `<time>` only when valid machine-readable `dateTime` is supplied; otherwise it uses a span, avoiding invalid semantic markup.

### 52. NativeSelect

**Competitors.** Shadcn/ReUI/Mantine have direct native selects; Radix and Ark do not. Mantine adds left/right sections, clearable-like composition through its Input wrapper, styles API, error/description/required indicators and broad native props. Lumo adds a required real label, optional visually-hidden label, server-only behavior, logical chevron/padding, focus marker, invalid state and optgroup label.

- **PROVED — styling surface is asymmetric.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/native-select.tsx:69-87` exposes one `className`; `:102-121` applies it to the outer wrapper while the select receives only `nativeSelectVariants`. Consumers cannot customize the actual control without a descendant selector. Mantine's Styles API is materially better here.
- **SUSPECTED — `labelHidden` plus duplicate surrounding Field labels.** PhoneInput nests a hidden NativeSelect label inside a Field that already labels the phone input. The two controls have distinct names, which is correct, but browser/AT group announcement should be checked for repetitive output.
- **What Lumo does better.** `:104-121` guarantees a real `<label for>` in the first byte; shadcn's primitive can still be used bare and unnamed.

### 53. NavigationMenu

**Competitors.** Shadcn/ReUI/Radix ship direct navigation menus; Ark has none and Mantine NavLink is only adjacent. Radix explicitly supports controlled/uncontrolled value, vertical orientation, submenus, optional indicator, managed tab focus, flexible viewport and client routing. Lumo adds a required nav landmark label, safe current/new-tab Link, logical placement and demotes the popup's duplicate nav landmark.

- **PROVED — public callback is knowingly inert.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/navigation-menu.tsx:269-277` says `onOpenChange` “`is accepted and NOT called`”; `:289-295` destructures it to `_onOpenChange`. This is a direct violation of the project's inert-prop rule and a high-severity consumer bug.
- **PROVED — one constant cannot identify multiple controlled items.** `:195` defines one `OPEN_ITEM`; `:214-228` finds the first nested open prop and maps true to that constant; `:297-302` gives every declared-open item the same value. The source itself says two items cannot be distinguished. Radix's root `value` API is more honest and capable.
- **Test gap.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/navigation-menu.test.tsx:39-87` never supplies or asserts `onOpenChange`, so the accepted-and-dropped callback remains green.

### 54. Num

**Competitors.** Ark Format Number and Mantine NumberFormatter are direct formatter utilities/components; Shadcn, ReUI and Radix have none. Mantine supports prefix/suffix, grouping separator, decimal scale, fixed decimals and thousands grouping. Lumo uniquely forces locale and guarantees Persian numbering/calendar through central formatters.

- **PROVED — public type contradicts “thin window onto Intl”.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/num.tsx:24-32` claims the rest binding keeps a “`thin window onto Intl.NumberFormatOptions`”, but `:34-41` declares only style, currency and min/max fraction digits. Valid Intl options such as `unit`, `unitDisplay`, `notation`, `signDisplay`, `useGrouping`, and `currencyDisplay` do not type-check.
- **PROVED — DateText has the same truncation.** `:52-69` exposes only dateStyle/year/month/day, excluding hour/minute/timeZone/weekday/calendar. This is especially surprising because the component renders a full ISO instant at `:83-87`.
- **What Lumo does better.** `:44-49` centralizes locale formatting and avoids re-enabling Latin-centric tabular numerals on Persian text.

### 55. NumberField

**Competitors.** ReUI, Ark and Mantine ship direct number inputs; Shadcn and Radix do not. Ark/Mantine provide clamp behavior, decimal scale, prefix/suffix, hide controls, wheel/step/scrub options, formatter/parser hooks and broad style anatomy. Lumo adds required labels for field and steppers, Persian formatting/`aria-valuetext`, required localized role description, locale-aware keyboard adaptation, wheel and commit translations.

- **PROVED — P0: `errorMessage` renders nothing and is unassociated.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/number-field.tsx:332-343` says “`the reason is a defect in this file`” and excludes `errorMessage` from `useFieldWiring`. It then renders `<FieldError>` at `:432-435` outside a Lumo `<Field>`. `FieldError` returns null when context is absent at `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/form.tsx:627-640`. Therefore the authored error disappears.
- **PROVED — `validate` is inert.** `number-field.tsx:322-324` destructures “`validate: _validate`” and never translates it. The prop is inherited in the public type at `:208-219`. This should be removed or implemented.
- **PROVED — migration prose is stale.** `:333-341` says FieldError is “`still React Aria's`”; current `form.tsx:642` renders `BaseField.Error`. `:392-398` likewise calls Label React Aria, while current imports in `form.tsx` are Base UI. The stale diagnosis may now be masking a fixable bug.

### 56. Pagination

**Competitors.** Shadcn/ReUI/Ark/Mantine have direct pagination; Radix does not. Ark/Mantine include first/last controls, boundaries/siblings, controlled/uncontrolled state, disabled state, item render customization and compound hooks/context. Lumo has semantic nav/list markup, current-page state, required labels, locale-formatted visible and spoken page numbers, and interactive callbacks.

- **PROVED — empty result set is coerced to one page.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/pagination.tsx:180-181` does “`const total = Math.max(1, Math.floor(count))`”. `count={0}` renders page 1 and marks it current. If `count` means page count as documented at `:138-140`, this is false information; consumers need an explicit empty behavior.
- **SUSPECTED — callback fires impossible values only if engine dispatches disabled click.** Prev/next callbacks compute `current ± 1` at `:193-198` and `:230-235`. Native disabled BaseButton should block clicks; retain a test because a future render-prop/adoption change could bypass that protection.
- **What Lumo does better.** `:262-277` formats once and uses the same localized string for visible content and accessible label, preventing Persian digit drift.

### 57. PhoneInput

**Competitors.** ReUI has the only direct competitor and offers broader country metadata/patterns. Shadcn, Radix, Ark and Mantine have no direct phone input. Lumo's Persian numeral acceptance, ASCII E.164 output, bidi island, native country picker, required names and transparent weak validation are strong.

- **PROVED — controlled E.164 does not select/infer its country.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/phone-input.tsx:210-226` initializes country from `defaultCountry ?? fallback` and computes national digits using only that selected dial: “`toNational(value, dial)`”. A controlled `+49123…` with defaults selects Iran, strips no `98`, displays the entire `49123…` as an Iranian national number, and shows a `+98` prefix.
- **PROVED — duplicate dial codes are ambiguous.** `:109-110` ships US and Canada both with dial `1`; `isValidPhone` at `:343-348` chooses the first match. It cannot distinguish their plans (they happen to share length today, but custom metadata can differ).
- **Gap that matters.** Validation is length-only by design at `:327-348`; ReUI or libphonenumber-backed consumers can validate country plans. Given the no-new-runtime-dependency rule, Lumo's honest weak validator is preferable to a hand-maintained false validator, but docs should emphasize gateway validation.

### 58. Popover

**Competitors.** All five ship direct popovers. Radix/Ark/Mantine expose controlled open state, modal/trap behavior, collision boundaries, flip/shift, outside-interaction callbacks, focus lifecycle, portal container, arrow, virtual anchors and imperative/context APIs. Lumo has logical placements, trigger adoption, first-byte naming and required-string discipline, but its public surface accepts many nonfunctional legacy props.

- **PROVED — large inert-prop block.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/popover.tsx:478-526` labels props “`ACCEPTED BY THE API, UNREACHABLE IN BASE UI`” and discards isNonModal, shouldFlip, triggerRef, animation flags, boundaries, scrollRef, maxHeight, update positioning, outside close, portal container, slot and style. Documentation does not cure a compiling no-op.
- **PROVED — important competitor capabilities are among the dropped props.** In particular, `shouldCloseOnInteractOutside`, boundary/container control and portal container correspond to official Radix/Ark/Mantine APIs. These matter for nested overlays, editors, constrained panels and tests.
- **What Lumo does better.** `:528-550` supplies trigger-derived naming unless the caller explicitly names the popup, avoiding unnamed dialog content in the first byte.

### 59. Progress

**Competitors.** Shadcn/ReUI/Radix/Ark/Mantine all ship linear progress; Ark and Mantine additionally ship circular/ring and multi-section forms. Lumo also provides a true `role="meter"`, required labels, locale-stable visible/spoken formatting, caller format options and localized indeterminate text.

- **SUSPECTED — out-of-range visible/semantic mismatch.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/progress.tsx:180-182` clamps only the fraction, while `:197-201` formats the raw `value`; root receives raw value at `:286-301`. With value 150/max 100 the bar can clamp visually while text/ARIA says 150%. Add bounds tests and either clamp once or reject invalid input.
- **SUSPECTED — invalid range `max < min`.** `fractionOf` does not guard negative ranges, only equality. Neither type nor runtime validates the invariant.
- **What Lumo does better.** `:300-334` ensures the visible string and `aria-valuetext` are identical and localizes Base UI's English indeterminate phrase; existing poison-twin tests are substantive.

### 60. Provider

**Competitors.** Shadcn/ Radix offer direction providers, Ark offers Locale, and MantineProvider owns theme/color/env; ReUI has no direct provider. Lumo intentionally does less: one locale input feeds its locale context and Base UI direction. That makes locale/direction disagreement unrepresentable.

- **PROVED — narrow contract is intentional and good.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/provider.tsx:93-109` exposes only required `locale`/`children` and computes `DirectionProvider direction={direction(locale)}`.
- **Gap, low severity.** It does not set document `lang`/`dir`, theme, color scheme, CSP nonce or environment; `:71-81` explicitly delegates HTML to `LumoHtml`. MantineProvider is broader but also permits more levers to disagree. This is a good decline, not a defect.
- **Tests are non-vacuous.** Provider tests compare fa/en and bare Base UI and include a specific “guards a vacuous pass” control. No issue found in scope.

### 61. RadioGroup

**Competitors.** All five ship radio groups. Radix exposes orientation/loop, Ark has item/context/machine/form APIs, Mantine has card/indicator/group variants, and shadcn/ReUI provide styled assemblies. Lumo has required group and option labels, descriptions/errors, validation translation, SSR exactly-one tab stop, locale direction and detailed option descriptions.

- **PROVED — orientation is visual only.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/radio-group.tsx:117-127` states Base UI answers both axes and Lumo keeps `orientation` as “`purely visual`”. Radix's direct component supports horizontal/vertical keyboard orientation. This matters in dense horizontal groups because Up/Down can unexpectedly change value while the user expects page movement.
- **PROVED — `validationBehavior` is accepted and dropped.** `:203-216` destructures it under “`accepted by the API, unreachable`”. As elsewhere, the type should not promise it.
- **What Lumo does better.** `:218-221` chooses checked/default/first option for first-byte tab stop, and `:243-250` uses group labeling rather than a fake single native label.

### 62. RangeCalendar

**Competitors.** Ark Date Picker and Mantine DatePicker directly support range mode and multiple months; shadcn/ReUI cover range through Calendar patterns; Radix has no date primitive. Ark/Mantine have broader view navigation, presets, multiple columns, exclusion, locale, form and value APIs. Lumo's differentiator is first-class `CalendarDate`, Jalali conversion/arithmetic, Persian labels/digits/week start, logical range rounding, explicit bounds and server-stable language.

- **PROVED — error is not associated with the calendar.** `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/range-calendar.tsx:161` merges only the description id into `aria-describedby`; error renders separately at `:241-244` as `<div role="alert">` with no id. The error may be announced on insertion but is not discoverable as the calendar's description when focus returns.
- **PROVED — no `today` input, so first byte remains clock-dependent.** Props at `:77-106` contain no `today`; DayPicker is invoked at `:163-235` without one. REVIEW-BRIEF §10 already lists this for Calendar, and RangeCalendar shares the same engine. This matters for build-time vs client-time “today” hydration and deterministic screenshots.
- **What Lumo does better.** `:148-154` uses the same bounds as disabled selection matchers, not navigation alone, and `:203-231` converts both ends back into the reader's calendar.

## Audit, tests, and tooling findings

### Proved vacuous or misleading tests

| Finding | Evidence | Mutation that would survive (not performed) |
|---|---|---|
| IconStack Fragment test never uses a Fragment | `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/icon-tile.test.tsx:99-106` — “`fragments and nulls behave`” followed by an array literal | Leave `Children.toArray` unchanged or deliberately count Fragment as one; test remains green. |
| MessageScroller logical-end assertion grades absent markup | `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/message-scroller.test.tsx:52-57` — “`even though the button is not rendered`” | Replace `end-4` with `right-4`; SSR still contains neither because the button is absent. |
| InputOtp once-ness is not tested | `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/input-otp.test.tsx:122-130` performs only one complete transition | Fire `onComplete` on every full edit (the current implementation); test remains green. |
| NavigationMenu callback hole untested | `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/navigation-menu.test.tsx:22-37` fixture supplies no `onOpenChange` | Drop the callback (current implementation); all tests remain green. |
| NumberField error loss lacks a rendered-message assertion | `/Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui/packages/ui/src/number-field.tsx:332-341` openly says message is dropped | Keep rendering null (current implementation); shared state-vocabulary tests still pass because they assert invalid state, not message existence/IDREF. |

### Gate/audit issues

- **PROVED — the inert-prop gate tolerates documented no-ops.** NavigationMenu `onOpenChange`, NumberField `validate`, RadioGroup `validationBehavior`, Menubar press callbacks and Popover's large legacy block all compile and are deliberately destructured. A gate that treats underscore-destructuring as delivery cannot enforce the stated “translate → relocate → make unrepresentable” rule.
- **PROVED — root-contract enforcement is incomplete.** Frame, IconStack, IconTile and MarkerIcon allow owned ARIA props to override required semantics because the type does not omit them and spread order is last. The claimed root contract mostly checks ref/id/class forwarding, not semantic ownership.
- **PROVED — comments are counted as evidence too readily.** NumberField's comments still diagnose React Aria after Form migrated to Base UI, and Message says MessageScroller is not built. Both are current-source contradictions, not historical trivia marked as such.
- **SUSPECTED — `gate:props` name collision false negative is active here.** NumberField's `errorMessage` appears many times in comments/JSX but is not delivered into wiring; the brief already says name-based matching can miss such a prop. This component is a concrete candidate to add as a poison fixture.

## Blind rating for this 31-component slice

This is not a whole-library rerating; it is the reviewed slice, scored against the five current competitors.

| Dimension | Score | Reason |
|---|---:|---|
| Accessibility / i18n / RTL | **8.0/10** | Exceptional Persian digits/calendars, logical geometry, required naming and first-byte work; reduced by dropped NumberField errors, overrideable owned ARIA, inert callbacks, RangeCalendar error association and FormState default announced prose. |
| Testing / tooling | **7.0/10** | Many excellent poison twins and interaction tests, especially Gantt/Kanban/ListBox/Progress; reduced sharply by three proved vacuous claims and gates that accept documented no-ops. |
| API design / DX | **6.5/10** | Strong discriminated Link/Item APIs and locale contracts; reduced by inert legacy props, truncated Intl surfaces, PhoneInput controlled-value mismatch, type-carrier dead props, `?: never`, and inconsistent styling/root surfaces. |
| Design system / docs | **7.0/10** | Thoughtful tokens and unusually rich rationale; reduced by obsolete prose stated as present fact and competitor parity gaps in file upload/forms/number field/popover. |
| **Overall** | **7.1/10** | Strong Persian-first engineering with several serious correctness holes hidden behind unusually persuasive comments and green tests. |

Difference from REVIEW-BRIEF §6's post-fix claims: accessibility/i18n/RTL **−1.0**, testing/tooling **−2.0**, API/DX **−1.5**, design/docs **0.0**, overall approximately **−1.15** (8.25 claimed vs 7.1 for this slice). The slice is not directly comparable to all 94 components, but it is sufficient to reject 9/9/8 as established facts.

## Declined findings

- I did **not** call every missing competitor feature a defect. Gantt dependencies/critical path, full phone metadata, circular progress, Frame device catalog, and provider theming are scope decisions unless Lumo claims parity.
- I did **not** recommend a new upload/phone/date runtime dependency; the brief requires owner approval, and the defects above can first be fixed by honest typing, validation and composition.
- I did **not** treat physical block-axis utilities as RTL defects; the brief explicitly allows physical block-axis CSS.
- I did **not** claim test mutations were executed. The assignment was read-only. The table names mutations predicted to survive; it does not pretend they were applied/reverted.
- I did **not** run the 15-minute full verify. Targeted tests were proportionate for a read-only review and full verify cannot disprove the source-level contract failures documented here.

## Recommended sequence

1. Fix and regression-test NumberField error rendering/association; remove or implement `validate`.
2. Remove/implement NavigationMenu `onOpenChange`; replace the single OPEN_ITEM bridge with an honest root value API.
3. Repair PhoneInput country inference for controlled E.164 values.
4. Make owned ARIA props unrepresentable in Frame/IconStack/IconTile/MarkerIcon and add type/render tests.
5. Fix the three vacuous tests before using suite counts as evidence.
6. Resolve the standing-string-policy contradiction in FormState explicitly with the owner; either require validator messages or amend REVIEW-BRIEF §2 with a narrowly documented exception.
7. Remove inert legacy props across Popover/Menubar/RadioGroup/Menu or implement them; teach `gate:props` that underscore-destructuring is not delivery.
8. Clean stale migration prose, then address lower-risk parity gaps (Intl option types, NativeSelect styling, RangeCalendar error/today, pagination zero state).
