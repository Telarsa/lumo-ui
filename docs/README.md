# Documentation map

What is in this directory, and which file answers what.

**Using Lumo in your own project**

- [`agent-consumer.md`](agent-consumer.md) is the whole consumer workflow, and
  the one to read first: install, wire the provider, format every number, mark
  the runs that are Latin by nature, declare the gate's inputs, grade the served
  bytes. Written to be usable by a person or by a coding agent.
- [`i18n-and-rtl.md`](i18n-and-rtl.md) is the locale contract itself: what the
  four properties of a locale are, which rules are compile-time and which are
  build-time, what happens to Latin words inside Persian copy, and how a
  language Lumo does not ship is supplied by the app.
- [`../skills/lumo-ui/SKILL.md`](../skills/lumo-ui/SKILL.md) is the same
  workflow as a skill file, for an agent working in a consumer repository.

**Understanding or contributing to Lumo**

- [`thesis.md`](thesis.md) says what Lumo is for, in one page.
- [`verification.md`](verification.md) says what `pnpm run verify` proves, gate
  by gate, and what is honestly not covered.
- [`decisions/log.md`](decisions/log.md) says why anything is the way it is,
  with the measurement that decided it. The source cites it by section number.
- [`upstream/`](upstream) holds defects found in the libraries underneath,
  written up with reproductions: Base UI's first-byte naming, its focus guards and its
  hardcoded dismiss label, and Next's builtin error shells.
- [`evidence/mobile-device.md`](evidence/mobile-device.md) is the one run on
  real hardware, with what it proves and what it does not. It is dated, and the
  tap-target floors in `packages/mobile` cite it.
