import Link from "next/link";
import type { ReactNode } from "react";
import { CHROME } from "@/lib/chrome";
import { DOCS, docIndex, docNeighbours, type DocSlug } from "@/lib/docs-order";
import type { SiteLocale } from "@/lib/locales";
import { localePath } from "@/lib/site";

/**
 * The docs pages' shared furniture. One file, so six routes cannot drift into
 * six page shapes — the same argument the contract makes about products and
 * their tokens, one scale down.
 */

export function DocsHeader({ locale, slug, title, lead }: { locale: SiteLocale; slug: DocSlug; title: string; lead: string }) {
  return (
    <header className="doc-header">
      <p className="eyebrow">
        <span className="eyebrow__num">{docIndex(slug, locale)}</span>
        {CHROME[locale].docs.eyebrow}
      </p>
      <h1 className="doc-title">{title}</h1>
      <p className="doc-lead">{lead}</p>
    </header>
  );
}

export function Section({ title, id, children }: { title?: ReactNode; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="doc-section">
      {title ? <h2 className="doc-h2">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="prose">{children}</div>;
}

/**
 * A code listing. `data-lumo-latn` is not decoration: a listing is genuinely
 * Latin, so it is MARKED rather than silently excused, and the gate's digit
 * and script rules skip it by declaration — and the purity rule then checks
 * the declaration was true.
 */
export function Code({ children, caption }: { children: string; caption?: string }) {
  return (
    <figure className="code">
      {caption ? (
        <figcaption className="code__caption" data-lumo-latn dir="ltr">
          {caption}
        </figcaption>
      ) : null}
      <pre data-lumo-latn dir="ltr">
        <code>{children}</code>
      </pre>
    </figure>
  );
}

export function Table({ head, rows, firstMono }: { head?: string[]; rows: ReactNode[][]; firstMono?: boolean }) {
  return (
    <div className="table-wrap">
      <table className="table">
        {head ? (
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i}>
              {cells.map((c, j) => (
                <td key={j} data-mono={firstMono && j === 0 ? "" : undefined}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A Latin identifier inside a Persian sentence: a token name, a flag, a file. Marked, not translated. */
export function Id({ children }: { children: string }) {
  return (
    <code data-lumo-latn dir="ltr">
      {children}
    </code>
  );
}

export function Card({ title, children, mono }: { title: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="card lit">
      {mono ? (
        <p className="card__title card__title--mono" data-lumo-latn dir="ltr">
          {title}
        </p>
      ) : (
        <p className="card__title">{title}</p>
      )}
      <div className="card__body">{children}</div>
    </div>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return <aside className="callout lit">{children}</aside>;
}

/** Prev/next from the one reading order, so a reader can walk the docs without the nav. */
export function DocsNav({ locale, slug }: { locale: SiteLocale; slug: DocSlug }) {
  const { prev, next } = docNeighbours(slug);
  const c = CHROME[locale].docs;
  return (
    <nav className="doc-nav" aria-label={c.eyebrow}>
      {prev ? (
        <Link href={localePath(locale, `/docs/${prev}`)} className="doc-nav__link lit" rel="prev">
          <span className="doc-nav__dir">{c.prev}</span>
          <span className="doc-nav__label">{DOCS[locale][prev].label}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={localePath(locale, `/docs/${next}`)} className="doc-nav__link doc-nav__link--next lit" rel="next">
          <span className="doc-nav__dir">{c.next}</span>
          <span className="doc-nav__label">{DOCS[locale][next].label}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
