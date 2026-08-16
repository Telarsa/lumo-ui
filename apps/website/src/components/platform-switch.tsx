import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { segmentFor } from "@/lib/locale";

const COPY = {
  "fa-IR": { group: "پلتفرم", web: "وب", mobile: "موبایل" },
  "en-US": { group: "Platform", web: "Web", mobile: "Mobile" },
} as const satisfies Record<Locale, { group: string; web: string; mobile: string }>;

/**
 * Web | Mobile — two REAL links (the platform is a route segment, as the locale
 * is; never client state), styled like the preview's LTR | RTL control. Rendered
 * only on pages whose component has a Mobile side.
 */
export function PlatformSwitch({ lang, slug, platform }: { lang: Locale; slug: string; platform: "web" | "mobile" }) {
  const c = COPY[lang];
  const base = `/${segmentFor(lang)}/components/${slug}/`;
  const item = (key: "web" | "mobile", href: string, label: string) => {
    const current = key === platform;
    return (
      <a
        href={href}
        aria-current={current ? "page" : undefined}
        className={
          current
            ? "inline-flex h-7 select-none items-center rounded-sm bg-surface px-2.5 text-xs font-medium text-fg shadow-sm"
            : "inline-flex h-7 items-center rounded-sm px-2.5 text-xs text-fg-muted transition-colors hover:text-fg"
        }
      >
        {label}
      </a>
    );
  };
  return (
    <nav aria-label={c.group} className="inline-flex w-fit items-center gap-1 rounded-md border border-border bg-surface-sunken p-1">
      {item("web", base, c.web)}
      {item("mobile", `${base}mobile/`, c.mobile)}
    </nav>
  );
}
