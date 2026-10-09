# Lumo UI website — agent guide (`apps/website`)

lumo-ui.com, inside the public MIT Lumo UI repository since 9 October 2026. It
consumes the workspace `lumo-ui` package as a product would; the repository
root `AGENTS.md` rules apply here too. Read `README.md` first.

THE FONT RULE. IRANSansX is proprietary and must never be committed, in this
app or anywhere in the repository. It lives only in the git-ignored
`src/assets/fonts/private/`, filled by `scripts/prepare-private-fonts.mjs` from
`LUMO_PRIVATE_FONTS_DIR`. Before any commit, confirm `git diff --cached --name-only`
lists nothing under that directory and no `IRANSansX*` file. Inter (OFL) is
committed with its licence. A build without the private font must keep working
with the system Persian fallback.

The site owns its styling: tokens in `src/styles/tokens.css`, identity/layout
rules in `src/app/*.css`, Inter and its notice in `src/assets/fonts/`. Do not
add a shared styling package, shadcn copies or CSS Modules (the repository's
`gate:no-css-modules` bans them).

Marketing copy is typed in `src/content/copy.ts` and `src/content/pages.ts`;
legal copy in `src/content/legal.ts`. Each is complete in English, German and
Persian. Documentation retains the full authored three-language corpus with its
own typed page dictionaries; refresh it only through `pnpm docs:refresh` and
review the documented adaptations. Company facts are a local snapshot of the
Telarsa company profile. Keep Lumo's lime mark and palette independent of
Telarsa's red theme. Never claim a screen-reader pass or deployment that was
not run.

Run `pnpm check` here (or the root `gate:html`) before handoff. Inspect all
three languages, both themes, mobile and desktop. Prefer logical CSS
properties; mark Latin code/name tokens deliberately (`data-lumo-latn`).

No tag, domain cutover or deployment without owner instruction.
