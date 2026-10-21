# Website and example theme plan

- Add `src/lib/site-theme.mjs` and its declaration for a site-owned Light/Dark policy, pre-paint boot and storage-denial fallback; keep the published core theme API unchanged.
- Cover boot and runtime storage cases in `scripts/site-theme.test.mjs`, and include it in website test commands. Extend `scripts/documentation-ux-browser.mjs` to exercise dark-OS default, choices, reload and locale navigation when scheduled.
- Wire `src/app/[locale]/layout.tsx`, `src/components/theme-toggle.tsx`, and `src/content/copy.ts` to the policy and localized binary control. Make `src/styles/tokens.css` and `docs/site-assets.json`, `src/app/globals.css`, `public/icon.svg` (derived by `scripts/build-site-icon.mjs` and guarded by `scripts/check-brand-assets.mjs`), and `scripts/own-static-shells.mjs` default to light without OS selection, including metadata and error pages.
- Set `apps/mobile-example/lib/main.dart` to explicit light; the example has no theme control. Update `apps/website/README.md` to document behavior.
- Run focused small regressions first and after implementation. With the shared heavy lease, format and run the website checks, static-shell/CSP and WebKit browser checks, then root `pnpm verify`; generated output is produced by the normal build.
