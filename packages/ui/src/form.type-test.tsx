/**
 * Compile-time pin for the Form family: `noValidate` is owned by
 * `validationBehavior`, `Field` takes no `dir`, and a bare number child does
 * not compile in `Form`, `Label` or `FieldError`. An unused `@ts-expect-error`
 * fails `tsc`.
 */
import { Description, Field, FieldError, Form, Label } from "./form.tsx";

// @ts-expect-error noValidate is decided by validationBehavior, not passed through
void <Form noValidate>متن</Form>;
// @ts-expect-error validationBehavior is a closed union
void <Form validationBehavior="html">متن</Form>;
// @ts-expect-error a field has no dir: direction comes from the locale
void <Field label="نام" dir="rtl" />;
// @ts-expect-error a bare number child is not a LumoNode
void <Form>{5}</Form>;
// @ts-expect-error a bare number child is not a LumoNode
void <Label>{5}</Label>;
// @ts-expect-error a bare number child is not a LumoNode
void <FieldError>{5}</FieldError>;

void (
  <Form validationBehavior="native" onSubmit={() => undefined}>
    <Field label="نام" description="توضیح" errorMessage="خطا" isInvalid>
      <Label>نام</Label>
      <Description>توضیح</Description>
      <FieldError>خطا</FieldError>
    </Field>
  </Form>
);
