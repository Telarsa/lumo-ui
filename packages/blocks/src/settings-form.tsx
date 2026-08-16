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
 * The status line is the hard part: success is `live="polite"`, failure
 * `live="assertive"`, and `status` starts `"idle"` so the banner mounts WITH
 * its content in response to a submit rather than announcing at load.
 * `strings.pending` is required because a spinner with no text is silence.
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
  /** The failure text, already translated. Rendered only when `status === "error"`. */
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
       * The `<form>` wraps the whole card, footer included, so the submit button is inside it.
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
         * `CardFooter` is `justify-end` (INLINE end); `me-auto` pushes the spinner
         * to the opposite edge on the same axis.
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
