# Lumo website family — 7 September 2026

The website keeps its paper/ink/lime identity with a four-rem main header,
44px locale/theme controls, a mobile docs-index link and footer-only Telarsa
product attribution. Company links retain English/Persian. Shadcn accent is
unbound; copied components continue to use muted for hover fills.

A Khatamo review reproduced a false green: `scripts/grade-app.mjs` staged the
root redirect over the actual English homepage. Explicit locale paths now take
priority; colliding inputs receive distinct staged paths and are reported.
`scripts/check-pack.mjs` checks the installed tarball with a valid English page,
then corrupts its language/direction and requires rejection. No generated gate
bundle changed. No release tag/version was created: other v1-pinned consumers
need their local guard or a separately approved fixed release.

Full `pnpm verify` passed before the staging defect was found. After the fix,
types, lint, installed-package regression and the rebuilt HTML gate passed.
The corrected website corpus is 19 graded documents, zero violations; the
previous 18-document result missed the English homepage and is superseded.
Evidence: `/tmp/lumo-family-verify.log`, `/tmp/lumo-family-pack.log`,
`/tmp/lumo-family-types-final.log`, `/tmp/lumo-family-release-lint.log`,
`/tmp/lumo-family-release-gate.log`.

Worker: `lumo-ui-website`; root build `pnpm run gate:html`; deployment
`npx wrangler deploy --config apps/website/wrangler.jsonc`. Main is the production
branch; root path is `/`. Website delivery does not publish the package.

## Visual verification

The baseline is `/tmp/telarsa-family-before/`. Final screenshots and metrics are
under `/tmp/telarsa-family-release/`; the repeatable probe is committed in Lumo
as `scripts/probe-website.mjs`. It tests the actual production preview in every
locale, light/dark and 1440/768/390/320px, records rest/hover and rejects overflow,
HTTP errors, wrong document language and browser exceptions. These are browser
facts, not a full accessibility certification. The additional interaction run in
`/tmp/telarsa-family-interactions/` checks mobile navigation, theme persistence
and representative inner pages. Temporary evidence is local to this workspace.

The owner explicitly rejected attribution under header logos. Product ownership
appears in footers, with locale-preserving company/product-directory links.
No remote CI was run; the owner waived it after usage was exhausted. Commit on
develop, fast-forward main and push both without force. No new public deployment,
DNS binding, package tag or VPS change is part of this checkpoint.
