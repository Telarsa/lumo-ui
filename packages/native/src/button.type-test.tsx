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
// @ts-expect-error locale is a closed union
void <LumoNativeProvider locale="fa">x</LumoNativeProvider>;

void <Button variant="outline" size="lg" isDisabled>ذخیره</Button>;
void <IconButton label="بستن"><Text>✕</Text></IconButton>;
