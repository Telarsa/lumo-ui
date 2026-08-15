/**
 * Compile-time pin for the Command family: the dialog's `title`, `description`
 * and `closeLabel`, the input's and list's `label` are required, and a bare
 * number child does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Command, CommandDialog, CommandInput, CommandItem, CommandList } from "./command.tsx";

// @ts-expect-error title is required: it names the dialog
void <CommandDialog description="توضیح" closeLabel="بستن">متن</CommandDialog>;
// @ts-expect-error description is required
void <CommandDialog title="فرمان" closeLabel="بستن">متن</CommandDialog>;
// @ts-expect-error closeLabel is required: the close button would be nameless
void <CommandDialog title="فرمان" description="توضیح">متن</CommandDialog>;
// @ts-expect-error the input's label is required
void <CommandInput placeholder="جستجو" />;
// @ts-expect-error the list's label is required
void <CommandList />;
// @ts-expect-error a bare number child is not a LumoNode
void <CommandItem>{5}</CommandItem>;

void (
  <Command items={["الف"]}>
    <CommandInput label="جستجو" />
    <CommandList label="فرمان‌ها">
      <CommandItem id="a" onAction={() => undefined}>الف</CommandItem>
    </CommandList>
  </Command>
);
void <CommandDialog title="فرمان" description="توضیح" closeLabel="بستن">متن</CommandDialog>;
