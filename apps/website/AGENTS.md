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

## Durable website rules — 11 October 2026

- The delivered horizontal logo lockups in `assets/logo/` are authoritative.
  `public/brand/lumo-lockup-on-{paper,ink}.svg` stays byte-identical to them.
  Choose the supplied theme variant; never recolour or mirror a logo. The
  symbol remains on the left in every locale. Footer vertical derivatives may
  change placement only; preserve the supplied paths, fixed colours and
  Archivo wordmark attributes. Do not substitute an unrelated font or edit
  the masters. Outlined wordmarks require an owner-supplied asset.
- Keep the full company-profile snapshot byte-identical to
  `telarsa-project/assets/company/company-profile.json`. The confirmed address
  is Persian only, including on EN/DE pages; mark `A12` as a Latin island.
  Do not invent an authorized representative, logging or retention settings.
- Legal notice revision dates describe the actual notice changes and remain
  separate from the company snapshot's own `updatedAt` provenance date.
- The owner authorized the public canonical origin `https://lumo-ui.com`.
  The website is delivered via Cloudflare, verified from the live response;
  old preview/unpublished wording does not describe its current status.
- Production HTTP and `www.lumo-ui.com` must redirect with method-preserving
  308 to the HTTPS apex while retaining encoded paths and queries. Keep the
  root Wrangler entry, `ASSETS` binding and `run_worker_first: true`; a static
  canonical URL or HSTS header alone does not redirect a first HTTP request.
  The Worker leaves preview/local origins unredirected and preserves static
  asset routing, bodies, status/404 behaviour and cache metadata. Its shared
  response-policy module must remain free of Node-only build imports. Keep
  the build configuration guard and meaningful Worker regression tests.
- HSTS is sent only on originally HTTPS requests (RFC 6797 section 7.2).
  Capture the original protocol before rewriting a redirect destination.
  HTTP responses retain the six base protections and must remove inherited
  ASSETS HSTS; HTTPS responses retain all seven protections. Test both
  redirect and preview/static-response paths without changing cache/status/body.
- `scripts/csp.mjs` runs after the owned static shells and hashes each page’s
  exact inline scripts. Every build verifies the policy and both hosts’
  response-header configuration. Do not hand-edit generated policies or
  enable inline scripts/eval. Style attributes remain allowed for React;
  style elements require this origin or a reviewed hash.
- Marketing ratings requested by the owner come from an independent reviewer
  with explicit evidence and limitations. They do not replace the package’s
  correctness gates or justify weakening them.
- Horizontally scrolling code and tables remain keyboard reachable with a
  visible focus ring. Add documentation-renderer changes to the deterministic
  `scripts/sync-public-docs.mjs` adaptations and use `pnpm docs:refresh`; never
  hand-edit the frozen corpus or bypass its provenance check.
- Horizontal navigation must reveal the complete focused link and its focus
  ring through ordinary Tab navigation, including RTL. Native partial
  visibility is insufficient; use the site-owned rail focus helper and test
  both phone widths without synthetic focus or scroll assistance.
- The Inter primary is the verified Latin subset; retain the original full
  face as the non-preloaded complementary fallback. Both keep blocking display,
  their actual disjoint cmap ranges and the existing OFL notice.
  Record font provenance and update the asset guard for any reviewed change.
  Decorative symbols should use vectors rather than trigger an entire font.
- Language-link activation preserves the current query and fragment, including
  a keyboard skip link's `#main`, after the destination's canonical trailing
  slash. The chosen system/light/dark theme persists across locale switches.
