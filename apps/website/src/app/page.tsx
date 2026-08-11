import { LumoHtml } from "@lumo-ui/core";

/**
 * The bare root.
 *
 * Under `output: "export"` there is no server to redirect, so this is a real
 * document — which means it must declare a language like any other. It is
 * Persian, because Persian is the primary audience rather than the translation,
 * and it links onward instead of relying on a meta-refresh that a crawler may
 * not follow.
 */
export default function Root() {
  return (
    <LumoHtml lang="fa-IR">
      <head>
        <meta httpEquiv="refresh" content="0; url=/fa/" />
        <link rel="canonical" href="/fa/" />
      </head>
      <body className="grid min-h-dvh place-items-center p-8">
        <a href="/fa/" className="text-accent underline">
          رفتن به لومو
        </a>
      </body>
    </LumoHtml>
  );
}
