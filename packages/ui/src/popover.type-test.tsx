/**
 * Compile-time pin for the Popover family: the trigger needs children, the
 * surface refuses open state and physical placement, and a bare number child
 * does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Button } from "./button.tsx";
import { Popover, PopoverDescription, PopoverTrigger } from "./popover.tsx";

// @ts-expect-error the trigger's children are required
void <PopoverTrigger />;
// @ts-expect-error open state belongs to the trigger, not the surface
void <Popover isOpen>متن</Popover>;
// @ts-expect-error shouldFlip is not a Base UI positioner seam here
void <Popover shouldFlip>متن</Popover>;
// @ts-expect-error physical placement is not a LumoPlacement
void <Popover placement="left">متن</Popover>;
// @ts-expect-error physical placement is not a LumoPlacement
void <Popover placement="right top">متن</Popover>;
// @ts-expect-error a bare number child is not a LumoNode
void <Popover>{5}</Popover>;

void (
  <PopoverTrigger>
    <Button>باز کردن</Button>
    <Popover placement="bottom start" offset={4}>
      <PopoverDescription>متن</PopoverDescription>
    </Popover>
  </PopoverTrigger>
);
void <Popover placement="end" aria-label="راهنما">متن</Popover>;
