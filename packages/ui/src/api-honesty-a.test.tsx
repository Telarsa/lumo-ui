import { describe, it } from "vitest";
import { Checkbox, CheckboxGroup } from "./checkbox.tsx";
import { DialogModal, DialogOverlay } from "./dialog.tsx";
import { DisclosureTrigger } from "./disclosure.tsx";

describe("component-specific types refuse inherited no-ops", () => {
  it("DisclosureTrigger refuses interaction contracts its engine cannot deliver", () => {
    // @ts-expect-error no press lifecycle adapter exists on Accordion.Trigger
    void <DisclosureTrigger onPressStart={() => {}}>عنوان</DisclosureTrigger>;
    // @ts-expect-error no hover lifecycle adapter exists on Accordion.Trigger
    void <DisclosureTrigger onHoverChange={() => {}}>عنوان</DisclosureTrigger>;
    // @ts-expect-error the frozen keyboard event shape is not delivered here
    void <DisclosureTrigger onKeyDown={() => {}}>عنوان</DisclosureTrigger>;
    // @ts-expect-error focus-change state is not synthesized here
    void <DisclosureTrigger onFocusChange={() => {}}>عنوان</DisclosureTrigger>;
    // @ts-expect-error pending state is not modelled by Accordion.Trigger
    void <DisclosureTrigger isPending>عنوان</DisclosureTrigger>;
    // @ts-expect-error focus-on-press cannot be controlled by Accordion.Trigger
    void <DisclosureTrigger preventFocusOnPress>عنوان</DisclosureTrigger>;
    // @ts-expect-error tab exclusion is not mapped by this component
    void <DisclosureTrigger excludeFromTabOrder>عنوان</DisclosureTrigger>;
  });

  it("Checkbox surfaces refuse validation and group contracts they do not implement", () => {
    // @ts-expect-error per-control validation mode is not implemented
    void <Checkbox validationBehavior="native">انتخاب</Checkbox>;
    // @ts-expect-error React Aria context slots do not exist
    void <Checkbox slot="selection">انتخاب</Checkbox>;
    // @ts-expect-error Base UI CheckboxGroup has no read-only group state
    void <CheckboxGroup label="انتخاب‌ها" isReadOnly />;
    // @ts-expect-error required group validation is not implemented
    void <CheckboxGroup label="انتخاب‌ها" isRequired />;
    // @ts-expect-error per-group validation mode is not implemented
    void <CheckboxGroup label="انتخاب‌ها" validationBehavior="native" />;
    // @ts-expect-error React Aria context slots do not exist
    void <CheckboxGroup label="انتخاب‌ها" slot="selection" />;
  });

  it("Dialog surfaces refuse engine-owned transition and portal contracts", () => {
    // @ts-expect-error entering is engine-owned state
    void <DialogOverlay isEntering />;
    // @ts-expect-error outside-interaction filtering has no Base UI part seam here
    void <DialogOverlay shouldCloseOnInteractOutside={() => true} />;
    // @ts-expect-error this surface does not choose the Portal target
    void <DialogOverlay UNSTABLE_portalContainer={document.body} />;
    // @ts-expect-error React Aria context slots do not exist
    void <DialogOverlay slot="overlay" />;
    // @ts-expect-error dismissal belongs to DialogTrigger/Overlay, not Modal
    void <DialogModal isDismissable />;
    // @ts-expect-error exiting is engine-owned state
    void <DialogModal isExiting />;
    // @ts-expect-error the Modal is already inside its Portal
    void <DialogModal UNSTABLE_portalContainer={document.body} />;
    // @ts-expect-error React Aria context slots do not exist
    void <DialogModal slot="modal" />;
  });
});
