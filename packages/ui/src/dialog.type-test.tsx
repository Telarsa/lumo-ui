/**
 * Compile-time pin for the Dialog family: `label` and `closeLabel` are
 * required, the dialog owns its own naming (`aria-label`/`aria-labelledby`
 * rejected), overlay/modal refuse open-state and portal props, and a bare
 * number child does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Button } from "./button.tsx";
import { Dialog, DialogModal, DialogOverlay, DialogTrigger, type DialogProps } from "./dialog.tsx";

// @ts-expect-error label is required: it names the role=dialog popup
void <Dialog closeLabel="بستن">متن</Dialog>;
// @ts-expect-error closeLabel is required: the close button would be nameless
void <Dialog label="گفتگو">متن</Dialog>;
// @ts-expect-error aria-label is owned: `label` is the one name
const named: DialogProps = { label: "گفتگو", closeLabel: "بستن", "aria-label": "گفتگو" };
// @ts-expect-error aria-labelledby is owned: the heading id is wired internally
const labelled: DialogProps = { label: "گفتگو", closeLabel: "بستن", "aria-labelledby": "h" };
void named;
void labelled;
// @ts-expect-error React Aria context slots do not exist
void <Dialog label="گفتگو" closeLabel="بستن" slot="dialog" />;
// @ts-expect-error open state belongs to the trigger, not the overlay
void <DialogOverlay isOpen />;
// @ts-expect-error dismissal belongs to DialogTrigger/Overlay, not Modal
void <DialogModal isDismissable />;
// @ts-expect-error the trigger's children are required
void <DialogTrigger />;
// @ts-expect-error a bare number child is not a LumoNode
void <Dialog label="گفتگو" closeLabel="بستن">{5}</Dialog>;

void (
  <DialogTrigger>
    <Button>باز کردن</Button>
    <DialogOverlay isDismissable>
      <DialogModal>
        <Dialog label="گفتگو" closeLabel="بستن">متن</Dialog>
      </DialogModal>
    </DialogOverlay>
  </DialogTrigger>
);
