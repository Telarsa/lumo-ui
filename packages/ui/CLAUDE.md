# packages/ui
- One component per file; `<name>.variants.ts` holds `cva()` and must stay directive-free (server components import it).
- Props extend `ComponentProps<"tag">` of the rendered element; `Omit` what you own and say why on the line for `ref`/`id`.
- Announced strings are required props; `locale` comes from `useLumoLocale()`; never a `dir` prop.
- Popups ride `Popover`/`PopoverTrigger` (Base UI); the only exceptions are aria-activedescendant comboboxes, and they say so in a comment.
- New component: test beside it (behavior + the root carries its classes), example in `apps/website/src/examples/<name>.tsx`, case in `popup-interiors.test.tsx` if it opens anything, then regenerate registry + API. Every new prop needs a docblock (ratchet is 0).
- Focused loop: `pnpm exec vitest run src/<name>.test.tsx` and `pnpm exec tsc --noEmit` from this directory.
