# Contributing to Lumo UI

Thank you for looking. Lumo is small on purpose, so the useful contributions
are specific: a **gate rule**, a **locale**, a **helper** that closes a gap, or
a **correction** to something that is wrong.

`pnpm run verify` is the contract. Thirteen gates; if it is green, the change is
shippable. Run it before you open a pull request.

```bash
pnpm install          # pnpm only — the workspace uses catalog:
pnpm run verify
```

## What makes a good rule

Every rule in the gate was earned by a defect that shipped and that nothing
else caught. If you propose one, bring the defect: what a reader received, and
why an existing tool did not report it. A rule that fires on correct output is
worse than no rule, because the first thing anyone does with a noisy gate is
turn it off.

A rule needs three things:

1. **A `because`** — one sentence naming the real failure. It is printed to the
   person whose build just went red, so write it for them.
2. **A poison test** — proof the rule fires when it should. A test that only
   asserts the green path can pass against a rule that does nothing.
3. **An escape hatch that is graded.** `data-lumo-latn` is the only exemption
   the gate honours, and the purity rule audits it. If your rule needs a new
   hatch, it needs a rule that watches the hatch too.

## What does not belong here

- **Components.** Lumo is not a component library; that was tried and retired.
  shadcn/ui and Material own the widgets.
- **A rule that `lang="en"` would satisfy.** Marking text as English is the
  natural wrong fix for text in the wrong script, which is exactly why the gate
  refuses to honour it.
- **Blanket exemptions.** Anything of the shape "skip elements that look like
  X" will eventually hide the defect the rule exists to find.

## Adding a locale

A locale brings a complete set of strings or the build fails; there is no
partial locale and no English fallback at runtime. Add the profile in
`packages/core`, the strings, and a test that a missing key is a type error
rather than a blank in the page.

## House style

- British spelling. Plain sentences. No marketing.
- A comment says **why**, with the evidence. "Never collapse these two branches"
  followed by the measurement that proves it is worth more than a paraphrase of
  the code.
- Never remove a test to make a change pass. If an expectation is wrong, say so
  in the commit message and change it deliberately.
- No em-dashes in prose.

## Pull requests

- One concern per pull request.
- Say what you measured, not only what you changed.
- If `verify` fails for a reason you did not introduce, say which gate and why;
  do not work around it silently.

## Reporting something

Open an [issue](https://github.com/Telarsa/lumo-ui/issues). For a suspected
false positive, the most useful report is the smallest HTML that reproduces it
plus the locale, because that becomes the fixture.

For a security concern, see [SECURITY.md](SECURITY.md).

## Licence

By contributing you agree that your contribution is licensed under the MIT
licence, the same as the rest of the project.
