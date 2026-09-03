import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The docs pages' shared furniture. Kept in one file so the six routes cannot
 * drift into six different page shapes — the same argument §51 makes about
 * products and their tokens, one scale down.
 */

export function DocsHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead: string }) {
  return (
    <header className="space-y-4 border-b border-border pb-8">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      ) : null}
      <h1 className="text-4xl font-black leading-[1.15] tracking-tight">{title}</h1>
      <p className="max-w-2xl text-lg leading-8 text-fg-muted">{lead}</p>
    </header>
  );
}

export function Section({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {title ? <h2 className="text-xl font-black tracking-tight">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <p className="max-w-2xl leading-8 text-fg-muted">{children}</p>;
}

/**
 * A code block. `data-lumo-latn` is not decoration: a listing is genuinely
 * Latin, so it is MARKED rather than silently excused, and the gate's digit
 * and visible-text rules skip it by declaration.
 */
export function Code({ children, caption }: { children: string; caption?: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-surface-sunken">
      {caption ? (
        <figcaption className="border-b border-border px-4 py-2 text-xs font-bold text-fg-subtle">
          {caption}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto p-4 text-xs leading-6" data-lumo-latn dir="ltr">
        <code>{children}</code>
      </pre>
    </figure>
  );
}

export function Card({
  title,
  children,
  mono,
}: {
  title: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      {mono ? (
        <p className="mb-2 font-mono text-sm font-bold text-accent" data-lumo-latn dir="ltr">
          {title}
        </p>
      ) : (
        <p className="mb-2 text-sm font-black">{title}</p>
      )}
      <div className="text-sm leading-6 text-fg-muted">{children}</div>
    </div>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface-sunken">
            {head.map((h) => (
              <th key={h} className="border-b border-border px-4 py-3 text-start font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-hover">
              {cells.map((c, j) => (
                <td key={j} className="px-4 py-3 align-top leading-6 text-fg-muted">
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

/** Prev/next, so a reader can walk the docs without returning to the nav. */
export function DocsNav({
  prev,
  next,
}: {
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
}) {
  if (!prev && !next) return null;
  return (
    <nav className="flex flex-wrap gap-3 border-t border-border pt-8">
      {prev ? (
        <Link
          href={prev.href}
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm transition-colors hover:border-border-strong hover:bg-surface-hover"
        >
          <span className="block text-xs text-fg-subtle">←</span>
          <span className="font-bold">{prev.label}</span>
        </Link>
      ) : null}
      {next ? (
        <Link
          href={next.href}
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-end text-sm transition-colors hover:border-border-strong hover:bg-surface-hover"
        >
          <span className="block text-xs text-fg-subtle">→</span>
          <span className="font-bold">{next.label}</span>
        </Link>
      ) : null}
    </nav>
  );
}
