/**
 * Compile-time pin for the native Button: a bare number child does not compile
 * (`LumoNode`), `IconButton.label` is required, and there is no `dir` — direction
 * comes from the provider. An unused `@ts-expect-error` fails `tsc`.
 */
import { Text } from "react-native";
import { Button, IconButton } from "./button.tsx";
import { LumoNativeProvider } from "./provider.tsx";

// @ts-expect-error a bare number child is not a LumoNode — format it
void <Button>{3}</Button>;
// @ts-expect-error the icon button's label is required
void <IconButton><Text>✕</Text></IconButton>;
// @ts-expect-error there is no dir prop anywhere in Lumo
void <Button dir="rtl">ذخیره</Button>;
// @ts-expect-error there is no dir on the provider either
void <LumoNativeProvider locale="fa-IR" dir="rtl">x</LumoNativeProvider>;
// Any BCP-47 tag is a locale since 0.2.0 (decision §28); the built-ins still autocomplete.
void <LumoNativeProvider locale="fa">x</LumoNativeProvider>;
void <LumoNativeProvider locale="de-AT">x</LumoNativeProvider>;

void <Button variant="outline" size="lg" isDisabled>ذخیره</Button>;
void <IconButton label="بستن"><Text>✕</Text></IconButton>;

// --- Switch: named by a visible label or an explicit name — never neither ---
import { Switch } from "./switch.tsx";
void <Switch>اعلان‌ها</Switch>;
void <Switch accessibilityLabel="حالت تاریک" />;
// @ts-expect-error a switch with no visible label and no accessibilityLabel has no name
void <Switch />;
// @ts-expect-error a bare number is not a LumoNode label
void <Switch>{3}</Switch>;

// --- TextField / Select: every announced string is a required prop --------------
import { TextField } from "./text-field.tsx";
import { Select } from "./select.tsx";
void <TextField label="نام" />;
// @ts-expect-error a text field needs its label
void <TextField placeholder="نام" />;
void <Select label="خدمت" placeholder="انتخاب کنید" closeLabel="بستن" options={[]} />;
// @ts-expect-error the placeholder is announced as the value — required, no English default
void <Select label="خدمت" closeLabel="بستن" options={[]} />;
// @ts-expect-error the sheet's close action needs a name
void <Select label="خدمت" placeholder="انتخاب کنید" options={[]} />;
