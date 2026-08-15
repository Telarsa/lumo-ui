import { LumoHtml } from "@lumo-ui/core";

/**
 * The root 404. It matches no route, so it cannot know the locale: authored in
 * Persian (the primary audience) with an English line beneath. It writes its own
 * `<html>` via LumoHtml because it sits ABOVE the `[lang]` layout and would
 * otherwise inherit no direction at all.
 */
export default function NotFound() {
  return (
    <LumoHtml lang="fa-IR">
      <body className="grid min-h-dvh place-items-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-fg">صفحه پیدا نشد</h1>
          <p className="mt-2 text-fg-muted">نشانی‌ای که دنبال آن بودید وجود ندارد.</p>
          {/*
           * The deliberate second-language line. `data-lumo-latn` as well as `lang`/`dir`:
           * the gate only accepts the house attribute as the hatch for Latin text, so `lang`
           * stays an accessibility statement about pronunciation, not a waiver.
           */}
          <p
            className="mt-6 text-sm text-fg-subtle"
            lang="en-US"
            dir="ltr"
            data-lumo-latn=""
          >
            This page could not be found.
          </p>
          <a
            href="/fa/"
            className="mt-6 inline-flex h-control-md items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            بازگشت به خانه
          </a>
        </div>
      </body>
    </LumoHtml>
  );
}
