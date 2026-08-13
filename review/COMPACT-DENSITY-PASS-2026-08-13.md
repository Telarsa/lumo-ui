# Compact density and icon pass — 2026-08-13

## Decision

Lumo's default density remains `0.9`. It resolves the default control token to
36 px, the compact control to 29 px, and keeps the large variant at its explicit
44 px touch floor. The primary button, field, select, combobox, number field,
search field, date controls, toggles, pagination, and input groups already read
that shared scale. Default control icons are 16 px (`size-4`).

The current shadcn direction reinforces this architecture. Its Rhea announcement
describes smaller buttons, inputs, menus, cards, and lists, but explicitly
rejects changing Tailwind's global spacing multiplier: density is adjusted in
the components so `p-2`, `w-4`, and `m-16` keep their meaning. Lumo therefore
does not globally shrink Tailwind spacing or every SVG. It removes component
outliers and keeps content-bearing imagery, rating stars, and empty-state icons
larger than control chrome.

Official reference:
<https://ui.shadcn.com/docs/changelog/2026-05-rhea>

## Changes proved red then green

| Component | Before | After | Assertion |
| --- | --- | --- | --- |
| Cascader trigger | hard-coded 40 px (`h-10`) | `h-control-md` | `wave-three-inputs.test.tsx` requires the shared token |
| TreeSelect trigger | hard-coded 40 px (`h-10`) | `h-control-md` | same density assertion |
| MaskInput | hard-coded 40 px (`h-10`) | `h-control-md` | same density assertion |
| CommandInput | hard-coded 44 px (`h-11`) | `h-control-md` | `command.test.tsx` rejects `h-11` |
| InputOtp slots | 48×40 px, 18 px type | density-scaled square, 14 px type | `input-otp.test.tsx` requires both control tokens and `text-sm` |
| ColorInput swatch | hard-coded 40×40 px | `size-control-md` | composite-field assertion requires the shared square |
| TagsInput field | hard-coded 40 px minimum | `min-h-control-md` | composite-field assertion requires the shared minimum |
| MultiSelect field | hard-coded 40 px minimum | `min-h-control-md` | composite-field assertion requires the shared minimum |
| Select scrollbar | hidden native rail plus edge arrows | thin draggable native thumb over a light track, no stable gutter | `select.test.tsx` requires `thin`, a visible track, and forbids the gutter and Base UI scrollbar suppression |

## Icon audit

- Button, menu, select, combobox, listbox, tree, sidebar, date controls, field
  actions, and navigation controls use 16 px control icons.
- Compact calendar dropdown items use 14 px icons beside 12 px text.
- Chip removal and minor status affordances use 12–14 px icons inside larger
  hit areas.
- Deliberately larger icons were retained: FileUpload's 32 px empty-drop glyph,
  20 px empty-state and attachment-media glyphs, and 20/24 px Rating stars.
  Those are content or hierarchy, not button chrome; shrinking them to 16 px
  would flatten the design rather than make it denser.

## Retained geometry

- `lg` controls retain the 44 px touch floor promised by their API.
- EventCalendar's 48 px hour rows retain time-positioning geometry.
- Gantt's 40 px task rows retain readable hierarchy and resize targets.
- Media thumbnails and avatar/icon-tile size variants retain their semantic
  visual hierarchy.

These are not density leaks. Each is content geometry or an explicitly selected
large variant, rather than a default interactive control bypassing the scale.

## Permanent sweep

`density-contract.test.ts` scans every shipped UI `.ts` and `.tsx` source after
removing comments. It permits hard-coded 40–48 px heights only in Gantt and
EventCalendar data geometry, and icons above 16 px only in the reviewed content
roles listed above. Two in-memory mutations prove the sweep catches a new
`h-10` control and a new `size-5` control icon rather than passing vacuously.
