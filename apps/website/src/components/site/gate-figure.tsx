"use client";

import { useEffect, useState } from "react";
import type { SiteLocale } from "@/lib/locales";

/**
 * The hero figure: a Persian page as it was SERVED, beside what the gate says
 * about it, then the same page after Lumo — the report going to zero.
 *
 * Everything in the "served" state that is wrong on purpose sits in <samp>:
 * it is literally sample program output, and <samp> is one of the four
 * elements the gate already treats as a Latin island. So the figure can show
 * the defects without shipping them, and this site's own grade stays honest.
 * Nothing here carries a real aria attribute — the announced name is shown as
 * text, because a demo of a bad label must not BE a bad label.
 */
const T = {
  "fa-IR": {
    served: "همان‌طور که سرو شد",
    graded: "پس از Lumo",
    report: "گزارش دروازه",
    route: "/fa/orders/4825",
    order: "سفارش",
    delivery: "تحویل",
    status: "وضعیت",
    submit: "ثبت سفارش",
    announced: "نامِ اعلام‌شده",
    statusOk: "در جریان",
    total: (n: string) => `${n} تخلف`,
    clean: "بدون تخلف",
  },
  "en-US": {
    served: "As served",
    graded: "After Lumo",
    report: "Gate report",
    route: "/fa/orders/4825",
    order: "سفارش",
    delivery: "تحویل",
    status: "وضعیت",
    submit: "ثبت سفارش",
    announced: "Announced name",
    statusOk: "در جریان",
    total: (n: string) => `${n} violation(s)`,
    clean: "0 violation(s)",
  },
} as const;

const RULES = [
  ["no-latin-digits", 3],
  ["native-calendar", 1],
  ["native-script-text", 2],
  ["native-script-name", 1],
] as const;

export function GateFigure({ locale }: { locale: SiteLocale }) {
  const t = T[locale];
  const [after, setAfter] = useState(false);

  // One pass, served → graded, unless the reader asked for no motion. After
  // that the control is theirs.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setAfter(true), 2200);
    return () => window.clearTimeout(id);
  }, []);

  const fa = new Intl.NumberFormat("fa-IR", { useGrouping: false });
  const n = (v: number) => (locale === "fa-IR" ? fa.format(v) : String(v));

  return (
    <figure className="gate-figure" data-state={after ? "after" : "before"}>
      <div className="gate-figure__tabs" role="group" aria-label={t.report}>
        <button type="button" className="gate-figure__tab" aria-pressed={!after} onClick={() => setAfter(false)}>
          {t.served}
        </button>
        <button type="button" className="gate-figure__tab" aria-pressed={after} onClick={() => setAfter(true)}>
          {t.graded}
        </button>
      </div>

      <div className="gate-figure__page" lang="fa-IR" dir="rtl">
        <div className="gate-figure__bar">
          <span className="gate-figure__dot" aria-hidden="true" />
          <samp>{t.route}</samp>
        </div>
        <div className="gate-figure__body">
          <p className="gate-figure__h">
            {t.order} {after ? <b>۴۸۲۵</b> : <samp data-defect="">4825</samp>}
          </p>
          <p>
            <span className="gate-figure__k">{t.delivery}</span>{" "}
            {after ? <b>چهارشنبه ۱۲ شهریور ۱۴۰۵</b> : <samp data-defect="">Wednesday, 3 September 2026</samp>}
          </p>
          <p>
            <span className="gate-figure__k">{t.status}</span>{" "}
            <span className="gate-figure__select">{after ? <b>{t.statusOk}</b> : <samp data-defect="">thr</samp>}</span>
          </p>
          <p className="gate-figure__cta">
            <span className="gate-figure__btn">{t.submit}</span>
            <span className="gate-figure__name">
              <span>{t.announced}</span> {after ? <b>{t.submit}</b> : <samp data-defect="">Submit</samp>}
            </span>
          </p>
        </div>
      </div>

      <figcaption className="gate-figure__report">
        <p className="gate-figure__report-head">{t.report}</p>
        <ul role="list">
          {RULES.map(([id, count]) => (
            <li key={id} data-clean={after ? "" : undefined}>
              <span className="gate-figure__rule" data-lumo-latn dir="ltr">
                {id}
              </span>
              <span className="gate-figure__count">{after ? n(0) : n(count)}</span>
            </li>
          ))}
        </ul>
        <p className="gate-figure__total" data-clean={after ? "" : undefined}>
          {after ? (locale === "fa-IR" ? t.clean : <span data-lumo-latn dir="ltr">{t.clean}</span>) : t.total(n(7))}
        </p>
      </figcaption>
    </figure>
  );
}
