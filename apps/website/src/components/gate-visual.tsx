import type { Copy } from "@/content/copy";

/** A diagram of the real source/build checking sequence; no simulated customer UI.
 * Decorative vectors are paired with localized visible labels and caption. */
export function GateVisual({ text }: { text: Copy["figure"] }) {
  return <figure className="gate-visual">
    <div className="figure-top"><span className="lit-corner" aria-hidden="true" /><span>{text.title}</span></div>
    <div className="vector-stage" aria-hidden="true">
      <svg viewBox="0 0 560 330" fill="none" focusable="false">
        <defs><linearGradient id="gate-edge" x1="126" y1="75" x2="420" y2="240" gradientUnits="userSpaceOnUse"><stop stopColor="var(--lumo-mark)" stopOpacity="0" /><stop offset=".45" stopColor="var(--lumo-mark)" /><stop offset="1" stopColor="var(--lumo-mark)" stopOpacity="0" /></linearGradient></defs>
        <path className="figure-grid" d="m64 231 213 94 213-94M94 217l183 81 183-81M124 203l153 68 153-68M154 189l123 55 123-55M184 175l93 42 93-42M64 231l213-94 213 94M94 245l183-81 183 81M124 258l153-68 153 68M154 272l123-55 123 55M184 285l93-42 93 42" />
        <g className="plane plane-base"><path className="plane-face" d="m122 210 155-69 155 69-155 69Z" /><path className="plane-side" d="m122 210 155 69 155-69v11l-155 69-155-69Z" /><path className="plane-rule" d="m175 209 102 45 101-45" /><path className="plane-line" d="m197 207 38 17m-16-34 70 31m-48-48 65 29" /></g>
        <g className="plane plane-mid"><path className="plane-face" d="m122 159 155-69 155 69-155 69Z" /><path className="plane-side" d="m122 159 155 69 155-69v11l-155 69-155-69Z" /><path className="plane-line" d="m182 159 17 7 40-18m8 40 17 7 40-18m-48-45 16 7 40-18" /><path className="check-line" d="m182 159 17 7 40-18m8 40 17 7 40-18m-48-45 16 7 40-18" /></g>
        <g className="plane plane-top"><path className="plane-face" d="m122 108 155-69 155 69-155 69Z" /><path className="plane-side" d="m122 108 155 69 155-69v11l-155 69-155-69Z" /><path className="plane-line" d="m179 104 50 22m-32-30 88 39m-70-47 47 21m-25-30 56 25m-34-34 78 34" /><path className="plane-highlight" d="m179 104 50 22m-32-30 88 39m-70-47 47 21" /></g>
        <path className="check-path" d="m122 108 155-69 155 69v113l-155 69-155-69V108Z" stroke="url(#gate-edge)" />
        <circle className="pass-node" cx="277" cy="290" r="5" />
      </svg>
      <div className="plane-label label-top"><span>{text.contract}</span></div>
      <div className="plane-label label-mid"><span>{text.lint}</span></div>
      <div className="plane-label label-base"><span>{text.html}</span></div>
    </div>
    <div className="figure-result"><span className="check-icon" aria-hidden="true">✓</span><strong>{text.result}</strong></div>
    <ul className="figure-tags" role="list"><li>{text.digits}</li><li>{text.calendar}</li><li>{text.names}</li></ul>
    <figcaption>{text.caption}</figcaption>
  </figure>;
}
