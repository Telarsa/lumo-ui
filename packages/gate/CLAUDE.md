# packages/gate
- Rules grade SERVED HTML (`rules.ts`) or SOURCE (`inert-props.ts`). Every rule needs a fixture under `fixtures/` that fails, enumerated by the self-test.
- Locale grading is a table (`index.ts` KNOWN): direction, digits, calendar, script are independent — never derive one from another.
- Digit floors: `apps/website/gate.floors.json`, auto-admitted at 30+ native digits, never auto-removed.
- The gate fails closed. Widen it only with a fixture that proves the new case.
