import type { BuiltinLocale as Locale } from "@lumo-ui/core";

/**
 * What a screen reader announces for this page's demo. This server component
 * renders only an EMPTY `[data-lumo-evidence-slot]`; a POST-BUILD pass
 * (`scripts/inject-evidence.mjs`, chained into `build`) fills it from the built
 * HTML under `[data-lumo-demo-root]`, because `renderToStaticMarkup` cannot
 * render `"use client"` React Aria components. History: docs/decisions/log.md.
 */

export interface EvidencePanelProps {
  locale: Locale;
}

export function EvidencePanel({ locale }: EvidencePanelProps) {
  return (
    <div
      data-lumo-evidence-slot=""
      data-lumo-evidence-locale={locale}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: "" }}
    />
  );
}
