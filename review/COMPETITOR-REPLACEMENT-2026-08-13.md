# Lumo UI competitor and replacement-readiness review

Date: 2026-08-13

Branch: `experiment/base-ui`

Reviewed HEAD: `41fd2ea71efddcb16aba29c8fa23aa0700764d8e`

## Verdict

Lumo is already a credible replacement for the **ordinary React application
surface** of shadcn/ui, ReUI, Radix UI, Ark UI and Mantine when the consuming
team values Persian/Jalali support, RTL, deterministic server output and
enforced accessible names more than a huge recipe ecosystem. It is not yet a
credible wholesale replacement for any competitor's entire platform.

The distinction matters:

- **PROVED:** Lumo currently has 98 generated `registry:ui` items, 30 blocks and
  99 public component pages. The manifest command
  `node -e "const r=require('./registry.json'); ..."` reports
  `128 { registry:ui: 98, registry:block: 30 }`; the browser/AT pass records 98
  implementation modules and 99 routes at
  `review/AT-VISUAL-MUTATION-2026-08-13.md:34-58`.
- **PROVED:** the strongest differentiator is a real engineering constraint,
  not marketing copy. `REVIEW-BRIEF.md:59-67` says bare numeric children are a
  type error, direction is derived from locale, logical CSS is enforced, and
  correctness is measured in the first server byte. `REVIEW-BRIEF.md:101-125`
  lists the source, registry, consumer-compilation and built-HTML gates.
- **PROVED:** replaceability is currently blocked by distribution. Lumo's own
  installation page says: “Lumo is private … it is not published to npm and
  serves no public registry”
  (`apps/website/src/app/[lang]/docs/installation/page.tsx:154-161`). An outside
  team cannot adopt what it cannot retrieve, version, update and support.
- **INFERRED from current official catalogs:** Lumo is broader than Radix as an
  application component set and deeper than shadcn in scheduling/planning, but
  materially narrower than ReUI's enterprise engines, Ark's specialist
  state-machine primitives, Mantine's components/hooks/extensions, and
  Astryx's internal-tool and AI/editor families.

This report distinguishes three things that are often incorrectly counted as
one:

1. **Primitive:** an unstyled interaction/state machine (Radix/Ark territory).
2. **Recipe:** styled source or an example assembled from primitives
   (shadcn/ReUI territory).
3. **Product component:** a coherent domain model such as Gantt, event
   scheduling, query building or upload lifecycle (ReUI/Astryx and parts of
   Lumo).

Matching a recipe name does not prove primitive API compatibility; matching a
primitive does not replace an application workflow.

## Current official comparison set

Only first-party/current pages were used for competitor facts:

- [shadcn/ui introduction](https://ui.shadcn.com/docs),
  [component catalog](https://ui.shadcn.com/docs/components),
  [registry schema](https://ui.shadcn.com/docs/registry/registry-json),
  [MCP server](https://ui.shadcn.com/docs/mcp),
  [blocks](https://ui.shadcn.com/blocks), and
  [RTL support](https://ui.shadcn.com/docs/changelog/2026-01-rtl).
- [ReUI introduction](https://reui.io/docs),
  [Data Grid](https://reui.io/docs/components/radix/data-grid),
  [Filters](https://reui.io/docs/components/radix/filters),
  [Tree](https://reui.io/docs/components/radix/tree),
  [Gantt](https://reui.io/docs/components/radix/gantt),
  [Event Calendar](https://reui.io/docs/components/radix/event-calendar), and
  [File Upload](https://reui.io/docs/components/radix/file-upload).
- [Radix Primitives introduction](https://www.radix-ui.com/primitives/docs/overview/introduction)
  and [component catalog](https://www.radix-ui.com/primitives/docs/components).
- [Ark UI home](https://ark-ui.com/),
  [about](https://ark-ui.com/docs/overview/about),
  [component state](https://ark-ui.com/docs/guides/component-state),
  [composition](https://ark-ui.com/docs/guides/composition),
  [File Upload](https://ark-ui.com/docs/components/file-upload),
  [Color Picker](https://ark-ui.com/docs/components/color-picker),
  [circular Progress](https://ark-ui.com/docs/components/progress-circular),
  [Tree View](https://ark-ui.com/docs/components/tree-view), and
  [AI documentation](https://ark-ui.com/docs/ai/llms.txt).
- [Mantine home](https://mantine.dev/),
  [core catalog](https://mantine.dev/core/package/),
  [dates](https://mantine.dev/dates/getting-started/),
  [charts](https://mantine.dev/charts/getting-started/), and
  [useForm](https://mantine.dev/form/use-form/). These pages identify the
  current documentation as v9.5.1.
- [Meta Astryx home](https://facebook.github.io/astryx/),
  [sandbox catalog](https://facebook.github.io/astryx/sandbox/), and
  [official releases](https://github.com/facebook/astryx/releases).

The prior 94-component matrix at
`review/PARITY-PASS-2026-08-13.md` was used to route checks, not as authority
for current competitor claims. Later Lumo additions (Filters, Questionnaire,
OverflowList and TransferList) are accounted for here.

## Comparison by capability

| Capability | Lumo relative position | Evidence and consequence |
| --- | --- | --- |
| Persian, Jalali and RTL | **Lumo lead — PROVED locally.** | Locale determines direction and first-byte keyboard geometry; announced strings are required rather than default English (`REVIEW-BRIEF.md:25-32,59-67`). Calendar/Gantt tests use Persian calendar arithmetic, and the real VoiceOver session heard Persian Calendar and Table output (`review/AT-VISUAL-MUTATION-2026-08-13.md:91-100`). [Shadcn RTL](https://ui.shadcn.com/docs/changelog/2026-01-rtl) now converts physical classes at install time; that is helpful tooling, not Lumo's type/locale invariant. [ReUI Gantt](https://reui.io/docs/components/radix/gantt) accepts locale/i18n/RTL, but its own example documents English as the built-in default. |
| Server-rendered semantics | **Lumo lead — PROVED locally.** | Lumo grades static-export bytes for `lang/dir`, names, IDREFs, digit script and composite tab stops (`REVIEW-BRIEF.md:101-109`). All 198 English/Persian component renders were checked (`review/AT-VISUAL-MUTATION-2026-08-13.md:34-58`). No competitor's current catalog documents an equivalent served-byte gate across its whole site. That last sentence is an **inference from reviewed documentation**, not proof that no internal test exists. |
| Common styled React UI | **Broadly equivalent.** | Lumo covers fields, selection controls, overlays, navigation, feedback, layout and data display across 98 modules. Shadcn's official list covers the same ordinary application spine, ReUI supplies both Base UI and Radix variants, and Mantine supplies ready-styled components. Migration cost is mainly API and theme translation, not missing categories. |
| Headless primitive flexibility | **Lumo worse for primitive consumers.** | [Radix](https://www.radix-ui.com/primitives/docs/overview/introduction) explicitly ships low-level, unstyled, granular parts with controlled/uncontrolled behavior. [Ark composition](https://ark-ui.com/docs/guides/composition) and [state](https://ark-ui.com/docs/guides/component-state) expose `asChild`, part/state data attributes, context hooks, `useComponent` and `RootProvider`. Lumo intentionally presents narrower styled APIs over Base UI. This reduces misuse but cannot replace code that depends on Radix/Ark part-level composition without adapters or rewrites. |
| Open-code distribution | **Equivalent architecture, worse availability.** | Lumo has a shadcn-compatible generated registry and consumer-compiles every payload; its install page says components copy into the consumer (`apps/website/src/app/[lang]/docs/installation/page.tsx:199-208`). Shadcn and ReUI publicly serve their registries and CLI workflow. Lumo serves no public endpoint, so only its owning organisation gets the benefit today. |
| Forms | **Strong fields; weaker form platform.** | Lumo has native form seams, FormState, Filters and Questionnaire with required localized errors. [Mantine `useForm`](https://mantine.dev/form/use-form/) includes nested/list values, reorder operations, async validation, status and context. [Shadcn Field](https://ui.shadcn.com/docs/components/base/field) documents multiple form engines. Lumo needs a first-party schema/async/list recipe or a documented supported integration matrix to replace those workflows. |
| Static and remote collections | **Strong semantics; uneven integration.** | `ListBox` exposes loading/error/load-more outside selectable options and `VirtualList` exposes true corpus positions (`review/DEPTH-ASTRYX-FINAL-2026-08-13.md:72-92`). Ark/ReUI provide more consistent grouped, creatable, multi-select, virtual and async modes across Combobox, Select, Listbox and Tree. The gap matters because teams otherwise invent a different loader/store contract for each Lumo picker. |
| Dates and calendars | **Lumo leads for Jalali; competitors lead workflow breadth.** | Lumo uses calendar-system-safe values and deterministic `today`; EventCalendar now has month/week/day/N-day/agenda behavior but still lacks resources, recurrence, zones and edit gestures (`review/DEPTH-ASTRYX-FINAL-2026-08-13.md:94-111,190-201`). [ReUI Event Calendar](https://reui.io/docs/components/radix/event-calendar) documents month/week/day/N-day/agenda/resource, RFC-5545 recurrence, IANA zones and external create/update contracts. [Mantine dates/schedule](https://mantine.dev/dates/getting-started/) lists date/time/month/year inputs and resource/recurring schedule views. |
| Gantt/project planning | **Useful Lumo product; ReUI still deeper.** | Lumo proves day/week/month/quarter/year, hierarchy and keyboard/pointer edge resize (`review/DEPTH-ASTRYX-FINAL-2026-08-13.md:14-38`). [ReUI Gantt](https://reui.io/docs/components/radix/gantt) exposes zoom, summary behavior, tree/timeline settings, IANA zones and external scheduling. Lumo still lacks dependencies/critical path/baselines/summary rollups/continuous zoom/resizable split pane (`review/DEPTH-ASTRYX-FINAL-2026-08-13.md:190-195`). |
| Data grid/table | **Lumo semantics lead; enterprise feature breadth trails.** | Lumo owns localized grid/selection/sort/resize semantics and now has real VoiceOver value speech. [ReUI Data Grid](https://reui.io/docs/components/radix/data-grid) ships sorting/filtering/pagination, footer rows, drag-and-drop, virtualization, infinite scroll, row pinning and tree rows; the [Astryx table lab](https://facebook.github.io/astryx/sandbox/pages/table-lab/) exercises plugin combinations on large datasets. A team using those capabilities cannot migrate on component name alone. |
| Upload | **Lifecycle parity for many apps; specialist acquisition/transport gaps.** | Lumo proves picker/drop/paste validation, queued/uploading/success/error, progress and retry while leaving transport caller-owned (`review/DEPTH-ASTRYX-FINAL-2026-08-13.md:46-70`). [Ark File Upload](https://ark-ui.com/docs/components/file-upload) additionally documents directory upload, camera capture, transforms, duplicate rejection and document-drop prevention. [ReUI File Upload](https://reui.io/docs/components/radix/file-upload) publishes sortable image/gallery/table/avatar recipes. Chunking, pause/resume and a real transport adapter remain absent. |
| Charts | **Lumo accessibility model better; breadth much worse.** | Lumo can pair a visual chart with an SSR semantic table and localized values (documented in the 94-component matrix). [Mantine Charts](https://mantine.dev/charts/getting-started/) currently lists 18 named chart families, including funnel, radar, heatmap, treemap, sunburst and Sankey, and enables keyboard point navigation on Recharts-based charts. Astryx adds specialist internal-tool visualizations. Lumo's generic chart marks do not replace those ready-made families. |
| Responsive application shell | **Lumo composable but less turnkey.** | Lumo has Sidebar, NavigationMenu, Menubar, Drawer, Resizable and Stack. Shadcn Sidebar and Mantine AppShell own more breakpoint, mobile-overlay, persistence, rail/inset and coordinated-shell behavior. Astryx's sandbox supplies realistic app-shell, IDE, messaging and incident-console templates. |
| Toast/notification system | **Lumo primitive is sound; system layer is thinner.** | Lumo requires region/close/action names and does not force a timeout. Radix/Ark/Mantine and shadcn/Sonner offer queue/store APIs, update/promise flows, placements and gestures. Ark's current changelog includes priority queuing; Mantine documents a separate notification system. |
| Specialist inputs/utilities | **Lumo materially narrower.** | Ark and Mantine officially ship color/angle/range controls; Ark additionally ships state machines such as Signature Pad, QR Code, Tour and Floating Panel; Mantine lists ColorInput, JsonInput, MaskInput, MultiSelect, Cascader, TreeSelect, RingProgress and FloatingWindow. Lumo should not claim parity by composing a TextField around these missing state models. |
| Chat, editors and internal tools | **Lumo has conversation display; Astryx leads decisively.** | Lumo has Attachment, Bubble, Marker, Message and MessageScroller. Astryx's current releases and sandbox show ChatComposer/Dictation/Tool Calls, citations/markdown/code, messaging shells, IDE/page-editor/file-explorer templates, PowerSearch, LogStream and table plugins. The locally verified gap list is recorded at `review/DEPTH-ASTRYX-FINAL-2026-08-13.md:202-204`. |
| Multi-framework and native | **Outside Lumo's replacement envelope.** | [Ark](https://ark-ui.com/docs/overview/about) supports React, Solid, Vue and Svelte with one state-machine layer. [Shadcn's registry](https://ui.shadcn.com/docs/registry) is framework-neutral. Lumo intentionally targets React web (`DECISIONS.md §19`), so this is a boundary rather than a backlog item. It should not claim to replace Ark in a mixed-framework organisation or any native library. |
| Hooks/utilities ecosystem | **Mantine lead.** | [Mantine's current homepage](https://mantine.dev/) advertises 120+ components and 70+ hooks. Lumo deliberately focuses on components/contracts and does not expose a comparable general hooks package. A Mantine migration must inventory hook imports separately; replacing only JSX leaves a large hidden dependency. |
| Examples, themes and AI tooling | **Competitors lead adoption velocity.** | Lumo has bilingual examples, generated API and 30 verified blocks. Shadcn has public free blocks, presets, registry APIs and an MCP server; ReUI has a large free example catalog plus agent tooling (paid blocks/templates are not counted as free parity); Ark and Mantine publish `llms.txt`/agent integrations; Astryx has Storybook, a sandbox and theme tools. Lumo's internal docs are strong but not yet an equivalent public adoption system. |

## What Lumo does better

The following are **proved advantages**, not merely design preferences:

1. **Wrong direction is made unrepresentable.** `LumoHtml` and `LumoProvider`
   derive direction from a required locale; callers cannot pass an independent
   contradictory `dir` (`REVIEW-BRIEF.md:61-67` and
   `apps/website/src/app/[lang]/docs/installation/page.tsx:187-196`).
2. **English accessibility copy cannot silently leak through Lumo's public
   contract.** Every announced string is required (`REVIEW-BRIEF.md:25-32`).
   ReUI supports localization, but its current Gantt documentation explicitly
   describes English as the built-in default; Ark's progress API currently
   documents `locale: 'en-US'` as the default.
3. **First-byte behavior is graded.** This catches failures that browser-only
   hydration tests miss: wrong script digits, missing names, unresolved IDREFs
   and impossible composite focus (`REVIEW-BRIEF.md:101-109`).
4. **Copied registry payloads are tested as copies.** The final AT pass reports
   all 128 payloads compiling outside the workspace
   (`review/AT-VISUAL-MUTATION-2026-08-13.md:220-228`). This is stronger than
   merely compiling the monorepo.
5. **Jalali is behavior, not translation.** Gantt quarter/year lengths, event
   calendar stepping, day geometry, Persian digits and RTL pointer signs have
   named tests and mutation evidence (`review/DEPTH-ASTRYX-FINAL-2026-08-13.md:14-44,94-111`).
6. **Lumo owns several product components absent from pure primitive sets.**
   Gantt, EventCalendar, Kanban, Filters, Questionnaire, TransferList,
   OverflowList and VirtualList reduce substantially more application code than
   installing Radix primitives alone.
7. **The APIs intentionally prevent semantic override.** The prop/root gates
   reject inert declared behavior and caller replacement of component-owned
   semantics (`REVIEW-BRIEF.md:113-117`). Narrowness is an advantage when the
   alternative is an accepted prop that does nothing.
8. **Accessibility evidence is honest about its boundary.** The real VoiceOver
   pass found and fixed VirtualList count and Table value-announcement defects,
   then explicitly declined claims for incomplete Toast/FileUpload speech
   (`review/AT-VISUAL-MUTATION-2026-08-13.md:80-147,195-208`).

## What Lumo does not do better

These are **proved product or delivery gaps**, not defects in currently promised
behavior:

1. **No public delivery or release channel.** This is the single hard blocker
   to replacing a public competitor outside Telarsa.
2. **No drop-in primitive compatibility.** Radix and Ark consumers commonly
   style or compose individual parts. Lumo's higher-level API requires a
   migration, not an import rename.
3. **React web is the declared support envelope.** Multi-framework and native
   parity are explicit non-goals, not unfinished replacement work
   (`DECISIONS.md §19`).
4. **Enterprise engines remain incomplete:** dependency-aware Gantt,
   resource/recurring/zoned scheduler, advanced grid, integrated remote/virtual
   pickers and resumable upload transport.
5. **Missing specialist categories:** color and angle pickers, multi-thumb range,
   mask/JSON/cascader/tree-select inputs, QR/signature/tour/floating-window,
   ready-made advanced charts, rich text/Markdown/code editors, lightbox and
   log stream.
6. **Smaller operational ecosystem:** no public changelog/release cadence,
   semver compatibility policy, migration/codemod catalog, browser support
   policy, hosted theme generator, MCP/skill endpoint, public issue/support
   workflow or community registry. The local changelog is deliberately “with no
   version numbers because nothing has been released”
   (`apps/website/src/app/[lang]/docs/changelog/page.tsx:5-14`).
7. **Fewer recipes and application templates.** Lumo's 30 blocks are tested and
   useful, but shadcn, ReUI and Astryx materially reduce assembly time across
   dashboards, authentication, commerce, app shells, IDEs and AI interfaces.
8. **Incomplete platform AT evidence.** VoiceOver/Chromium is proved and a
   five-component Android TalkBack/WebView 124 session is recorded at
   `review/ANDROID-TALKBACK-AND-REPLACEMENT-2026-08-13.md`. NVDA and JAWS were
   explicitly deferred, and current Chrome/TalkBack plus VirtualList corpus
   speech remain unproved.

## Replacement checklist by competitor

### Replacing shadcn/ui

**Readiness: high for common React UI; medium for the whole ecosystem.**

- [ ] Inventory every installed shadcn registry item and map it to a Lumo item;
      distinguish a primitive from a block/example.
- [ ] Convert `children` containing bare numbers to `formatNumber(...)` or an
      explicit localized string; Lumo's `LumoNode` rejects numeric children.
- [ ] Install `@lumo-ui/core` and `@lumo-ui/theme`, wire CSS in the documented
      order, and mount required `LumoHtml`/`LumoProvider` with the application
      locale.
- [ ] Translate physical layout assumptions and independent `dir` props into
      Lumo's locale/logical model.
- [ ] Replace bundled/default labels with the product's message catalog; every
      announced Lumo string is required.
- [ ] Rebuild any unmatched shadcn block using Lumo primitives or add a tested
      Lumo block. Do not call a primitive gap when the difference is only a
      recipe.
- [ ] Provide a reachable private/public registry endpoint and namespace so the
      normal `shadcn add @lumo/...` workflow actually works outside this repo.
- [ ] Before claiming replacement, publish an import/API migration guide,
      codemod for common names, update/diff policy, theme mapping and a minimum
      block set for auth/dashboard/sidebar/forms.

### Replacing ReUI

**Readiness: high for primitives/common recipes; low-to-medium for enterprise
product components.**

- [ ] Map whether each dependency is a ReUI-authored component, a gallery
      recipe, a block or a paid template. Do not promise free parity for paid
      assets.
- [ ] For Gantt, explicitly decide whether dependencies, baselines, rollups,
      continuous zoom, external CRUD and split-pane behavior are required.
- [ ] For Event Calendar, inventory resources, recurrence, IANA zones, working
      hours/snap, create/move/resize and activation callbacks.
- [ ] For Data Grid/Table, inventory pinning, grouping/tree rows, editing,
      virtualization, infinite loading, footers and column DnD.
- [ ] For uploads, inventory directory/camera/transform, sortable gallery/table,
      transport, retry and resumability.
- [ ] Port ReUI's built-in/default English labels into required application
      messages and verify both English/LTR and Persian/RTL first bytes.
- [ ] Add first-party Lumo recipes for the retained ReUI workflows; requiring
      every team to reassemble them is not replacement.
- [ ] Match ReUI's searchable public docs/agent workflow with a hosted registry,
      current API data and machine-readable examples.

### Replacing Radix UI

**Readiness: medium, because the abstraction level is different.**

- [ ] Inventory every Radix `Root`/`Trigger`/`Content`/`Portal`/`Anchor`/`Item`
      usage and every `asChild`/controlled-state dependency.
- [ ] Decide which callers can adopt Lumo's closed, styled composition and which
      genuinely need low-level parts.
- [ ] Add migration adapters for common controlled/open/value callbacks rather
      than pretending import-name parity.
- [ ] Close real primitive gaps: password visibility, richer
      portal/container/collision/focus lifecycle, delay groups and multi-thumb
      Slider. Map Radix Accordion to Lumo's existing `DisclosureGroup`; do not
      add a duplicate category.
- [ ] Document the escape-hatch policy: root `className` is supported, but
      component-owned roles/IDREFs/direction remain authoritative.
- [ ] Prove nested overlays, shadow-root/container use and focus restoration in
      the supported browser/AT matrix.

### Replacing Ark UI

**Readiness: medium for React application teams; not ready for mixed-framework
organisations.**

- [ ] Restrict the replacement claim to React or build equivalent Solid, Vue
      and Svelte adapters. Today, this is a hard scope boundary.
- [ ] Inventory use of Ark context hooks, `useComponent`, `RootProvider`,
      `asChild`, `ids`, `data-scope` and `data-part`; Lumo has no universal
      one-for-one substitute.
- [ ] Close specialist state-machine gaps where consumers use them: ColorPicker,
      AngleSlider, SignaturePad, QRCode, Tour, FloatingPanel, Editable,
      Clipboard and directory/camera upload.
- [ ] Unify async/grouped/virtual collection behavior across Combobox, Select,
      ListBox and Tree rather than solving only one picker.
- [ ] Add multi-thumb/range Slider and editable TagsInput if those Ark contracts
      are in use.
- [ ] Provide machine-readable full API/docs at least equivalent to Ark's
      framework-specific `llms*.txt` routes.

### Replacing Mantine

**Readiness: medium for a curated application subset; low for Mantine as a
platform.**

- [ ] Inventory imports from every `@mantine/*` package, not just
      `@mantine/core`: hooks, form, dates, charts, notifications, carousel,
      dropzone, modals, spotlight and rich-text editor are separate migration
      projects.
- [ ] Map Mantine Styles API/theme tokens/responsive props to Lumo tokens and
      Tailwind classes; provide a documented theme-conversion recipe.
- [ ] Either implement or explicitly exclude Mantine-only input categories:
      ColorInput/Picker, MaskInput, JsonInput, Cascader, MultiSelect, TagsInput,
      TreeSelect and RangeSlider.
- [ ] Provide a supported form integration with nested/list values, async
      validation, dirty/touched/status and schema adapters.
- [ ] Provide named chart recipes for the families the product actually uses;
      a generic mark layer is not a migration for Sankey/treemap/heatmap/radar.
- [ ] Replace AppShell/responsive helpers and audit all Mantine hook imports.
      Lumo needs either equivalent hooks or explicit recommendations with tested
      adapters.
- [ ] Supply notification manager, modals manager and spotlight/command recipes
      if the application uses those global systems.

### Replacing Meta Astryx

**Readiness: medium for ordinary internal-tool chrome; low for specialist AI,
editor and visualization surfaces.**

- [ ] Map generic names by behavior, not spelling. Lumo Stack already supplies
      Grid/Container; Drawer covers the bottom-sheet category; Menu covers
      more-menu/dropdown-menu. Thin aliases are not replacement value.
- [ ] Preserve the two genuine catalog additions already made from the Astryx
      review: OverflowList and TransferList, including their measured/controlled
      semantics (`review/DEPTH-ASTRYX-FINAL-2026-08-13.md:113-141`).
- [ ] Build a coherent Chat product family before claiming AI-interface parity:
      composer/drawer, dictation, streaming scroll, citations, tool-call
      disclosure, code/Markdown rendering and error states.
- [ ] Add PowerSearch/query-builder integration with DataGrid, not merely a
      SearchField beside a table.
- [ ] Decide security and runtime policies before adding Markdown, rich-text or
      code editors (sanitization, plugins, highlighting, bundle size and CSP).
- [ ] Add LogStream, Lightbox/Tour and only the advanced chart families demanded
      by actual products.
- [ ] Match Astryx's adoption layer with an internal-tool sandbox, table
      performance lab, theme editor and full application templates such as IDE,
      incident console, messaging shell and file explorer.

## Minimum product to make “replace them” an honest claim

The fastest route is not to copy every competitor. It is to declare and ship a
replacement envelope.

### Tier 0 — required for any external or cross-team adoption

- [ ] Choose **internal supported product** or **public product**. For either,
      host an authenticated or public shadcn-compatible registry; for public
      use, publish the contract packages or provide a stable supported fetch
      mechanism.
- [ ] Establish semver, changelog, deprecation window, security reporting,
      support policy, browser matrix and release artifacts.
- [ ] Publish installation, upgrades/diffs, migrations, theming, CSP/SSR/RSC,
      locale/message-catalog and troubleshooting guides.
- [x] Remove stale public counts in README/CLI prose; both now match the
      generated 98 UI + 30 block = 128 item manifest.
- [ ] Complete and publish the remaining AT matrix. Android TalkBack/WebView
      124 now has a bounded five-component report; NVDA/JAWS, current Chrome on
      Android and broader component coverage remain.

### Tier 1 — credible shadcn/Radix replacement for React products

- [ ] Migration adapters/codemods and a complete component/API mapping.
- [ ] Robust overlay placement/container/focus APIs and nested-overlay tests.
- [ ] Document the existing `DisclosureGroup` → Accordion mapping, then add
      password input/toggle, multi-thumb Slider/RangeSlider and editable
      TagsInput.
- [ ] Responsive AppShell/Sidebar recipe and global notification manager.
- [ ] Public registry search plus Lumo-specific agent instructions/skill; the
      generic shadcn MCP server can already consume a reachable compatible
      registry, so a bespoke MCP server is optional rather than the first step.
- [ ] More recipes for forms, auth, dashboards, responsive navigation and
      data-heavy application shells.

### Tier 2 — credible ReUI/Mantine replacement for enterprise apps

- [ ] Shared async/grouped/virtual collection controller used by Autocomplete,
      Combobox, Select, ListBox, Tree and TransferList.
- [ ] DataGrid/Table: pin, group/tree, edit, virtual/infinite, reorder and footer
      contracts with an explicit performance envelope.
- [ ] EventCalendar: resources, recurrence, zones, CRUD/activation, working
      hours/snap and keyboard/pointer create/move/resize.
- [ ] Gantt: dependencies, rollups, baselines, critical path, continuous zoom
      and split-pane resizing.
- [ ] Upload: directory/camera/transform and supported transport adapters with
      cancellation, chunking, pause/resume and retry; keep transport optional so
      presentational state remains honest.
- [ ] First-party nested/list/async form recipe and the chart families demanded
      by target products.

### Tier 3 — credible Astryx/Ark specialist replacement

- [ ] Color/angle/range inputs, QR/signature/tour/floating panel only where
      consumer demand justifies owning each state machine.
- [ ] Chat/AI, editors, file explorer, LogStream, Lightbox and advanced
      visualization packages with explicit security/accessibility policies.
- [x] State “React web only” prominently and do not spend roadmap capacity on
      multi-framework or native parity (`DECISIONS.md §19`).

## Recommended positioning now

An honest current message is:

> Lumo UI is a private, shadcn-compatible React design system for applications
> that must render correctly in Persian/Jalali and English from the first server
> byte. It offers unusually rigorous localized semantics and a broad set of
> application components, but it is not a drop-in Radix/Ark primitive layer nor
> a full replacement for ReUI/Mantine/Astryx enterprise ecosystems.

That positioning is stronger than “another shadcn library” because it names a
capability the competitors do not currently enforce end to end. It also leaves
no ambiguity about the remaining work.

## Declined claims

- I did **not** turn official catalog counts into a simplistic coverage
  percentage. Mantine's `Center`, Ark's `RootProvider`, ReUI's Event Calendar
  and Astryx's IDE template are not equivalent units.
- I did **not** count ReUI paid blocks/templates as free Lumo gaps; ReUI's own
  introduction says components/examples are free while blocks/icons/templates
  are paid.
- I did **not** claim Lumo's generic Chart replaces Mantine/Astryx named chart
  families.
- I did **not** claim a styled Lumo component is API-compatible with a Radix or
  Ark compound primitive.
- I did **not** recommend adding thin aliases for Astryx names already covered
  by composition; the earlier component-by-component deletion test rejected
  them (`review/DEPTH-ASTRYX-FINAL-2026-08-13.md:113-121,206-209`).
- I did **not** recommend new editor/WebGL/runtime dependencies before product,
  security and bundle requirements exist.
- I did **not** count NVDA or JAWS as passed. TalkBack is counted only for the
  exact five-component WebView 124 matrix recorded in
  `review/ANDROID-TALKBACK-AND-REPLACEMENT-2026-08-13.md`, not as a catalogue-
  wide or Chrome-for-Android pass.
