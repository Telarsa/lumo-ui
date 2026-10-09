# Lumo UI website ownership, 5 October 2026

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

The owner's latest direction supersedes the initial shared marketing foundation.
This private website owns its styles and components independently. The public
Lumo UI correctness library, its technical docs application and its source/gate
corpus remain unchanged.

## Current source

- Local typography, spacing, focus, controls and motion: `src/styles/tokens.css`.
- Local identity/layout/docs/marketing CSS: `src/app/` and its scoped page styles.
- Local components: `src/components/`, including the working calendar, native
  navigation, language-menu dismissal and HomeLink scroll fixes.
- Local font binaries and original notices: `src/assets/fonts/`.
- Local integrity/provenance: `docs/site-assets.json` and
  `scripts/check-site-assets.mjs`. Tests verify independent operation, changed
  font rejection, missing notices, correct proprietary notice pairing and
  rejection of the retired shared dependency.

The adopted stylesheet's declarations, values, selectors and media queries
were verified equal after namespace/comment normalization. Only local
`--lumo-web-*` token names, `lumoWeb` layer names and ownership comments differ.
The two adopted font binaries and their notices were copied byte for byte.
Next's existing blocking display, font weights, variables and preload strategy
remain unchanged. No optional corporate theme or unused italic font was copied.

`@telarsa/web-foundation` is removed from the manifest, lockfile, build imports
and installed dependencies. The private tarball, vendor metadata and runtime
archive guard are retired. Historical package/version/digest facts remain only
as provenance; they do not provide a shared package, update mechanism or build
requirement. The preceding handoff is explicitly historical.

## Preserved boundaries

The package stays private and UNLICENSED. Inter retains its SIL Open Font
License; IRANSansX retains the owner's proprietary application-use licence.
Original licence notices accompany the generated static deployment. Licensed
public documentation and its MIT provenance stay intact; the public API is
still pinned to Lumo v1.0.0 with its real lint and served-byte gates.
Company facts remain a local snapshot of the separately maintained company
profile, independent of presentation styles.

## Verification

The complete `pnpm check` passed after the source and dependency migration:
Next/React and Lumo lint, strict types, all nine regression tests, local
style/font/notice integrity, public Lumo version/rule-count checks and the
licensed documentation snapshot guard. The independent static export retains
41 documents; forty graded pages have zero violations, and all 1,357 local
asset/navigation links resolve. Both generated font notices equal their local
source bytes and the English home retains two font preloads. The frozen install
removed exactly the retired styling package; the lockfile changes no other
dependency versions.

The local check log is
`docs/verification/2026-10-05-site-owned-styles-check.log` (generated, ignored).
Parent visual review remains pending; prior browser results in the historical
handoff describe the earlier shared-dependency build. No new deployment,
domain change, commit or push is performed by this ownership migration.
