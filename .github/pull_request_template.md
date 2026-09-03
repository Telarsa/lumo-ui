## What this changes

<!-- One concern per pull request. -->

## What you measured

<!-- Not only what changed: what did the gate, the tests or the build say
     before and after? A rule change should name the defect it now catches. -->

## Checklist

- [ ] `pnpm run verify` is green
- [ ] A new rule has a `because`, a poison test, and does not need a new blanket exemption
- [ ] No test was removed or weakened to make this pass
