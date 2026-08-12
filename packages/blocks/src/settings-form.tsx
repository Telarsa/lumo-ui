"use client";

import type { FormEvent } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  Spinner,
  optional,
} from "@lumo-ui/ui";

/**
 * A titled settings panel: fields in, save and cancel out, one status line.
 *
 * `"use client"`: `onSubmit` and `onCancel` are callbacks.
 *
 * ── THE STATUS LINE IS WHY THIS BLOCK EXISTS ───────────────────────────────
 *
 * A settings form is fields plus one hard problem — telling the reader that the
 * save worked. Doing it badly is the default:
 *
 *  - A `role="alert"` success banner INTERRUPTS the screen reader mid-sentence
 *    for good news. `alert.tsx` argues the whole case; `live="polite"` waits
 *    for a pause, which is what "saved" deserves. A failure gets
 *    `live="assertive"`, because a failure IS urgent.
 *
 *  - A banner rendered at load announces itself before the reader has reached
 *    it. That is why `status` starts at `"idle"` and the banner is mounted only
 *    in response to a submit — the live region appears WITH its content, which
 *    is the only ordering screen readers agree on.
 *
 * ── `Spinner.label` IS REQUIRED, SO PENDING IS A STRING TOO ────────────────
 *
 * A spinner has no text: a screen-reader user gets silence while the page looks
 * frozen. spinner.tsx makes the label a required `string` for exactly that, and
 * a block cannot default it either — a default would be English handed to a
 * Persian voice. So `strings.pending` is required whenever the caller intends
 * to use `isPending`, and it is rendered as REAL text inside the spinner's own
 * `role="status"` rather than as an `aria-label` on it.
 */
export type SettingsFormStatus = "idle" | "saved" | "error";

export interface SettingsFormStrings {
  /** The panel's heading, e.g. «اطلاعات حساب». */
  title: string;
  /** What this panel controls. */
  description?: string | undefined;
  /** The submit button. */
  save: string;
  /** The discard button. Omit `onCancel` to hide it. */
  cancel: string;
  /** Announced while a save is in flight. REQUIRED — see the file header. */
  pending: string;
  /** The success line, e.g. «تغییرات ذخیره شد». */
  saved: string;
}

export interface SettingsFormProps {
  strings: SettingsFormStrings;
  /** The fields. `<TextField>`, `<Switch>`, `<RadioGroup>` — whatever fits. */
  children?: LumoNode;
  onSubmit?: ((event: FormEvent<HTMLFormElement>) => void) | undefined;
  onCancel?: (() => void) | undefined;
  /** Drives the status banner. See the file header. Default `"idle"`. */
  status?: SettingsFormStatus | undefined;
  /**
   * The failure text, already translated. Rendered only when
   * `status === "error"` — a banner with a tone and no sentence is worse than
   * no banner.
   */
  errorMessage?: LumoNode;
  isPending?: boolean | undefined;
  /** Heading level for the panel title. Default `2`. */
  level?: 2 | 3 | 4 | 5 | 6 | undefined;
  className?: string | undefined;
}

export function SettingsForm({
  strings,
  children,
  onSubmit,
  onCancel,
  status = "idle",
  errorMessage,
  isPending = false,
  level = 2,
  className,
}: SettingsFormProps) {
  return (
    <Card variant="outlined" className={cn("w-full", className)}>
      {/*
       * The `<form>` wraps the whole card, footer included: a submit button
       * outside its form only works through the `form` attribute, which is
       * easy to forget and silent when wrong.
       */}
      <Form {...optional("onSubmit", onSubmit)} className="gap-0">
        <CardHeader>
          <CardTitle level={level}>{strings.title}</CardTitle>
          {strings.description !== undefined ? (
            <CardDescription>{strings.description}</CardDescription>
          ) : null}
        </CardHeader>

        <CardBody className="flex flex-col gap-4">
          {status === "saved" ? (
            // Polite: good news waits for a pause. See the file header.
            <Alert tone="positive" live="polite">
              {strings.saved}
            </Alert>
          ) : null}

          {status === "error" && errorMessage !== undefined ? (
            <Alert tone="critical" live="assertive">
              {errorMessage}
            </Alert>
          ) : null}

          {children}
        </CardBody>

        {/*
         * `CardFooter` is already `justify-end` — the INLINE end, so the
         * actions sit bottom-right in English and bottom-LEFT in Persian with
         * no override. `me-auto` on the spinner pushes it to the opposite
         * edge, again on the inline axis.
         */}
        <CardFooter>
          {isPending ? (
            <Spinner label={strings.pending} showLabel size="sm" color="muted" className="me-auto" />
          ) : null}

          {onCancel !== undefined ? (
            <Button type="button" variant="outline" isDisabled={isPending} onPress={onCancel}>
              {strings.cancel}
            </Button>
          ) : null}

          <Button type="submit" isDisabled={isPending}>
            {strings.save}
          </Button>
        </CardFooter>
      </Form>
    </Card>
  );
}
