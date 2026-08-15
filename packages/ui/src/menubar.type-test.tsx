/**
 * Compile-time pin for the Menubar family: `label` is required, a menubar
 * button refuses the press/pending/slot/style surface it never delivers, and a
 * bare number child does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Menubar, MenubarButton } from "./menubar.tsx";

// @ts-expect-error label is required: it names the menubar
void <Menubar><MenubarButton>پرونده</MenubarButton></Menubar>;
// @ts-expect-error no press callback on a menubar button
void <MenubarButton onPress={() => undefined}>پرونده</MenubarButton>;
// @ts-expect-error pending state is not modelled
void <MenubarButton isPending>پرونده</MenubarButton>;
// @ts-expect-error tab exclusion is not mapped; the roving tabindex is internal
void <MenubarButton excludeFromTabOrder>پرونده</MenubarButton>;
// @ts-expect-error no RAC slot
void <MenubarButton slot="x">پرونده</MenubarButton>;
// @ts-expect-error a menubar button is not a link
void <MenubarButton href="/x">پرونده</MenubarButton>;
// @ts-expect-error a bare number child is not a LumoNode
void <MenubarButton>{5}</MenubarButton>;

void (
  <Menubar label="نوار منو">
    <MenubarButton>پرونده</MenubarButton>
    <MenubarButton isDisabled>ویرایش</MenubarButton>
  </Menubar>
);
