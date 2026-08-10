/**
 * THE SPECIMENS — one per measured component, for the BASE UI tree.
 *
 * Written against the contract `specimens.react-aria.tsx` states, and
 * `measure.mjs` is run UNMODIFIED against both. The wrapped arm below is
 * byte-identical to the React Aria file's wrapped arm — same components, same
 * props, same Persian copy — because the experiment's whole validity rests on
 * the public API not moving. Every difference in this file is in
 *
 *   1. `supplied`, because what a MISSING required prop costs is different under
 *      Base UI and lying about that would corrupt the one counterfactual the
 *      harness reports; and
 *   2. `BARE`, which must compose the OTHER library.
 *
 * ── THE `absent` VOCABULARY GAINS A THIRD VALUE, AND IT HAD TO ──────────────
 *
 * The React Aria file declares `absent: "english" | "unnamed"` and its header
 * explains why the two may not be collapsed: a missing `placeholder` rendered
 * ENGLISH, a missing `TabList` label rendered NOTHING. Base UI produces a THIRD
 * outcome that is neither, and it is the outcome the Select's required
 * `placeholder` now guards against: an EMPTY visible control — no English word
 * for a gate to catch, and a named control all the same, because the trigger
 * still has its chevron and its own text content.
 *
 * Recording that as `"english"` would inflate the headline English-leak
 * counterfactual; recording it as `"unnamed"` would inflate the unnamed-control
 * one. So it is recorded as `"empty"`. `measure.mjs` counts `=== "english"` and
 * `=== "unnamed"` and needs no change: a third value simply falls into neither
 * bucket and survives in the per-record data as `absent_would_be: "empty"`.
 *
 * ── WHAT MOVED, PER COMPONENT, IN `supplied` ────────────────────────────────
 *
 * Base UI ships NO string bundle for any of the thirteen — grepped, not
 * assumed; see experiments/measurements/rebuild-collections.json. So almost
 * every `absent: "english"` in the React Aria file becomes `absent: "unnamed"`
 * here: the same prop is still required, and the defect it prevents changed
 * from a wrong language to no name at all.
 *
 *   select.placeholder        english "Select an item"   → empty
 *   combobox.showSuggestions  english "Show suggestions" → unnamed
 *   combobox.suggestions      english "Suggestions"      → unnamed
 *   number-field ×3           english                    → english (unchanged;
 *                             Base UI's are bare verbs, "Increase"/"Decrease"/
 *                             "Number field", from
 *                             useNumberFieldStepperButton.mjs and
 *                             NumberFieldInput.mjs)
 *
 * ── ONE SPECIMEN CANNOT REACH ITS OPEN STATE, FOR A NEW REASON ──────────────
 *
 * `combobox` still passes `defaultOpen={ctx.open}` and the render is still
 * byte-identical to the closed one, but the cause moved from the library to
 * Lumo: react-stately nulled the prop inside `useComboBoxState`, whereas Base
 * UI's `Combobox.Root` HAS a working `defaultOpen` (AriaCombobox.d.mts:46) and
 * Lumo's rebuilt `ComboBoxProps` does not declare one, so the prop is never
 * destructured and never forwarded. The prop is left in place so
 * `open_state_reached: false` still lands in the data rather than in a comment.
 * The BARE arm below DOES open it, which is what makes the difference visible.
 */

import type { ReactElement } from "react";
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
 * THE BARE ARM'S IMPORTS ARE RELATIVE, AND THE REASON IS RESOLUTION, NOT TASTE.
 *
 * `specimens.react-aria.tsx` writes `from "react-aria-components"` and relies on
 * ONE alias `measure.mjs` declares for the runtime bundle. `measure.mjs` is run
 * here UNMODIFIED, so no second alias exists and a bare `@base-ui/react/button`
 * would not resolve from `experiments/harness` — the repo root's `node_modules`
 * holds only `@types` and `typescript`.
 *
 * These paths point INTO `packages/ui/node_modules`, at exactly the files the
 * `exports` map's `import` condition selects (`"./button": "./button/index.mjs"`).
 * That is the same realpath `packages/ui/src/button.tsx` reaches through the
 * bare specifier, so the wrapped arm and the bare arm share one instance of the
 * library rather than bundling two.
 */
import { Button as BaseButton } from "../../packages/ui/node_modules/@base-ui/react/button/index.mjs";
import { Toggle as BaseToggle } from "../../packages/ui/node_modules/@base-ui/react/toggle/index.mjs";
import { Switch as BaseSwitch } from "../../packages/ui/node_modules/@base-ui/react/switch/index.mjs";
import { Checkbox as BaseCheckbox } from "../../packages/ui/node_modules/@base-ui/react/checkbox/index.mjs";
import { CheckboxGroup as BaseCheckboxGroup } from "../../packages/ui/node_modules/@base-ui/react/checkbox-group/index.mjs";
import { Field as BaseField } from "../../packages/ui/node_modules/@base-ui/react/field/index.mjs";
import { Select as BaseSelect } from "../../packages/ui/node_modules/@base-ui/react/select/index.mjs";
import { Menu as BaseMenu } from "../../packages/ui/node_modules/@base-ui/react/menu/index.mjs";
import { Combobox as BaseCombobox } from "../../packages/ui/node_modules/@base-ui/react/combobox/index.mjs";
import { Dialog as BaseDialog } from "../../packages/ui/node_modules/@base-ui/react/dialog/index.mjs";
import { Popover as BasePopover } from "../../packages/ui/node_modules/@base-ui/react/popover/index.mjs";
import { Tooltip as BaseTooltip } from "../../packages/ui/node_modules/@base-ui/react/tooltip/index.mjs";
import { Tabs as BaseTabs } from "../../packages/ui/node_modules/@base-ui/react/tabs/index.mjs";
import { Slider as BaseSlider } from "../../packages/ui/node_modules/@base-ui/react/slider/index.mjs";
import { NumberField as BaseNumberField } from "../../packages/ui/node_modules/@base-ui/react/number-field/index.mjs";

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
   * `"english"` — upstream has its own default and it is English.
   * `"unnamed"` — upstream has no default at all, so omitting it leaves the
   *   control with no accessible name.
   * `"empty"`   — BASE UI ONLY. Upstream renders nothing: no English to catch
   *   and no unnamed control either, because the element is still named by its
   *   own content. See the file header.
   */
  absent: "english" | "unnamed" | "empty";
  /** The exact English upstream would emit, where `absent` is `"english"`. */
  upstreamEnglish?: string;
}

export interface Specimen {
  file: string;
  variantsFile?: string;
  opens: boolean;
  supplied: (ctx: SpecimenContext) => SuppliedString[];
  render: (ctx: SpecimenContext) => ReactElement;
}

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
      // CHANGED FROM THE REACT ARIA FILE. RAC's `selectPlaceholder` bundle string
      // put "Select an item" in the first byte of a Persian page. Base UI ships
      // no bundle: `<Select.Value>` with no placeholder and no value renders
      // EMPTY. Neither English nor unnamed — see the header.
      { value: "یک شهر انتخاب کنید", absent: "empty" },
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
      // CHANGED FROM THE REACT ARIA FILE. `useComboBox` wrote both of these
      // unconditionally in English; Base UI writes NEITHER. The trigger is an
      // icon-only <button> with no name, and the list is an unnamed listbox.
      { value: "نمایش پیشنهادها", absent: "unnamed" },
      { value: "پیشنهادها", absent: "unnamed" },
    ],
    render: (ctx) => (
      <ComboBox
        label="شهر"
        showSuggestionsLabel="نمایش پیشنهادها"
        suggestionsLabel="پیشنهادها"
        // Passed, and MEASURED NOT TO WORK — for a NEW reason. See the header:
        // Base UI's Combobox.Root has a working `defaultOpen`; Lumo's rebuilt
        // `ComboBoxProps` does not declare one, so it is never forwarded.
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
    // `locale` is `ctx.locale`, NOT `ctx.strings`, for the same reason as in the
    // React Aria file — and it now drives TWO things rather than one: Base UI's
    // per-component `locale` prop AND the `DirectionProvider` slider.tsx mounts
    // from `direction(locale)`.
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
        // UNCHANGED IN KIND, CHANGED IN CONTENT. RAC interpolated the field's
        // label into an English frame ("Decrease تعداد"); Base UI's stepper
        // labels are bare verbs with no interpolation
        // (useNumberFieldStepperButton.mjs:104), so the English that would
        // appear is shorter. The required props are now over-specified rather
        // than wrong.
        { value: s.numberField.decrease("تعداد"), absent: "english", upstreamEnglish: "Decrease" },
        { value: s.numberField.increase("تعداد"), absent: "english", upstreamEnglish: "Increase" },
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
 * Wraps a specimen in the locale provider a consumer actually mounts.
 *
 * `LumoProvider` is UNCHANGED by this experiment and still wraps React Aria's
 * `I18nProvider` — which is itself a finding rather than an oversight: Base UI
 * has no locale context at all, so the provider every Lumo application already
 * mounts reaches none of the thirteen components below. It is kept because
 * measuring a configuration nobody ships would measure the wrong library.
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
 * THE CONTROL ARM — the same thirteen, composed straight out of BASE UI.
 *
 * No required prop, no `aria-label`, no re-derived label, no `DirectionProvider`,
 * no logical-utility class. Only the root `LumoProvider`, kept identical to the
 * React Aria arm so the two controls differ in the library and in nothing else.
 *
 * The compositions are Base UI's OWN, not a transliteration of React Aria's:
 * Portal → Positioner → Popup for every overlay, `value` rather than `id` on
 * collection items, `defaultPressed` rather than `defaultSelected`. Measuring a
 * library through the other library's vocabulary would measure the translation.
 *
 * Visible Persian content is held identical to the wrapped arm so a diff of the
 * two leak sets is a diff of CORRECTIONS rather than of copy.
 */
export const BARE: Record<string, (ctx: SpecimenContext) => ReactElement> = {
  button: () => (
    <>
      <BaseButton>ذخیره</BaseButton>
      <BaseButton>
        <Glyph />
      </BaseButton>
    </>
  ),

  switch: () => (
    <BaseField.Root>
      <BaseField.Label>
        <BaseSwitch.Root>
          <BaseSwitch.Thumb />
        </BaseSwitch.Root>
        اعلان‌های ایمیلی
      </BaseField.Label>
    </BaseField.Root>
  ),

  checkbox: () => (
    <BaseCheckboxGroup>
      <BaseField.Root>
        <BaseField.Label>
          <BaseCheckbox.Root />
          کتاب
        </BaseField.Label>
      </BaseField.Root>
      <BaseField.Root>
        <BaseField.Label>
          <BaseCheckbox.Root />
          مجله
        </BaseField.Label>
      </BaseField.Root>
    </BaseCheckboxGroup>
  ),

  toggle: () => (
    <>
      <BaseToggle defaultPressed>پررنگ</BaseToggle>
      <BaseToggle>
        <Glyph />
      </BaseToggle>
    </>
  ),

  select: (ctx) => (
    <BaseSelect.Root defaultOpen={ctx.open}>
      <BaseSelect.Trigger>
        <BaseSelect.Value />
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner>
          <BaseSelect.Popup>
            <BaseSelect.List>
              {CITIES.map((c) => (
                <BaseSelect.Item key={c} value={c}>
                  <BaseSelect.ItemText>{c}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  ),

  menu: (ctx) => (
    <BaseMenu.Root defaultOpen={ctx.open}>
      <BaseMenu.Trigger>
        <Glyph />
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner>
          <BaseMenu.Popup>
            <BaseMenu.Item>ویرایش</BaseMenu.Item>
            <BaseMenu.Separator />
            <BaseMenu.SubmenuRoot>
              <BaseMenu.SubmenuTrigger>هم‌رسانی</BaseMenu.SubmenuTrigger>
              <BaseMenu.Portal>
                <BaseMenu.Positioner>
                  <BaseMenu.Popup>
                    <BaseMenu.Item>ایمیل</BaseMenu.Item>
                  </BaseMenu.Popup>
                </BaseMenu.Positioner>
              </BaseMenu.Portal>
            </BaseMenu.SubmenuRoot>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  ),

  combobox: (ctx) => (
    // Opened here and NOT in the wrapped arm, which is the point: the prop works
    // on the library and Lumo's rebuilt API no longer exposes it.
    <BaseCombobox.Root defaultOpen={ctx.open}>
      <BaseCombobox.Label>شهر</BaseCombobox.Label>
      <BaseCombobox.Input />
      <BaseCombobox.Trigger>
        <Glyph />
      </BaseCombobox.Trigger>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner>
          <BaseCombobox.Popup>
            <BaseCombobox.List>
              {CITIES.map((c) => (
                <BaseCombobox.Item key={c} value={c}>
                  {c}
                </BaseCombobox.Item>
              ))}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  ),

  dialog: (ctx) => (
    <BaseDialog.Root defaultOpen={ctx.open}>
      <BaseDialog.Trigger>ویرایش</BaseDialog.Trigger>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop />
        <BaseDialog.Popup>
          <BaseDialog.Title>ویرایش پروفایل</BaseDialog.Title>
          <p>نام و نشانی خود را به‌روز کنید.</p>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  ),

  popover: (ctx) => (
    <BasePopover.Root defaultOpen={ctx.open}>
      <BasePopover.Trigger>گزینه‌ها</BasePopover.Trigger>
      <BasePopover.Portal>
        <BasePopover.Positioner side="bottom" align="start">
          <BasePopover.Popup>
            <p>محتوای شناور</p>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  ),

  tooltip: (ctx) => (
    <BaseTooltip.Root defaultOpen={ctx.open || undefined}>
      <BaseTooltip.Trigger>
        <Glyph />
      </BaseTooltip.Trigger>
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner>
          <BaseTooltip.Popup>حذف این ردیف</BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  ),

  tabs: () => (
    <BaseTabs.Root>
      <BaseTabs.List>
        <BaseTabs.Tab value="profile">پروفایل</BaseTabs.Tab>
        <BaseTabs.Tab value="billing">صورت‌حساب</BaseTabs.Tab>
      </BaseTabs.List>
      <BaseTabs.Panel value="profile">محتوای پروفایل</BaseTabs.Panel>
      <BaseTabs.Panel value="billing">محتوای صورت‌حساب</BaseTabs.Panel>
    </BaseTabs.Root>
  ),

  slider: () => (
    <BaseSlider.Root min={0} max={100} defaultValue={40}>
      <BaseSlider.Value />
      <BaseSlider.Control>
        <BaseSlider.Track>
          <BaseSlider.Indicator />
          <BaseSlider.Thumb />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  ),

  "number-field": () => (
    <BaseField.Root>
      <BaseField.Label>تعداد</BaseField.Label>
      <BaseNumberField.Root defaultValue={40} min={0} max={100}>
        <BaseNumberField.Group>
          <BaseNumberField.Input />
          <BaseNumberField.Increment>
            <Glyph />
          </BaseNumberField.Increment>
          <BaseNumberField.Decrement>
            <Glyph />
          </BaseNumberField.Decrement>
        </BaseNumberField.Group>
      </BaseNumberField.Root>
    </BaseField.Root>
  ),
};

export function mountBare(name: string, ctx: SpecimenContext): ReactElement {
  const bare = BARE[name];
  if (!bare) throw new Error(`No bare control for ${JSON.stringify(name)}`);
  return <LumoProvider locale={ctx.locale}>{bare(ctx)}</LumoProvider>;
}

/**
 * THE POISON SPECIMEN — byte-identical to the React Aria file's, deliberately.
 *
 * It uses no library at all, so there is nothing about it that could differ
 * between the two impls, and keeping it identical is what makes the two runs'
 * `self_check.poison_specimen` blocks directly comparable. If the harness ever
 * stops seeing a planted defect on one side but not the other, that difference
 * is in the harness and this file proves it.
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
