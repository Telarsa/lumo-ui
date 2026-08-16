/**
 * Compile-time pin for the Disclosure (accordion) family: the trigger is a
 * `<button>` and refuses the link/press/slot surface it never delivers, and a
 * bare number child does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Disclosure, DisclosureGroup, DisclosurePanel, DisclosureTrigger } from "./disclosure.tsx";

// @ts-expect-error a disclosure trigger is a button, not a link
void <DisclosureTrigger href="/x">عنوان</DisclosureTrigger>;
// @ts-expect-error no RAC slot on the trigger
void <DisclosureTrigger slot="trigger">عنوان</DisclosureTrigger>;
// @ts-expect-error no press callback: the engine event is onClick
void <DisclosureTrigger onPress={() => undefined}>عنوان</DisclosureTrigger>;
// @ts-expect-error pending state is not modelled by Accordion.Trigger
void <DisclosureTrigger isPending>عنوان</DisclosureTrigger>;
// @ts-expect-error tab exclusion is not mapped by this component
void <DisclosureTrigger excludeFromTabOrder>عنوان</DisclosureTrigger>;
// @ts-expect-error a bare number child is not a LumoNode
void <DisclosureTrigger>{5}</DisclosureTrigger>;
// @ts-expect-error a bare number child is not a LumoNode
void <DisclosurePanel>{5}</DisclosurePanel>;

void (
  <DisclosureGroup allowsMultipleExpanded>
    <Disclosure id="a">
      <DisclosureTrigger>عنوان</DisclosureTrigger>
      <DisclosurePanel>متن</DisclosurePanel>
    </Disclosure>
  </DisclosureGroup>
);
void <Disclosure defaultExpanded><DisclosureTrigger level={2}>عنوان</DisclosureTrigger></Disclosure>;
