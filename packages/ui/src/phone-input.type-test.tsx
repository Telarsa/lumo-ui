/**
 * Compile-time pin for `PhoneInput`: `label`, `locale` and `countryLabel` are
 * required, there is no `dir` prop, and the control takes no children. An
 * unused `@ts-expect-error` fails `tsc`.
 */
import { PhoneInput } from "./phone-input.tsx";

// @ts-expect-error label is required: it names the number input
void <PhoneInput locale="fa-IR" countryLabel="کشور" />;
// @ts-expect-error locale is required: it renders the digits
void <PhoneInput label="تلفن" countryLabel="کشور" />;
// @ts-expect-error countryLabel is required: the country select would be nameless
void <PhoneInput label="تلفن" locale="fa-IR" />;
// @ts-expect-error no dir prop: the number is always LTR inside an RTL page by the component's own rule
void <PhoneInput label="تلفن" locale="fa-IR" countryLabel="کشور" dir="ltr" />;
// @ts-expect-error the control renders its own inputs; children are not a prop
void <PhoneInput label="تلفن" locale="fa-IR" countryLabel="کشور">متن</PhoneInput>;

void <PhoneInput label="تلفن" locale="fa-IR" countryLabel="کشور" />;
void <PhoneInput label="تلفن" locale="fa-IR" countryLabel="کشور" defaultCountry="IR" onChange={() => undefined} description="توضیح" />;
