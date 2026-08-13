# Product depth — PowerSearch

Date: 2026-08-13  
Branch: `experiment/base-ui`  
Tranche: Wave 1, typed query surface

## Outcome

PowerSearch now supplies the product UI that was missing above Lumo's existing
query engine. It writes ordinary `FilterClause[]` values, so its hidden form
bytes, local DataGrid execution and a future remote adapter all share the same
`serializeQuery` contract.

The public surface includes:

- a named keyboard-operable field combobox;
- editable field/operator/value tokens with staged popover Apply/Cancel;
- text, number, date, boolean, select, multiselect, entity and custom editors;
- caller-authored validation, availability status and disabled fields/options;
- token overflow expansion/collapse;
- saved views that apply canonical query values;
- caller-authored remote status and localized result counts;
- read-only and disabled modes; and
- optional native-form serialization.

No runtime dependency and no default English announcement were added.

## Proved behavior and mutation evidence

Tests were written first. After the implementation passed, production seams
were broken one at a time:

| Mutation | Assertion that failed |
| --- | --- |
| Removed the typeahead's query update | `adds a typed clause from its field typeahead and emits the canonical query bytes`: `onValueChange` had zero calls. |
| Applied the original clause instead of the staged draft | `stages a number edit in a popover and commits only when Apply is pressed`: expected `250`, received `100`. |
| Rendered every token instead of slicing at the overflow boundary | `collapses excess tokens without removing them from the query`: expected two edit buttons, received three. |
| Selected a saved-view label without applying its query | `loads saved query bytes and reports caller-authored result and remote status`: `onValueChange` had zero calls. |

All mutations were restored. The component test also pins the closed first-byte
combobox: it has a required accessible name, `aria-expanded="false"`, no
dangling `aria-controls`, and no duplicate IDs.

## Browser findings

The live English and Persian pages were exercised in the in-app browser at
desktop and 390 × 844 viewports.

Two defects were found and fixed:

1. The example parts tree named `PowerSearchField`, which is a type rather than
   a runtime part. The docs validator correctly crashed the page. The false part
   claim was removed.
2. Multi-value labels used a hard-coded Latin comma in Persian. A required
   `valueSeparator` string now keeps punctuation caller-authored; the RTL page
   renders `مالک، یکی از، سارا، نوید`.

The live pass confirmed keyboard field selection, a named edit dialog, disabled
Apply on an incomplete date clause, localized result counts, mobile wrapping,
read-only output and RTL ordering. A pre-existing theme `data-theme` hydration
warning appeared in the development shell; it is outside this component and was
not attributed to PowerSearch.

## Deliberate limits

- PowerSearch edits the backwards-compatible implicit-AND clause array. The
  underlying engine already owns nested AND/OR groups, but a visual nested-group
  editor remains explicit roadmap work.
- Remote transport remains caller-owned. The next roadmap item is a local
  DataGrid recipe and one concrete abortable remote example using the exact same
  serialized bytes.
- Text/number/date token display uses the supplied transport values. Products
  needing domain-specific formatting can use the custom editor/formatter rather
  than having Lumo guess currencies, calendars or units.
