/**
 * Compile-time pin for `InputOtp`: `label` and `locale` are required, there is
 * no `dir` prop, and the control takes no children. An unused
 * `@ts-expect-error` fails `tsc`.
 */
import { InputOtp } from "./input-otp.tsx";

// @ts-expect-error label is required: it names the group of slots
void <InputOtp locale="fa-IR" />;
// @ts-expect-error locale is required: it renders the digits
void <InputOtp label="کد تأیید" />;
// @ts-expect-error no dir prop: direction comes from the locale
void <InputOtp label="کد تأیید" locale="fa-IR" dir="ltr" />;
// @ts-expect-error the control renders its own slots; children are not a prop
void <InputOtp label="کد تأیید" locale="fa-IR">متن</InputOtp>;

void <InputOtp label="کد تأیید" locale="fa-IR" />;
void <InputOtp label="کد تأیید" locale="fa-IR" length={4} onComplete={() => undefined} description="توضیح" />;
