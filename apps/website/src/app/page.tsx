import { LumoHtml } from "@lumo-ui/core";

/**
 * The bare root. Under `output: "export"` nothing can redirect, so this is a real
 * document: Persian (the primary audience), with a link onward rather than relying
 * on a meta-refresh a crawler may not follow.
 */
export default function Root() {
  return (
    <LumoHtml lang="fa-IR">
      <head>
        <title>لومو</title>
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
