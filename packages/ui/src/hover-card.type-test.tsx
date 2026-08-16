/**
 * Compile-time pin for `HoverCard`: `label` and `trigger` are required,
 * placement is logical only (`left`/`right` rejected), and a bare number child
 * does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { HoverCard } from "./hover-card.tsx";

// @ts-expect-error label is required: it names the card
void <HoverCard trigger={<span>راهنما</span>}>متن</HoverCard>;
// @ts-expect-error trigger is required: the card has nothing to hover
void <HoverCard label="کارت">متن</HoverCard>;
// @ts-expect-error physical placement is not a LumoPlacement
void <HoverCard label="کارت" trigger={<span>راهنما</span>} placement="left">متن</HoverCard>;
// @ts-expect-error physical placement is not a LumoPlacement
void <HoverCard label="کارت" trigger={<span>راهنما</span>} placement="right">متن</HoverCard>;
// @ts-expect-error a bare number child is not a LumoNode
void <HoverCard label="کارت" trigger={<span>راهنما</span>}>{5}</HoverCard>;

void <HoverCard label="کارت" trigger={<span>راهنما</span>}>متن</HoverCard>;
void <HoverCard label="کارت" trigger={<span>راهنما</span>} placement="start" openDelay={300}>متن</HoverCard>;
