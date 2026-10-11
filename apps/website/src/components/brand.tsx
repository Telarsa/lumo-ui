import Image from "next/image";

/** Horizontal assets are byte-identical to the delivered masters. The footer
 * rearranges the same fixed-colour mark and Archivo wordmark vertically. */
export function Brand({ vertical = false }: { vertical?: boolean }) {
  const name = vertical ? "lumo-lockup-vertical" : "lumo-lockup";
  return <span className={vertical ? "brand brand-vertical" : "brand"} data-lumo-latn="" dir="ltr">
    <Image className="brand-paper" src={`/brand/${name}-on-paper.svg`} alt="Lumo UI" width={168} height={vertical ? 88 : 40} unoptimized />
    <Image className="brand-ink" src={`/brand/${name}-on-ink.svg`} alt="Lumo UI" width={168} height={vertical ? 88 : 40} unoptimized />
  </span>;
}

export function Arrow() {
  return <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}
