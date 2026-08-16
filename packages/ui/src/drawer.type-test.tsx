/**
 * Compile-time pin for the Drawer family: the drawer is named by the Dialog it
 * wraps (`aria-label`/`aria-labelledby` rejected), open state and dismissal
 * belong elsewhere, and a bare number child does not compile. An unused
 * `@ts-expect-error` fails `tsc`.
 */
import { Dialog } from "./dialog.tsx";
import { Drawer, DrawerOverlay, type DrawerProps } from "./drawer.tsx";

// @ts-expect-error aria-label does not exist on DrawerProps: a second, competing name
const named: DrawerProps = { "aria-label": "کشو" };
// @ts-expect-error aria-labelledby does not exist on DrawerProps
const labelled: DrawerProps = { "aria-labelledby": "h" };
void named;
void labelled;
// @ts-expect-error dismissal belongs to the overlay
void <Drawer isDismissable />;
// @ts-expect-error open state belongs to the trigger
void <Drawer isOpen />;
// @ts-expect-error entering is engine-owned state
void <DrawerOverlay isEntering />;
// @ts-expect-error open state belongs to the trigger, not the overlay
void <DrawerOverlay defaultOpen />;
// @ts-expect-error a bare number child is not a LumoNode
void <Drawer>{5}</Drawer>;

void (
  <DrawerOverlay isDismissable>
    <Drawer side="start">
      <Dialog label="کشو" closeLabel="بستن">متن</Dialog>
    </Drawer>
  </DrawerOverlay>
);
