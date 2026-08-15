# The August 2026 evaluation arc

Kept because the conclusions changed the codebase; the reports themselves were removed once their findings were fixed.

**Trajectory (anchored scale, shadcn/ui = Mantine = 8, Ark = 7.5):** self-assessments had ratcheted to 9.6; the first independent blind reviews landed at ≈7.0; a fix pass reached 8.9 on the old surface; 19k lines of new components diluted it back to ≈7.5; the repair passes that followed were re-evaluated at 7.8, then 7.9.

**What the reviews proved and what was done:**
- The mutation campaign asserted 99 modules against 111 and used a circular oracle → rewritten around `vitest related`, an `unobserved` status, and a registry-derived count; the honest baseline was 44/63/4, driven to 111/111 with styling floors and per-module behavioral operators.
- `chartMirror` was absent from four chart families → mirrored through each family's real seam, pinned on served SVG geometry.
- The served-bytes gate never saw a popup interior; `defaultOpen` cannot fix that (portals do not SSR) → the popup-interiors tier grades 18 families live. On first contact it found Base UI's hardcoded English `Dismiss` and the aria-hidden-label naming failure.
- 47% of generated prop descriptions were a false "inherited" filler → split, ratcheted, and documented to zero; cva variant keys turned out to be real doc sites.
- The React Aria compatibility surface (165 carriers, 127 discards, `slot`, `excludeFromTabOrder`) kept minting accepted-and-inert props — cancel buttons wired to a slot no engine reads, `hrefLang` served on a `<button>` → removed; `DialogClose` added; `tabIndex` made real.
- Table gained Home/End/PageUp/PageDown; Cascader and TreeSelect moved onto the shared popover; DataGrid renders its validation reason.

**Standing limits:** no browser or assistive-technology evidence exists; the mutation floor is one operator per module; distribution is private by decision.
