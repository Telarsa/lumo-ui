# Lumo UI adversarial review — consolidated result

Target: `1ab37905ec488ba84f7ca17ebf023d44690a7f51` (`experiment/base-ui`)  
Review date: 2026-08-12  
Disposition: report only; no product fix, dependency, commit, or push.

## Verdict

Lumo is unusually strong at Persian-first API design, first-byte naming, logical geometry, deterministic server output, and explaining hard tradeoffs. It is not an 8.25/10 library at this commit. The strongest counterevidence is not competitor feature count; it is that public contracts compile and silently fail while all advertised gates and all 2,464 tests pass.

The most serious proved defects are:

1. `NumberField.errorMessage` disappears entirely, and `validate` is inert.
2. `NavigationMenuItem.onOpenChange` is accepted and never called.
3. `DateField`, `Button`, `DisclosureTrigger`, `CheckboxGroup`, `Dialog`, `Tabs`, `Tree`, `Tooltip`, and other components retain substantial inherited or explicitly discarded no-op APIs that `gate:props` reports clean.
4. `gate:smoke` does not test an individual registry item's dependency metadata; it copies every item into one project and symlinks the UI package's complete dependency tree.
5. `PhoneInput` interprets a controlled `+49…` value as Iranian unless the caller separately supplies a matching country.
6. Table column resizing has been removed from the Tab order without an inner-grid keyboard route.
7. Fragment handling is wrong in IconStack, SegmentedControl, TagGroup, and ToggleGroup; at least one existing test falsely says it uses a Fragment.
8. Owned accessibility semantics can be overwritten in Frame, IconStack, IconTile, MarkerIcon, Separator, Skeleton, and Skeleton presets.
9. Tabs accepts function children/items that are not rendered and makes engine-required IDs optional.
10. Several tests and comments state properties that mutation or current source disproves.

## Complete 94-component review

The component-by-component evidence is split only to keep the documents navigable. Together these appendices cover every `registry:ui` component in registry order. Each component has a current official-doc comparison across shadcn/ui, ReUI, Radix, Ark UI, and Mantine; the relevant missing surface and its materiality; a Lumo strength; and `PROVED`/`SUSPECTED` local evidence.

| Components | Appendix |
|---|---|
| 01–31: AlertDialog through EventCalendar | [review-a.md](./review-a.md) |
| 32–62: FileUpload through RangeCalendar | [review-b.md](./review-b.md) |
| 63–94: Rating through VirtualList | [review-c.md](./review-c.md) |

The vendor catalogs were fetched on the review date rather than recalled: [shadcn components](https://ui.shadcn.com/docs/components), [ReUI docs](https://reui.io/docs), [Radix primitives](https://www.radix-ui.com/primitives/docs/components), [Ark UI](https://ark-ui.com/docs/overview/introduction), and [Mantine](https://mantine.dev/core/package/). Direct or adjacent official pages are linked in every appendix row.

“None” in those matrices means no direct component appeared in the current official catalog. A missing competitor feature is reported as a gap, not automatically as a Lumo defect.

## Blind rating, then diff against REVIEW-BRIEF §6

The brief requires reading itself in full before work, but also asks for a rating before reading §6. Those instructions cannot both be satisfied by one reader. An isolated reviewer therefore inspected the repository and locked the following scores before opening either `REVIEW-BRIEF.md` or `AUDIT.md`; its timestamped rationale is at `review/review-a.md:7-29`.

| Dimension | Blind | Brief's after score | Difference |
|---|---:|---:|---:|
| Accessibility / i18n / RTL | **8** | 9 | **−1** |
| Testing & tooling | **7** | 9 | **−2** |
| API design & DX | **7** | 8 | **−1** |
| Design system & docs | **7** | 7 | **0** |
| **Overall** | **7.0** | ≈8.25 | **−1.25** |

The comparison values are the brief's own table: `REVIEW-BRIEF.md:133-139` — “`Accessibility ... 9`”, “`Testing & tooling ... 9`”, “`API design & DX ... 8`”, “`Design system & docs ... 7`”, “`Overall ... ≈8.25`”. The completed review does not justify raising the blind score. Testing/tooling is the largest overrate because clean gates survive proved public-contract failures and a deliberately corrupted registry dependency declaration.

## Proved component defects

### P0 — accepted field error and validation behavior do nothing

`packages/ui/src/number-field.tsx:332-343` says the message is “`deliberately NOT handed to the wiring hook`” and “`the reason is a defect in this file`”. The component renders `<FieldError>{errorMessage}</FieldError>` at `:432-435`, but `packages/ui/src/form.tsx:627-640` returns `null` when no field chrome context exists. It also destructures `validate: _validate` at `number-field.tsx:322-324`.

**Runtime proof:** a temporary test rendered `errorMessage="خطای آزمون"` and asserted `screen.getByText("خطای آزمون")`. It failed: “Unable to find an element with the text”; the DOM had `data-invalid="true"` but no error node. The probe was deleted.

### P0 — NavigationMenu's accepted item callback is never called

`packages/ui/src/navigation-menu.tsx:269-277` documents that `onOpenChange` “`is accepted and NOT called`”; `:289-295` binds it as `_onOpenChange`. One root constant also cannot distinguish several items: `:195` defines `OPEN_ITEM`, while `:297-302` assigns the same value to every declared-open item.

**Runtime proof:** a temporary test clicked the item trigger and asserted `onOpenChange` was called with `true`. It failed with zero calls. The probe was deleted.

### P1 — controlled PhoneInput selects and displays the wrong country plan

`packages/ui/src/phone-input.tsx:210-218` initializes country solely from “`defaultCountry ?? fallback?.code ?? "IR"`”; `:219-226` then computes the national value with that selected dial. It does not infer a dial from `value`.

**Runtime proof:** rendering `value="+4915112345678"` without `defaultCountry` and asserting the country select was `DE` failed; received `IR`. This is controlled-state corruption, not just a missing convenience. The probe was deleted.

### P1 — inherited and explicitly discarded public props evade the source gate

The gate defines its own blind spot: `packages/gate/src/inert-props.ts:24-31` says it checks “`Only props a component file DECLARES ITSELF`” and that inherited core props “`are out of scope`”. Concrete proved false negatives include:

- DateField: `packages/ui/src/date-field.tsx:261-287` says it “`drops the rest on the floor`”, including form integration, bounds, focus, and “`every DOM/ARIA prop`”.
- Button: `packages/ui/src/button.tsx:127-137` marks eight callbacks “`accepted by the API, unreachable in Base UI`”.
- CheckboxGroup: `packages/ui/src/checkbox.tsx:288-324` says `isReadOnly` “`does not survive`” and discards required/validation/style props.
- Dialog: `packages/ui/src/dialog.tsx:325-332` discards dismissal, transition, outside interaction, portal, slot, and style props.
- Popover: `packages/ui/src/popover.tsx:478-526` has a large “`ACCEPTED BY THE API, UNREACHABLE IN BASE UI`” destructuring block.
- Tabs: `packages/ui/src/tabs.tsx:354-389` says function children are “`accepted by the type and never invoked`” and discards `items`.
- Tree: `packages/ui/src/tree.tsx:680-690` explicitly ignores dynamic collection inputs.

`gate:props` passed “124 component file(s) ... 0 inert-prop violation(s)” during the final verification. That output is accurate only for the gate's narrow syntactic scope; it is not evidence that the exported API has no inert props.

### P1 — Button silently resolves two accepted handlers by spread order

The shared public contract permits both `onPress` and `onClick` at `packages/core/src/props.ts:456-468`. Button maps `onPress` to `onClick` at `packages/ui/src/button.tsx:156-163`, then spreads `...rest` later at `:175`, so the native `onClick` replaces the translated `onPress` when both are present. AlertDialog independently records the same collision at `packages/ui/src/alert-dialog.tsx:101` — “`an onClick merged in from outside would REPLACE the onPress-derived one`”.

### P1 — Table achieves one Tab stop by making resize unreachable

The brief's open claim is stale: `REVIEW-BRIEF.md:214` says Column plus ColumnResizer serves two stops. Current `packages/ui/src/table.tsx:1521-1529` renders the resize button with `tabIndex={-1}`, and `packages/ui/src/table.test.tsx:696-719` asserts exactly one stop. But `table.tsx:1489` concedes “`the handle can no longer be reached with the Tab key`”. There is no grid inner-navigation/F2 route. The count is fixed; keyboard resizing is not.

### P1 — Fragment assumptions break overflow and served tab stops

`packages/ui/src/list-box.test.tsx:72-77` correctly records “`Children.toArray flattens arrays and NOT fragments`”. Four components contradict or ignore that fact:

- IconStack says it “`flattens fragments`” at `packages/ui/src/icon-stack.tsx:95-98` and slices the shallow result at `:99-100`.
- SegmentedControl uses shallow discovery at `packages/ui/src/segmented-control.tsx:242-250`.
- TagGroup falsely says it flattens Fragments at `packages/ui/src/tag-group.tsx:320-329`.
- ToggleGroup uses the same shallow path at `packages/ui/src/toggle-group.tsx:142-148`.

**Runtime proof:** `React.Children.toArray(<><i/><b/></>)` returned one Fragment. A temporary IconStack assertion expected an overflow count of `+۲` from Fragment-wrapped children; it failed with `+۱`. The probe was removed.

### P1 — callers can overwrite semantics the component claims to own

Frame inherits all div ARIA props at `packages/ui/src/frame.tsx:74-89`, sets `aria-label={label}`, then spreads props last at `:94-99`. The same defect appears in IconStack (`packages/ui/src/icon-stack.tsx:67-83`, `:103-109`), IconTile (`packages/ui/src/icon-tile.tsx:133-147`, `:166-170`), MarkerIcon (`packages/ui/src/marker.tsx:79-97`), Separator (`packages/ui/src/separator.tsx:75-109`), Skeleton (`packages/ui/src/skeleton.tsx:59-70`), and Skeleton presets (first occurrence `packages/ui/src/skeleton-presets.tsx:46-60`). A caller can replace a required label/role, create the unnamed image a comment says is impossible, or expose decorative skeletons.

The gate explicitly declines this class: `packages/gate/src/inert-props.ts:872-878` says it does not check “`Whether the omit LIST is right`”.

### P1 — Tabs exposes broken collection and identity contracts

`packages/ui/src/tabs.tsx:354-389` accepts but does not invoke function children and discards `items`. At `:443-451`, source says “`Base UI declares Tab.value REQUIRED`” while Lumo's `Tab.id` remains optional; `TabPanel` repeats the optional-to-required cast at `:493-530`. Root `isDisabled`, `keyboardActivation`, and `disabledKeys` are also accepted and discarded at `:291-309`.

### P1 — FormState contradicts the standing announced-string rule

`packages/ui/src/form-state.tsx:369-386` says application-copy messages have “`a sensible default`” and ships bilingual `MESSAGES`; `:535-537` makes `message` optional and falls back to that catalog. The standing rule is `REVIEW-BRIEF.md:31` — “`Every string a screen reader announces is a REQUIRED prop. No defaults`”. This is a proved policy contradiction. Whether the policy or API should change is an owner decision.

### Other proved material defects

- FileUpload applies `accept` only to the picker at `packages/ui/src/file-upload.tsx:205`; dropped/pasted files go directly to `deliver(...)` at `:241`, so disallowed types are accepted on those paths.
- InputOtp promises “`Fires once the last box is filled`” at `packages/ui/src/input-otp.tsx:173-180` but calls completion on every full-length change at `:230-235`.
- Menu accepts arbitrary link `target` at `packages/ui/src/menu.tsx:417-420` and forwards it without Link's required new-tab warning/safe-rel contract at `:551-560`.
- Menubar retains `orientation?: never` at `packages/ui/src/menubar.tsx:193-200`, the exact spread-breaking spelling rejected by `REVIEW-BRIEF.md:157`.
- Resizable accepts inverted bounds; `packages/ui/src/resizable.tsx:109-111` clamps without validating them and emits caller min/max as ARIA range values at `:219-222`.
- Steps documents `current` as 1-based at `packages/ui/src/steps.tsx:201-207` but does not clamp/reject invalid values at `:244-254`.
- Toast has no action in its payload at `packages/ui/src/toast.tsx:122-127` or renderer at `:316-387`, and its required region locale is documented “`NOW INERT`” at `:391-402`.
- ToggleGroup stringifies numeric keys and returns strings at `packages/ui/src/toggle-group.tsx:107-116`, violating a lossless `Key` round trip.
- VirtualList explicitly owns the ref and says the needed scroll method “`does not have yet`” at `packages/ui/src/virtual-list.tsx:117-126`.

The appendices contain the lower-severity findings and all suspected items; they are not repeated here.

## Tooling and audit findings

### PROVED — `gate:smoke` is vacuous for per-item dependency metadata

`scripts/smoke-consumer.mjs:42-46` copies the files from **every** registry item into one shared temporary project. `:59` symlinks all of `packages/ui/node_modules`. The script never reads an item's `dependencies` or `registryDependencies`, yet `:104` claims “`every registry item type-checks outside the workspace`”.

**Mutation:** removing Attachment's entire `registryDependencies` array (`button`, `file-upload`, `progress`) still produced exit 0 and “124 item(s) copied ... every registry item type-checks”. The exact original `registry.json` hash was restored. The gate can find a companion source file absent from the union, but cannot prove that installing one item brings its own sibling or external dependencies.

### PROVED — two additional carrier false negatives in `gate:props`

`packages/gate/src/inert-props.ts:817-820` treats any type containing `never` and any optional single literal as an unrepresentable carrier. Synthetic `gradeSource` probes returned zero violations for dropped `boolean | never`, `string | never`, `true | undefined`, `false | undefined`, `"compact" | undefined`, and `5 | undefined`; only `boolean | undefined` was flagged.

This generalization is unsound: TypeScript reduces `boolean | never` to `boolean`, and an optional single literal can request behavior rather than merely document an invariant. The comment at `:803-815` gives one valid SegmentedControl example, but the implementation exempts every such type regardless of semantics.

### PROVED — AUDIT's staged-registry claim is wrong

`AUDIT.md:220` claims `gate:registry` compares worktree to index “`so staged drift passes`”. The script is `package.json:24` — “`node scripts/build-registry.mjs && git diff --exit-code registry.json`”; the generator derives sibling/external dependencies from imports (`scripts/build-registry.mjs:10-18`) before diffing.

**Mutation:** Attachment's registry dependency list was corrupted and staged. `pnpm run gate:registry` regenerated the canonical list, then exited 1 with a diff adding the dependencies back. The index and worktree were restored byte-for-byte. This is the fifth plain wrong audit claim requested by the brief.

### PROVED — documentation and review state are stale

- The brief identifies handoff HEAD `f249d70` at `REVIEW-BRIEF.md:21`; the requested target is `1ab3790`.
- README still says “`Behaviour | React Aria Components`” at `README.md:17`, while current components import Base UI (for example `packages/ui/src/alert-dialog.tsx:5`).
- README says “`68 components`” and “`604 tests`” at `README.md:31-38`; the registry has 94 UI items and this verify ran 2,464 tests.
- `packages/ui/src/message.tsx:35-63` says MessageScroller is “`NOT BUILT`” and “`it is not here`”; `packages/ui/src/message-scroller.tsx:128` exports it and it has a dedicated test file.
- Rating says LumoProvider “`does not mount`” direction at `packages/ui/src/rating.tsx:68-74`; Provider mounts `DirectionProvider` at `packages/ui/src/provider.tsx:104-108`.
- Toggle calls `excludeFromTabOrder` “`UNREACHABLE`” at `packages/ui/src/toggle.tsx:146-152`, but translates it to `tabIndex` at `:226-229`.

These comments are not harmless history: they are written in present tense beside implementation decisions and were used as audit evidence.

## Existing audit fixes proved by reversion

No new product fix was made. Five existing audit fixes were temporarily reverted one at a time, the named regression was run, and the exact original file hash was restored before the next experiment.

| Existing fix reverted | Failing assertion named by the suite | Result |
|---|---|---|
| Remove the floors argument from `gate:html` (`package.json:23`) | `packages/gate/src/gate.test.ts:937-946` — “`gate:html passes a floors file`” | **Failed**, because the CLI had no floors argument. |
| Replace extended `cn()` with bare `twMerge` | `packages/core/src/cn.test.ts:68-75` — “`resolves a conflict the same way it resolves a Tailwind one`”; `:83-87` — “`consumer's plain height`”; `:89-108` — “`knows exactly the control sizes`” | **3 failed**. |
| Make DataGrid `pageSizes` and `pageSizeLabel` independently optional | `packages/ui/src/data-grid.test.tsx:287-300` — “`offering sizes without naming ... does not compile`” and converse | **Typecheck failed** with unused `@ts-expect-error` at lines 289 and 297. |
| Remove Calendar's within-month day-bound matchers | `packages/ui/src/dates.test.tsx:1049-1074` — “`a day BEFORE minValue ... is disabled`” | **Failed**: expected `disabled=true`, received false. |
| Restore Select's `child.type === SelectItem` identity check | `packages/ui/src/select.test.tsx:175-202` — “`resolves an item whose element type is not this module's function`” and “`does not mistake a SelectGroup for an item`” | **2 failed**: raw keys rendered instead of تهران/کرج. |

This table supports those five fixes only. A passing reversion test does not rescue unrelated audit claims or prove broader parity.

## Vacuous-test mutations

| Test claim | Mutation/probe | Observation | Verdict |
|---|---|---|---|
| MessageScroller “floats ... on the LOGICAL end” (`packages/ui/src/message-scroller.test.tsx:52-57`) | Changed `end-4` to `right-4` at `message-scroller.tsx:97-100` | Named test still passed because the initially pinned SSR render contains no jump button. | **PROVED vacuous** |
| IconStack “fragments and nulls behave” (`packages/ui/src/icon-tile.test.tsx:99-108`) | Supplied a real Fragment and asserted the correct overflow | Failed (`+۱` instead of `+۲`); existing test uses an array, not a Fragment. | **PROVED false/misnamed** |
| NumberField invalid-state tests | Added an assertion that accepted error text exists | Failed; current tests observe invalid styling but not the authored message. | **PROVED coverage hole** |
| NavigationMenu interaction tests | Added an item callback and clicked the trigger | Failed with zero calls; existing fixture never supplies the callback. | **PROVED coverage hole** |
| PhoneInput controlled-state tests | Supplied a non-Iranian controlled E.164 value without a duplicate country prop | Failed, selected `IR`; existing controlled fixture is Iranian and matches the fallback. | **PROVED coverage hole** |

InputOtp's test at `packages/ui/src/input-otp.test.tsx:121-130` performs one incomplete and one complete change but never edits an already-complete value. Given the implementation at `input-otp.tsx:230-235`, the “fires once” claim is **proved untested** by inspection; no separate product mutation was necessary.

All mutation probes were removed or restored exactly. Immediately before report handoff, tracked source had no review-authored diff.

## Suspected findings requiring browser/AT or product evidence

- HoverCard combines hover-preview behavior with `role="dialog"` at `packages/ui/src/hover-card.tsx:275-283`. VoiceOver/NVDA behavior should be measured before calling this hybrid either superior or defective.
- FileUpload's disabled drop branch returns before `preventDefault` at `packages/ui/src/file-upload.tsx:237-240`; browser testing should establish whether dropping there navigates the document.
- InputOtp admits the visual caret does not follow arbitrary cursor movement at `packages/ui/src/input-otp.tsx:224-226`; confirm with real mobile selection behavior.
- ListBox casts any valid non-Fragment element to an item at `packages/ui/src/list-box.tsx:234-243`; a wrapped/non-item child needs a focused runtime probe.
- Stack permits multiple root tags through a div-typed prop bag (`packages/ui/src/stack.tsx:309-321` is representative); a type matrix should prove which element-specific props are lost or invalid.

These remain `SUSPECTED`; the report does not inflate them into proved release blockers.

## Declined findings and actions

- **Missing competitor breadth is not automatically a defect.** Gantt critical paths, full event-calendar recurrence/resources, upload state machines, rich splitter layouts, custom scrollbars, visual loader variants, and virtualized trees matter only when Lumo claims those product scopes. The appendices label them gaps and explain when they matter.
- **No new runtime dependency.** Nothing found requires one as a first response; honest types, correct wiring, validation, and tests can close the top defects. The brief also requires owner approval.
- **No component fixes.** The request is a review and asks the owner to sequence changes. Fixing dozens of APIs while reviewing would erase the before-state and make the evidence harder to audit.
- **No paid services, publishing, upstream issues, commits, or pushes.** None was necessary or authorized.
- **No physical block-axis complaint.** The project explicitly permits physical block-axis utilities; only inline-axis direction errors were considered RTL defects.
- **No claim of screen-reader or visual correctness.** This run did not perform Persian VoiceOver/NVDA, CDP accessibility-tree, or visual direction-flip testing. Those remain open in `ROADMAP.md:199-203`.

## Final verification and workspace integrity

`pnpm run verify` exited 0 after all mutations were restored:

- types, source props/root contract, ESLint, and CSS-module gate passed;
- 2,464 tests passed (30 core, 427 theme, 134 gate, 10 config, 13 SSR, 1,612 UI, 160 blocks, 78 website);
- registry generation and consumer smoke passed;
- Next generated 523 static pages;
- the HTML gate graded 524 documents with zero violations.

The gate's own output limits the meaning of the last number: among 264 non-Latin-locale documents, 77.5% of text nodes and 77.2% of characters were exempt via `data-lumo-latn`, and the Persian digit floor was armed on 12 of 264 routes. That scope is honestly printed; it is not full-site proof.

During verification, HEAD unexpectedly moved to a local commit that swept `AUDIT.md` and the first two review appendices together. The branch was returned non-destructively to exact `1ab3790`; all files were preserved as unstaged/untracked work and the commit remains recoverable through reflog. The concurrent two-line `AUDIT.md` edit was not authored or discarded by this review. Final handoff has no new commit and nothing was pushed.

## Recommended order

1. Fix NumberField error rendering/IDREF association and remove or implement `validate`.
2. Replace NavigationMenu's per-item fiction with an honest root value/callback model.
3. Repair PhoneInput controlled-country inference.
4. Expand `gate:props` to inherited types and distinguish delivery from underscore-discard; remove the carrier exemptions that are not type-unrepresentable.
5. Make `gate:smoke` install/typecheck each registry item from its own declared dependency closure.
6. Repair the vacuous tests before relying on suite totals.
7. Fix Tabs/Tree collection contracts and the Fragment traversal family.
8. Implement keyboard-operable Table resizing rather than counting it away.
9. Own semantic ARIA props at the type boundary across all affected roots.
10. Resolve the FormState string-policy contradiction, then clean stale audit/source narratives.
