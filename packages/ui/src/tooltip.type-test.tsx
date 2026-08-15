/**
 * Compile-time pin for the Tooltip family: the trigger needs children, the
 * surface refuses open state and physical placement, and a bare number child
 * does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Button } from "./button.tsx";
import { Tooltip, TooltipTrigger } from "./tooltip.tsx";

// @ts-expect-error the trigger's children are required
void <TooltipTrigger />;
// @ts-expect-error open state belongs to the trigger, not the surface
void <Tooltip isOpen>راهنما</Tooltip>;
// @ts-expect-error physical placement is not a LumoPlacement
void <Tooltip placement="left">راهنما</Tooltip>;
// @ts-expect-error physical placement is not a LumoPlacement
void <Tooltip placement="right">راهنما</Tooltip>;
// @ts-expect-error a bare number child is not a LumoNode
void <Tooltip>{5}</Tooltip>;

void (
  <TooltipTrigger delay={0}>
    <Button>ذخیره</Button>
    <Tooltip placement="top">ذخیره تغییرات</Tooltip>
  </TooltipTrigger>
);
void <Tooltip placement="start" offset={8}>راهنما</Tooltip>;
