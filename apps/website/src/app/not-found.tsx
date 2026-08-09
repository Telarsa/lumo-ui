import { LumoHtml } from "@lumo-ui/core";

/**
 * The root 404.
 *
 * It is served for any path that matched no route, so it cannot know the
 * visitor's locale. Next's default would be an English document; Persian is the
 * primary audience, so this is authored in Persian with an English line beneath
 * rather than left to a fallback.
 *
 * It writes its own `<html>` via LumoHtml because it sits ABOVE the `[lang]`
 * layout and would otherwise inherit no direction at all — which is precisely
 * the `<html lang="en">` defect, arriving through the one route nobody tests.
 */
export default function NotFound() {
  return (
    <LumoHtml lang="fa-IR">
      <body className="grid min-h-dvh place-items-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-fg">صفحه پیدا نشد</h1>
          <p className="mt-2 text-fg-muted">نشانی‌ای که دنبال آن بودید وجود ندارد.</p>
          <p className="mt-6 text-sm text-fg-subtle" lang="en-US" dir="ltr">
            This page could not be found.
          </p>
          <a
            href="/fa-IR/"
            className="mt-6 inline-flex h-control-md items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            بازگشت به خانه
          </a>
        </div>
      </body>
    </LumoHtml>
  );
}
