# Lumo UI logo — 12 October 2026

Original folded-L symbol with an open inner corner, a rising foot and a
detached lime plane. The owner asked for a fully new logo in Telarsa and
Khatamo's geometric direction. These paths form Lumo's own mark.

The outlined Lumo UI wordmark derives from the owned Inter Latin/OFL font at
wght 750/opsz 32. It contains paths only and renders without a font download.
The OFL notice remains in apps/website/src/assets/fonts/Inter-LICENSE.txt.

- lumo-mark.svg: theme-aware favicon.
- lumo-mark-on-paper.svg / -on-ink.svg: fixed mark masters.
- lumo-lockup-on-paper.svg / -on-ink.svg: horizontal lockups.
- lumo-lockup-vertical-on-paper.svg / -on-ink.svg: footer lockups.
- png/: mark exports 128/256/512/1024.
- generate-logo.py: offline FontTools generator; provenance.json records inputs.

Colours: ink #101114, paper #f2efe8, lime #7fa828. Always choose the fixed
theme variant, keep symbols left in every language, and never mirror or filter
the artwork. The theme-aware favicon selects its authored body colour via
prefers-color-scheme; lime remains fixed.

Regenerate browser icons and share cards with apps/website/scripts/render-brand-images.mjs.
No OneDrive source or proprietary Persian font is read or modified.

Persian masters add -fa to horizontal/vertical filenames and spell the
owner-confirmed «لومو یو‌آی». HarfBuzz joins the glyphs before outlining them
from the included Vazirmatn-Bold/OFL source; no proprietary font is read.
The shared symbol stays left. The website chooses Persian masters on fa.
