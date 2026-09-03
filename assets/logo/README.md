# The Lumo UI mark

A square with one corner taken by a radius, and that radius is the only
coloured part. Lumo means light, so the rounded corner is the lit one. The
whole mark is a `border-radius`: the most ordinary thing CSS does, which is the
argument the library rests on.

| file | use |
| --- | --- |
| `lumo-mark.svg` | the mark, theme-aware: ink body on light, paper body on dark (favicons, in-page) |
| `lumo-mark-on-paper.svg` / `-on-ink.svg` | fixed-colour masters for print, slides, other people's pages |
| `lumo-lockup-on-paper.svg` / `-on-ink.svg` | mark + wordmark; the wordmark is Archivo, wide, and Latin in every locale |
| `png/` | raster exports at 128, 256, 512, 1024 |

Colours: paper `#f2efe8`, ink `#101114`, lime `#7fa828`. The lime measures
2.79:1 on paper, fine for a mark, not for text; text uses `#5c7a1c`.
The corner sits on the reading side and mirrors in a right-to-left page.
