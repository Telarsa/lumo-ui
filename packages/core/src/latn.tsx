import type { ReactElement } from "react";
import { isLatinRun } from "./latn.ts";

/*
 * The JSX layer over ./latn.ts — see that file for the reasoning. Only the
 * components live here, so that nothing which needs `isLatinRun` has to pull
 * in a renderer to get it.
 */

export interface LatnProps {
  children: string;
  /**
   * Also set `dir="ltr"`. A VISUAL change — it reorders a leading neutral such as
   * the «+» of a phone number — so it is opt-in and should be used when that is
   * the intent, not by default.
   */
  ltr?: boolean;
}

/**
 * A string that is Latin by nature — a wordmark, an address, a code. Marked only
 * when the string really is a Latin run; otherwise rendered bare, so the same
 * slot can hold a translated value on another locale without lying.
 */
export function Latn({ children, ltr }: LatnProps): ReactElement {
  return isLatinRun(children) ? (
    <span data-lumo-latn="" dir={ltr ? "ltr" : undefined}>
      {children}
    </span>
  ) : (
    <>{children}</>
  );
}

/** `Latn`, under the name the first consumer gave it: a NAME's script is its owner's choice. */
export const Name = Latn;

/**
 * Prose containing a designation that is Latin by definition — «ISO 27001», a
 * milestone code, a unit — where the island must go around the TOKEN and not
 * the paragraph. The copy marks them itself, with `[[…]]`:
 *
 *     <Prose>{"پیگیری کنترل‌های ISMS و [[ISO 27001]]"}</Prose>
 *
 * Explicit and per-string ON PURPOSE. The tempting version auto-detects Latin
 * runs and wraps them, which would also swallow a genuinely untranslated English
 * sentence — the exact defect `native-script-text` exists to catch. A marker an
 * author has to type cannot do that silently.
 */
export interface ProseProps {
  children: string;
  /**
   * Also set `dir="ltr"` on each island — the same opt-in as `Latn`, for the
   * same reason: it is a visual change. Two consumers shipped their islands
   * with it before this component existed; the flag lets them adopt it with
   * their rendered bytes unchanged.
   */
  ltr?: boolean;
}

export function Prose({ children, ltr }: ProseProps): ReactElement {
  const parts = children.split(/\[\[(.+?)\]\]/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} data-lumo-latn="" dir={ltr ? "ltr" : undefined}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

