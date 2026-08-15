/**
 * Compile-time pin for `Switch`: validation modes, focus-change synthesis and
 * RAC slots the engine lacks are rejected, and a bare number child does not
 * compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Switch } from "./switch.tsx";

// @ts-expect-error per-control validation mode is not implemented
void <Switch validationBehavior="native">اعلان‌ها</Switch>;
// @ts-expect-error focus-change state is not synthesized here
void <Switch onFocusChange={() => undefined}>اعلان‌ها</Switch>;
// @ts-expect-error React Aria context slots do not exist
void <Switch slot="x">اعلان‌ها</Switch>;
// @ts-expect-error a bare number child is not a LumoNode
void <Switch>{5}</Switch>;

void <Switch size="lg" description="توضیح">اعلان‌ها</Switch>;
void <Switch isSelected onChange={() => undefined} name="notify" value="on" />;
