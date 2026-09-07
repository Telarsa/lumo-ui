"use client";

import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, type SiteLocale } from "@/lib/locales";

const names = { en: "English", de: "Deutsch", fa: "فارسی" };
const codes = { en: "EN", de: "DE", fa: "فا" };
export function LocaleSwitch({ locale, aria }: { locale: SiteLocale; aria: string }) {
  const pathname = usePathname();
  return <Menu.Root modal={false}>
    <Menu.Trigger className="language-menu-trigger" aria-label={`${aria}: ${codes[locale]}`} title={aria}>
      <span lang={locale} dir={locale === "fa" ? "rtl" : "ltr"} data-lumo-latn>{codes[locale]}</span>
    </Menu.Trigger>
    <Menu.Portal><Menu.Positioner className="language-menu-positioner" sideOffset={8} align="end"><Menu.Popup className="language-menu-panel">
      {LOCALES.map(target => {
        const segments = pathname.split("/"); segments[1] = target;
        return <Menu.Item key={target} className="language-menu-item" render={<Link href={segments.join("/")} hrefLang={target} />} aria-current={target === locale ? "true" : undefined}>
          <span className="language-menu-code" lang={target} dir={target === "fa" ? "rtl" : "ltr"} data-lumo-latn>{codes[target]}</span>
          <span lang={target} dir={target === "fa" ? "rtl" : "ltr"} {...(target !== "fa" ? { "data-lumo-latn": "" } : {})}>{names[target]}</span>
        </Menu.Item>;
      })}
    </Menu.Popup></Menu.Positioner></Menu.Portal>
  </Menu.Root>;
}
