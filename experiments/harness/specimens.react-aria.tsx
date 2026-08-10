/**
 * THE SPECIMENS — one per measured component, for the React Aria tree.
 *
 * This file is the ONLY implementation-specific half of the harness.
 * `measure.mjs` knows nothing about React Aria; it bundles whichever
 * `specimens.<impl>.tsx` it is pointed at and measures what comes out. The Base
 * UI phase writes `specimens.base-ui.tsx` against this same contract and reruns
 * the identical harness, or the comparison is worthless.
 *
 * ── THREE RULES THE SPECIMENS MUST OBEY, ALL OF THEM LOAD-BEARING ───────────
 *
 * 1. **Force overlays OPEN.** A closed overlay renders `null`, and a sweep of
 *    default states therefore scores Popover, Menu, Select's list and ComboBox's
 *    listbox as CLEAN when they were merely unmeasured. That exact mistake is
 *    recorded in `packages/core/src/strings.ts`: the first sweep found 8 English
 *    strings, the re-measure with overlays open found 3 more. Every specimen
 *    with an overlay declares `opens: true` and takes `ctx.open`.
 *
 * 2. **Strings are separated from direction.** `ctx.strings` is the locale whose
 *    words are passed as props; `ctx.locale` is the locale the library renders
 *    under. They are the same for the defect passes and deliberately BOTH
 *    `fa-IR` for the RTL diff — otherwise every direction delta would be
 *    swamped by Persian-vs-English text and the diff would measure translation
 *    rather than mirroring.
 *
 * 3. **`supplied` lists every announced string this specimen passes as a prop,**
 *    together with what happens WITHOUT it. It is how the harness tells
 *    «نمایش پیشنهادها» that Lumo passed from «نمایش پیشنهادها» that the patched
 *    `fa-IR` bundle happened to supply — the two are byte-identical here, and
 *    without the declaration the attribution would be a guess. `absent` is the
 *    part that stops the count from flattering us: a missing `placeholder`
 *    renders ENGLISH, a missing `TabList` label renders NOTHING, and reporting
 *    those as one number would be wrong in both directions.
 *
 * ── AND A CONTROL ARM: `BARE` ───────────────────────────────────────────────
 *
 * `SPECIMENS` measures the wrapper. `BARE` measures the LIBRARY, composed
 * directly with no Lumo prop, no required string and no correction, under the
 * same locale provider. Without it "zero English leaks" is a number with no
 * denominator — it cannot distinguish a library that leaks nothing from a
 * wrapper that closes everything. Every leak the bare arm shows and the wrapped
 * arm does not is a leak this codebase is currently paying to hold shut, and
 * that is the quantity the Base UI decision actually turns on.
 */

import type { ReactElement } from "react";
// Relative, not `@lumo-ui/core`: this file sits outside every workspace package,
// so the bare specifier has no `node_modules` to resolve through. The components
// it imports still use the bare form and resolve to the same realpath, so the
// bundle carries one copy of core, not two.
import type { Locale } from "../../packages/core/src/index.ts";
import { stringsFor } from "../../packages/core/src/index.ts";
import { LumoProvider } from "../../packages/ui/src/provider.tsx";

import { Button, IconButton } from "../../packages/ui/src/button.tsx";
import { Switch } from "../../packages/ui/src/switch.tsx";
import { Checkbox, CheckboxGroup } from "../../packages/ui/src/checkbox.tsx";
import { IconToggle, Toggle } from "../../packages/ui/src/toggle.tsx";
import { Select, SelectItem, SelectPopover, SelectTrigger } from "../../packages/ui/src/select.tsx";
import {
  Menu,
  MenuItem,
  MenuPopover,
  MenuSeparator,
  MenuTrigger,
  SubmenuTrigger,
} from "../../packages/ui/src/menu.tsx";
import { ComboBox, ComboBoxItem } from "../../packages/ui/src/combobox.tsx";
import {
  Dialog,
  DialogHeading,
  DialogModal,
  DialogOverlay,
  DialogTrigger,
} from "../../packages/ui/src/dialog.tsx";
import { Popover, PopoverTrigger } from "../../packages/ui/src/popover.tsx";
import { Tooltip, TooltipTrigger } from "../../packages/ui/src/tooltip.tsx";
import { Tab, TabList, TabPanel, Tabs } from "../../packages/ui/src/tabs.tsx";
import { Slider } from "../../packages/ui/src/slider.tsx";
import { NumberField } from "../../packages/ui/src/number-field.tsx";

/*
 * The bare arm imports the library by its BARE specifier, which does not resolve
 * from this directory on its own — `measure.mjs` aliases it to the package's own
 * ESM entry, the same realpath the components above reach through
 * `packages/ui/node_modules`. One instance of the library, two arms.
 */
import {
  Button as RacButton,
  CheckboxButton as RacCheckboxButton,
  CheckboxField as RacCheckboxField,
  CheckboxGroup as RacCheckboxGroup,
  ComboBox as RacComboBox,
  Dialog as RacDialog,
  DialogTrigger as RacDialogTrigger,
  Group as RacGroup,
  Heading as RacHeading,
  Input as RacInput,
  Label as RacLabel,
  ListBox as RacListBox,
  ListBoxItem as RacListBoxItem,
  Menu as RacMenu,
  MenuItem as RacMenuItem,
  MenuTrigger as RacMenuTrigger,
  Modal as RacModal,
  ModalOverlay as RacModalOverlay,
  NumberField as RacNumberField,
  Popover as RacPopover,
  Select as RacSelect,
  SelectValue as RacSelectValue,
  Slider as RacSlider,
  SliderOutput as RacSliderOutput,
  SliderThumb as RacSliderThumb,
  SliderTrack as RacSliderTrack,
  SubmenuTrigger as RacSubmenuTrigger,
  Switch as RacSwitch,
  Tab as RacTab,
  TabList as RacTabList,
  TabPanel as RacTabPanel,
  Tabs as RacTabs,
  ToggleButton as RacToggleButton,
  Tooltip as RacTooltip,
  TooltipTrigger as RacTooltipTrigger,
} from "react-aria-components";

export interface SpecimenContext {
  /** The locale the LIBRARY renders under. Drives direction, digits, bundles. */
  locale: Locale;
  /** The locale whose WORDS are passed as props. Held at fa-IR for the RTL diff. */
  strings: Locale;
  /** Whether an overlay-bearing specimen is forced open. */
  open: boolean;
}

/** One announced string the wrapper supplies, and what its absence would cost. */
export interface SuppliedString {
  value: string;
  /**
   * `"english"` — upstream has its own default and it is English, so omitting
   *   this prop puts an English word on a Persian page.
   * `"unnamed"` — upstream has no default at all, so omitting it leaves the
   *   control with no accessible name. Different defect, different fix, and
   *   collapsing the two into one count would misstate both.
   */
  absent: "english" | "unnamed";
  /** The exact English upstream would emit, where `absent` is `"english"`. */
  upstreamEnglish?: string;
}

export interface Specimen {
  /** Path of the component file, relative to the repo root. */
  file: string;
  /** Sibling `*.variants.ts`, if the cva definitions were split out. */
  variantsFile?: string;
  /** True when the specimen has a closed-by-default overlay worth forcing. */
  opens: boolean;
  /** Every announced string this specimen passes as a prop, per string locale. */
  supplied: (ctx: SpecimenContext) => SuppliedString[];
  render: (ctx: SpecimenContext) => ReactElement;
}

/** A trivial stand-in glyph. Deliberately not an icon font or a lucide import:
 *  an icon's own markup is not what is being measured, and a 24-line `<svg>`
 *  would dominate every markup diff in the report. */
const Glyph = () => <svg aria-hidden="true" width="16" height="16" />;

const CITIES = "تهران,اصفهان,شیراز".split(",");

export const SPECIMENS: Record<string, Specimen> = {
  button: {
    file: "packages/ui/src/button.tsx",
    variantsFile: "packages/ui/src/button.variants.ts",
    opens: false,
    supplied: () => [{ value: "حذف", absent: "unnamed" }],
    render: () => (
      <>
        <Button>ذخیره</Button>
        <IconButton label="حذف">
          <Glyph />
        </IconButton>
      </>
    ),
  },

  switch: {
    file: "packages/ui/src/switch.tsx",
    opens: false,
    supplied: () => [],
    render: () => <Switch description="هر بامداد ارسال می‌شود">اعلان‌های ایمیلی</Switch>,
  },

  checkbox: {
    file: "packages/ui/src/checkbox.tsx",
    opens: false,
    supplied: () => [{ value: "علاقه‌مندی‌ها", absent: "unnamed" }],
    render: () => (
      <CheckboxGroup label="علاقه‌مندی‌ها" description="هر تعداد که خواستید">
        <Checkbox value="a">کتاب</Checkbox>
        <Checkbox value="b" description="هر هفته یک شماره">
          مجله
        </Checkbox>
      </CheckboxGroup>
    ),
  },

  toggle: {
    file: "packages/ui/src/toggle.tsx",
    variantsFile: "packages/ui/src/toggle.variants.ts",
    opens: false,
    supplied: () => [{ value: "کج", absent: "unnamed" }],
    render: () => (
      <>
        <Toggle defaultSelected>پررنگ</Toggle>
        <IconToggle label="کج">
          <Glyph />
        </IconToggle>
      </>
    ),
  },

  select: {
    file: "packages/ui/src/select.tsx",
    opens: true,
    supplied: () => [
      // RAC's own bundle carries `selectPlaceholder`, and SelectValue falls back
      // to it. Unset, a Persian form renders the literal words "Select an item".
      { value: "یک شهر انتخاب کنید", absent: "english", upstreamEnglish: "Select an item" },
      { value: "شهر", absent: "unnamed" },
    ],
    render: (ctx) => (
      <Select aria-label="شهر" placeholder="یک شهر انتخاب کنید" defaultOpen={ctx.open}>
        <SelectTrigger />
        <SelectPopover>
          {CITIES.map((c) => (
            <SelectItem key={c} id={c}>
              {c}
            </SelectItem>
          ))}
        </SelectPopover>
      </Select>
    ),
  },

  menu: {
    file: "packages/ui/src/menu.tsx",
    opens: true,
    supplied: () => [{ value: "عملیات بیشتر", absent: "unnamed" }],
    render: (ctx) => (
      <MenuTrigger defaultOpen={ctx.open}>
        <IconButton label="عملیات بیشتر">
          <Glyph />
        </IconButton>
        <MenuPopover>
          <Menu>
            <MenuItem id="edit">ویرایش</MenuItem>
            <MenuSeparator />
            <SubmenuTrigger>
              <MenuItem id="share">هم‌رسانی</MenuItem>
              <MenuPopover>
                <Menu>
                  <MenuItem id="mail">ایمیل</MenuItem>
                </Menu>
              </MenuPopover>
            </SubmenuTrigger>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    ),
  },

  combobox: {
    file: "packages/ui/src/combobox.tsx",
    opens: true,
    supplied: () => [
      // `useComboBox` writes both of these unconditionally, from
      // @react-aria/combobox's `buttonLabel` and `listboxLabel`.
      { value: "نمایش پیشنهادها", absent: "english", upstreamEnglish: "Show suggestions" },
      { value: "پیشنهادها", absent: "english", upstreamEnglish: "Suggestions" },
    ],
    render: (ctx) => (
      <ComboBox
        label="شهر"
        showSuggestionsLabel="نمایش پیشنهادها"
        suggestionsLabel="پیشنهادها"
        // Passed, and MEASURED NOT TO WORK. `useComboBoxState` builds its
        // trigger state with `{...props, isOpen: undefined, defaultOpen:
        // undefined}` (react-stately 3.49.0,
        // dist/private/combobox/useComboBoxState.mjs:121), so a ComboBox cannot
        // be opened declaratively at all. The prop stays here so the harness
        // reports the open render as byte-identical to the closed one and the
        // limitation shows up in the data instead of in a comment nobody reads.
        defaultOpen={ctx.open}
      >
        {CITIES.map((c) => (
          <ComboBoxItem key={c} id={c}>
            {c}
          </ComboBoxItem>
        ))}
      </ComboBox>
    ),
  },

  dialog: {
    file: "packages/ui/src/dialog.tsx",
    opens: true,
    supplied: () => [{ value: "بستن", absent: "unnamed" }],
    render: (ctx) => (
      <DialogTrigger defaultOpen={ctx.open}>
        <Button>ویرایش</Button>
        <DialogOverlay>
          <DialogModal size="md">
            <Dialog closeLabel="بستن">
              <DialogHeading>ویرایش پروفایل</DialogHeading>
              <p>نام و نشانی خود را به‌روز کنید.</p>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>
    ),
  },

  popover: {
    file: "packages/ui/src/popover.tsx",
    opens: true,
    supplied: () => [],
    render: (ctx) => (
      <PopoverTrigger defaultOpen={ctx.open}>
        <Button>گزینه‌ها</Button>
        <Popover placement="bottom start">
          <p>محتوای شناور</p>
        </Popover>
      </PopoverTrigger>
    ),
  },

  tooltip: {
    file: "packages/ui/src/tooltip.tsx",
    opens: true,
    supplied: () => [{ value: "حذف", absent: "unnamed" }],
    render: (ctx) => (
      <TooltipTrigger isOpen={ctx.open || undefined}>
        <IconButton label="حذف">
          <Glyph />
        </IconButton>
        <Tooltip>حذف این ردیف</Tooltip>
      </TooltipTrigger>
    ),
  },

  tabs: {
    file: "packages/ui/src/tabs.tsx",
    opens: false,
    supplied: () => [{ value: "بخش‌های حساب", absent: "unnamed" }],
    render: () => (
      <Tabs>
        <TabList label="بخش‌های حساب">
          <Tab id="profile">پروفایل</Tab>
          <Tab id="billing">صورت‌حساب</Tab>
        </TabList>
        <TabPanel id="profile">محتوای پروفایل</TabPanel>
        <TabPanel id="billing">محتوای صورت‌حساب</TabPanel>
      </Tabs>
    ),
  },

  slider: {
    file: "packages/ui/src/slider.tsx",
    opens: false,
    supplied: () => [{ value: "بودجه", absent: "unnamed" }],
    // `locale` here is `ctx.locale`, NOT `ctx.strings`, and it is the one
    // specimen where that matters: Slider mounts an `I18nProvider` of its own
    // from this prop, so it OVERRIDES whatever locale the harness wrapped it
    // in. Passing the string locale would pin the slider to `fa-IR` in both
    // directions and the RTL pass would measure nothing at all.
    render: (ctx) => (
      <Slider label="بودجه" locale={ctx.locale} minValue={0} maxValue={100} defaultValue={40} />
    ),
  },

  "number-field": {
    file: "packages/ui/src/number-field.tsx",
    opens: false,
    supplied: (ctx) => {
      const s = stringsFor(ctx.strings);
      return [
        { value: "تعداد", absent: "unnamed" },
        // RAC interpolates the field's own label into an English frame, which is
        // why `strings.ts` types these as functions of the label rather than as
        // constants — a Persian noun dropped into English word order is still
        // English.
        { value: s.numberField.decrease("تعداد"), absent: "english", upstreamEnglish: "Decrease تعداد" },
        { value: s.numberField.increase("تعداد"), absent: "english", upstreamEnglish: "Increase تعداد" },
        { value: s.numberField.roleDescription, absent: "english", upstreamEnglish: "Number field" },
      ];
    },
    render: (ctx) => {
      const s = stringsFor(ctx.strings);
      return (
        <NumberField
          label="تعداد"
          decrementLabel={s.numberField.decrease("تعداد")}
          incrementLabel={s.numberField.increase("تعداد")}
          roleDescription={s.numberField.roleDescription}
          defaultValue={40}
          minValue={0}
          maxValue={100}
        />
      );
    },
  },
};

/**
 * Wraps a specimen in the locale provider the library needs.
 *
 * `LumoProvider` rather than a bare `I18nProvider` on purpose: it is what a
 * consumer actually mounts, and it carries `FORMAT_LOCALE` — for `fa-IR` that
 * is exactly `fa-IR-u-ca-persian-nu-arabext`. Measuring a configuration nobody
 * ships would measure the wrong library.
 */
export function mount(name: string, ctx: SpecimenContext): ReactElement {
  const specimen = SPECIMENS[name];
  if (!specimen) throw new Error(`No specimen named ${JSON.stringify(name)}`);
  return <LumoProvider locale={ctx.locale}>{specimen.render(ctx)}</LumoProvider>;
}

export const SPECIMEN_META = Object.fromEntries(
  Object.entries(SPECIMENS).map(([name, s]) => [
    name,
    { file: s.file, variantsFile: s.variantsFile ?? null, opens: s.opens },
  ]),
);

export function suppliedStrings(name: string, ctx: SpecimenContext): SuppliedString[] {
  const specimen = SPECIMENS[name];
  if (!specimen) throw new Error(`No specimen named ${JSON.stringify(name)}`);
  return specimen.supplied(ctx);
}

/**
 * THE CONTROL ARM — the same thirteen, composed straight out of the library.
 *
 * No required prop, no `aria-label`, no re-derived `textValue`, no second
 * `I18nProvider`, no logical-utility class. Only the root `LumoProvider`, so
 * that this measures the LIBRARY under a correct Persian locale rather than the
 * separate and much louder defect of mounting no provider at all.
 *
 * The visible Persian content is kept identical to the wrapped arm so that a
 * diff of the two leak sets is a diff of CORRECTIONS, not of copy.
 */
export const BARE: Record<string, (ctx: SpecimenContext) => ReactElement> = {
  button: () => (
    <>
      <RacButton>ذخیره</RacButton>
      <RacButton>
        <Glyph />
      </RacButton>
    </>
  ),

  switch: () => (
    <RacSwitch>
      <span />
      اعلان‌های ایمیلی
    </RacSwitch>
  ),

  checkbox: () => (
    <RacCheckboxGroup>
      <RacCheckboxField>
        <RacCheckboxButton>کتاب</RacCheckboxButton>
      </RacCheckboxField>
      <RacCheckboxField>
        <RacCheckboxButton>مجله</RacCheckboxButton>
      </RacCheckboxField>
    </RacCheckboxGroup>
  ),

  toggle: () => (
    <>
      <RacToggleButton defaultSelected>پررنگ</RacToggleButton>
      <RacToggleButton>
        <Glyph />
      </RacToggleButton>
    </>
  ),

  select: (ctx) => (
    <RacSelect defaultOpen={ctx.open}>
      <RacButton>
        <RacSelectValue />
      </RacButton>
      <RacPopover>
        <RacListBox>
          {CITIES.map((c) => (
            <RacListBoxItem key={c} id={c}>
              {c}
            </RacListBoxItem>
          ))}
        </RacListBox>
      </RacPopover>
    </RacSelect>
  ),

  menu: (ctx) => (
    <RacMenuTrigger defaultOpen={ctx.open}>
      <RacButton>
        <Glyph />
      </RacButton>
      <RacPopover>
        <RacMenu>
          <RacMenuItem id="edit">ویرایش</RacMenuItem>
          <RacSubmenuTrigger>
            <RacMenuItem id="share">هم‌رسانی</RacMenuItem>
            <RacPopover>
              <RacMenu>
                <RacMenuItem id="mail">ایمیل</RacMenuItem>
              </RacMenu>
            </RacPopover>
          </RacSubmenuTrigger>
        </RacMenu>
      </RacPopover>
    </RacMenuTrigger>
  ),

  combobox: (ctx) => (
    <RacComboBox defaultOpen={ctx.open}>
      <RacLabel>شهر</RacLabel>
      <RacGroup>
        <RacInput />
        <RacButton>
          <Glyph />
        </RacButton>
      </RacGroup>
      <RacPopover>
        <RacListBox>
          {CITIES.map((c) => (
            <RacListBoxItem key={c} id={c}>
              {c}
            </RacListBoxItem>
          ))}
        </RacListBox>
      </RacPopover>
    </RacComboBox>
  ),

  dialog: (ctx) => (
    <RacDialogTrigger defaultOpen={ctx.open}>
      <RacButton>ویرایش</RacButton>
      <RacModalOverlay>
        <RacModal>
          <RacDialog>
            <RacHeading slot="title">ویرایش پروفایل</RacHeading>
            <p>نام و نشانی خود را به‌روز کنید.</p>
          </RacDialog>
        </RacModal>
      </RacModalOverlay>
    </RacDialogTrigger>
  ),

  popover: (ctx) => (
    <RacDialogTrigger defaultOpen={ctx.open}>
      <RacButton>گزینه‌ها</RacButton>
      <RacPopover placement="bottom start">
        <p>محتوای شناور</p>
      </RacPopover>
    </RacDialogTrigger>
  ),

  tooltip: (ctx) => (
    <RacTooltipTrigger isOpen={ctx.open || undefined}>
      <RacButton>
        <Glyph />
      </RacButton>
      <RacTooltip>حذف این ردیف</RacTooltip>
    </RacTooltipTrigger>
  ),

  tabs: () => (
    <RacTabs>
      <RacTabList>
        <RacTab id="profile">پروفایل</RacTab>
        <RacTab id="billing">صورت‌حساب</RacTab>
      </RacTabList>
      <RacTabPanel id="profile">محتوای پروفایل</RacTabPanel>
      <RacTabPanel id="billing">محتوای صورت‌حساب</RacTabPanel>
    </RacTabs>
  ),

  slider: () => (
    <RacSlider minValue={0} maxValue={100} defaultValue={40}>
      <RacSliderOutput />
      <RacSliderTrack>
        <RacSliderThumb />
      </RacSliderTrack>
    </RacSlider>
  ),

  "number-field": () => (
    <RacNumberField defaultValue={40} minValue={0} maxValue={100}>
      <RacLabel>تعداد</RacLabel>
      <RacGroup>
        <RacInput />
        <RacButton slot="increment">
          <Glyph />
        </RacButton>
        <RacButton slot="decrement">
          <Glyph />
        </RacButton>
      </RacGroup>
    </RacNumberField>
  ),
};

export function mountBare(name: string, ctx: SpecimenContext): ReactElement {
  const bare = BARE[name];
  if (!bare) throw new Error(`No bare control for ${JSON.stringify(name)}`);
  return <LumoProvider locale={ctx.locale}>{bare(ctx)}</LumoProvider>;
}

/**
 * THE POISON SPECIMEN, and it is not decoration.
 *
 * Three of the five gate rules scored zero on all thirteen components AND on the
 * bare library — which is either a very good result or a pipeline that cannot
 * see a defect if one is in front of it. CONTRIBUTING.md settles which by
 * requiring every rule to have a fixture that fails it; this is that fixture for
 * the harness rather than for the gate.
 *
 * It uses no library at all, deliberately: it must fail because the markup is
 * wrong, not because a component is. `measure.mjs` grades it under a fa-IR path
 * with a mismatched `<html lang="en" dir="ltr">` and ABORTS unless every rule
 * fires. If a refactor ever stops the harness from seeing Latin digits, the run
 * stops instead of reporting a clean sweep.
 */
export function Poison(): ReactElement {
  return (
    <div>
      {/* no-latin-digits, and no-latin-aria's visible sibling */}
      <p>Total: 42 items</p>
      {/* no-latin-aria */}
      <button type="button" aria-label="Delete row" />
      {/* named-controls */}
      <button type="button" />
      {/* resolved-idrefs */}
      <span role="checkbox" aria-labelledby="no-such-id-anywhere" />
    </div>
  );
}
