# Lumo UI private website — handoff, 5 October 2026

> **Moved, 9 October 2026.** This site no longer lives in a separate private
> repository. It moved into the public MIT monorepo `Telarsa/lumo-ui` as
> `apps/website`, replacing the previous docs site; the standalone
> `Telarsa/lumo-ui-website` is archived. The site's source is now MIT. The
> proprietary IRANSansX font stayed private: it is never committed and is
> supplied to private builds through `LUMO_PRIVATE_FONTS_DIR` into the
> git-ignored `src/assets/fonts/private/` (see `../README.md`). Statements below
> about privacy, `UNLICENSED`, independence from the public repository, the
> `v1.0.0` git pin and the `src/assets/fonts/` IRANSansX path describe the
> standalone state and are historical.

> Historical record of the initial shared-foundation adoption and its verified
> behavior. The owner's later direction on 5 October 2026 superseded that
> architecture: styles, components and font assets now belong to each website.
> The archive/dependency/upgrade instructions below describe the earlier state
> and are not current. See `site-ownership-2026-10-05.md` and README.md for the
> current local ownership, build checks and provenance.

## Current result and ownership

This standalone marketing/documentation website is a private consumer of
Telarsa Web Foundation, separate from the public `../lumo-ui` correctness
library. Suggested repository name: **lumo-ui-website**, private. The parent
agent owns repository initialization, final commits and pushes under the
owner's finalization request. This handoff does not claim website deployment
or a domain cutover.

The consumer manifest is `private: true`, `UNLICENSED`. The public MIT library,
its existing website, gates and package code remain unchanged and usable from
a public clone. Do not move the private archive, fonts or consumer code into
that public repository. `NOTICE.md` preserves the MIT terms for adapted public
logo/documentation sources.

## Pages and presentation

Each of EN, DE and FA has twelve routes: home, How it works, Checks, seven
technical documentation pages and local imprint/privacy. Header navigation
opens actual pages. Language changes preserve the current subsection. Visitor
marketing copy is in `src/content/copy.ts` and `pages.ts`; legal copy is separate
in `legal.ts`. The original documentation keeps its complete authored
three-language page dictionaries.

The private foundation supplies typography, spacing, controls, focus and motion
values. Lumo retains its warm paper/ink/lime identity, native vector checking
diagram and scoped reading shell. Fonts use `next/font/local` once, with blocking
display and two generated preloads; supplied notices accompany the static export.
The diagram has one restrained trace and plane drift; reduced motion disables
these animations. Native FAQ disclosures stay independent.

## Dependency and source provenance

- Foundation: `@telarsa/web-foundation@0.1.0`, vendored private archive,
  SHA-256 `a3266a21d9ba6f5bcd945d219bf9156f127375f13e48ecb80f5e7d52c898aed1`.
  `vendor/web-foundation.json` records the pin; development/build guard its
  digest, dependency and installed private metadata. Updates require a new
  immutable version/archive and reviewed consumer upgrade.
- Public correctness API: `github:Telarsa/lumo-ui#v1.0.0`. The app imports its
  locale/document/number/date contracts and actual RTL lint and HTML gates,
  not a retired component roster. The guard verifies MIT/version metadata and
  fifteen displayed checks: fourteen registry rules plus the native-digit floor.
- Documentation: full index, getting-started, contract, helpers, dates, gate
  and mobile corpus from public commit
  `5d17b066e881bfbc6dd100814e72f54f4b9829d2`. The selected source/version and
  source/adapted checksums are in `docs/public-docs-snapshot.json`.
  `pnpm docs:refresh` explicitly refreshes the licensed snapshot and reapplies
  recorded shell/navigation/source-reference adaptations. Ordinary builds do
  not require the adjacent public checkout.
- Calendar: the original pinned `react-day-picker@10.0.1`, with a site-owned
  semantic CSS skin. Memoized Lumo calendar props, date conversion, names,
  selection and keyboard focus are preserved. The initial month shows its
  selected date; the translated demo note accurately describes this adaptation.
- Company facts: local checked snapshot of
  `../../telarsa-project/assets/company/company-profile.json`, outside the
  foundation. Identifiers remain strings and display digit by digit to preserve
  leading zeros. Site privacy copy is independently owned; unknown operational
  details are not invented and rendering checks do not certify legal compliance.

## Navigation fixes

The logo requests localized `#top`. Already-open home clicks reset instantly;
only exact same-target navigation is prevented. Other fragments/URLs and
modified clicks retain normal navigation. The body has a unique `top` target,
and the root declares its smooth-scroll policy for Next route transitions.
Settled native Back restores the prior documentation position.

The language menu is the website's native `details`, not a public Lumo widget.
Its scoped pointer/focus-outside and window-blur listeners close it; Escape
inside closes and restores summary focus. Outside dismissal does not steal
focus. Path changes close persistent state, internal links remain native, and
all listeners are removed on cleanup. HomeLink and FAQ behaviour are preserved.

## Verification

The required final `pnpm check` runs Next/React plus Lumo RTL lint, strict types,
four real gate-staging regression tests, private archive and licensed snapshot
guards, static export, served-byte grading and local link/asset checks. The
staging wrapper preserves root/error documents separately from the real English
home; the pinned public grader otherwise has a staging collision. Public gate
code is unchanged. The verified export contains 41 distinct HTML documents:
36 localized pages, four owned errors and one skipped root redirect. Forty
documents grade with zero violations; all 1,357 local links/anchors resolve.
Original Persian documentation digit floors remain armed; the character
exemption scope is 18.7%, below the original 28% ceiling.

The final repository-cleanup check completed successfully after the README,
handoff and ignore-file cleanup. Its local log is
`docs/verification/2026-10-05-finalization-check.log`. Runtime source, frozen
foundation archive and licensed documentation snapshot were unchanged.

Parent browser evidence records 144 route/locale/theme/actual-width samples
(EN/DE/FA, light/dark, 1280/390 pixels), no page overflow and two font preloads.
That matrix preceded the isolated calendar correction; twelve targeted calendar
samples afterward show the initial selection. Pointer selection and
ArrowDown/Enter update the readout in all three locales. Twelve native hover
samples retain stable control dimensions. The owned 404 uses the same fonts.
These earlier artifacts are local at
`../../telarsa-project/telarsa/docs/verification/web-foundation-2026-10-05/`.

All 36 logo navigation scenarios passed across locales/themes/widths, including
already-`#top` clicks, with additional clean-home/old-fragment/docs-at-top cases.
Settled Back restores exact prior positions; intermediate smooth-scroll samples
are not failures. Evidence: local
`docs/verification/logo-home-scroll-2026-10-05/`.

The language-menu review passed twelve locale/theme/actual-width cases for
outside pointer, internal focus, Escape return focus and Tab/ShiftTab exit,
without overflow or stolen focus. Six extra cases retained three language
subsection paths, independent FAQ state, client-route dismissal and repeated
logo scroll-zero behaviour. Evidence: local
`docs/verification/language-menu-dismissal-2026-10-05/`.
The parent reset viewport overrides, restored light theme and delivered the
user's existing homepage tab. These results are browser/keyboard and responsive
viewport checks, not assistive-technology, touch-device or window-blur proof.

## Repository cleanup and operation

Application source, manifests/lockfile, source guards, regression tests,
deployment configuration, provenance/notice files and the immutable private
archive are commit-worthy. Generated installations/builds, type caches,
environment files and `docs/verification/` logs/screenshots remain local and
are excluded from Git. `.env.example` is the only tracked environment template.
The source handoff retains verification outcomes without uploading machine-local
paths and generated captures.

`pnpm dev` or `pnpm preview` serves port 3113; preview uses the independent static
`out/` folder. Optional Docker/Caddy packaging is authored but was not run in
these local browser checks. `NEXT_PUBLIC_SITE_URL` stays unset before an agreed
canonical deployment, so pages are `noindex` without an invented origin.
Documentation remains on site; source links remain public. No domain, package
publication or website deployment is part of repository finalization.
