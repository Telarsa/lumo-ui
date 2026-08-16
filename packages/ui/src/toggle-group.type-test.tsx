/**
 * Compile-time pin for the ToggleGroup family: the group's `aria-label` is a
 * REQUIRED announced string, `selectionMode` is a closed union, and a bare
 * number child does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { ToggleButton, ToggleButtonGroup, type ToggleButtonGroupProps } from "./toggle-group.tsx";

// @ts-expect-error aria-label is required: it names the group
const unnamed: ToggleButtonGroupProps = { children: <ToggleButton id="a">الف</ToggleButton> };
void unnamed;
// @ts-expect-error selectionMode is a closed union
void <ToggleButtonGroup aria-label="تراز" selectionMode="none" />;
// @ts-expect-error a toggle button is not a link
void <ToggleButton href="/x">الف</ToggleButton>;
// @ts-expect-error a bare number child is not a LumoNode
void <ToggleButton>{5}</ToggleButton>;

void (
  <ToggleButtonGroup aria-label="تراز" selectionMode="single" onSelectionChange={() => undefined}>
    <ToggleButton id="a">الف</ToggleButton>
    <ToggleButton id="b" isDisabled>ب</ToggleButton>
  </ToggleButtonGroup>
);
void <ToggleButton isSelected onChange={() => undefined} aria-label="پررنگ">B</ToggleButton>;
