# apps/website
- Static export (`next build`); the built HTML is what `gate:html` grades. Every page must be first-byte correct in both locales.
- Examples: `src/examples/<name>.tsx` with `meta.intro` in fa-IR and en-US; the first example is the page preview. Interactive demos are islands.
- Bilingual copy lives beside the component; counts (111/30/141) are gated against `registry.json` — change them only via the generator.
- No English announced strings anywhere; Latin text only inside `data-lumo-latn` islands.
