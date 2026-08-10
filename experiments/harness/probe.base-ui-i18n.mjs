#!/usr/bin/env node
/**
 * REACHABILITY PROBE for Base UI 1.7.0's announced strings.
 *
 *   node experiments/harness/probe.base-ui-i18n.mjs
 *
 * Prints JSON on stdout and leaves the working tree untouched.
 * `experiments/measurements/base-ui-i18n.json` is the recorded output of this
 * file plus the static dist census beside it.
 *
 * ── WHY IT IS SHAPED LIKE THIS ──────────────────────────────────────────────
 *
 * **It answers one question measure.mjs cannot answer yet.** measure.mjs grades
 * Lumo's thirteen wrapped components and needs a `specimens.<impl>.tsx` that
 * does not exist for Base UI. This probe asks something narrower that needs no
 * wrappers — for each English literal the dist census found, does a PROP reach
 * it? — so it composes the raw library and greps the served bytes.
 *
 * **It re-execs itself from inside `packages/ui/node_modules`.** ESM resolves
 * bare specifiers from the FILE's location, not the cwd, so a copy living in
 * `experiments/` cannot see `react` or `@base-ui/react` at all — and a copy
 * resolving from the repo root would measure whatever the root hoisted rather
 * than what `packages/ui` depends on. Same reasoning and same directory as
 * measure.mjs's temp entries. The copy is deleted on exit.
 *
 * **It is plain `React.createElement`, not JSX.** No transform, no bundler, no
 * second thing that could be the reason a string did or did not appear.
 *
 * **LIMITATION, stated the way measure.mjs states its own.** This is the SSR
 * tier, so a portalled subtree renders null and its strings are not in the
 * output. That is why the string INVENTORY is a static census of the dist
 * source — which portals cannot hide from — and this probe only decides
 * REACHABILITY for carriers that reach the server. Combobox's two dismiss
 * sentinels are the case that matters: the one rendered by `Combobox.Input` is
 * not portalled and does appear below, so the verdict on it is observed rather
 * than argued.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// The child is told it is the child by the environment, not by comparing paths:
// the relocated copy recomputes every path relative to ITSELF, so a path
// comparison is true in the parent and true again in the child, and the probe
// re-execs forever.
if (!process.env.LUMO_PROBE_RELOCATED) {
  const SELF = fileURLToPath(import.meta.url);
  const HOST_DIR = path.resolve(path.dirname(SELF), '../../packages/ui/node_modules');
  const RELOCATED = path.join(HOST_DIR, '.probe-base-ui-i18n.mjs');
  if (!fs.existsSync(HOST_DIR)) {
    process.stderr.write(`${HOST_DIR} does not exist — run \`pnpm install\` first.\n`);
    process.exit(1);
  }
  fs.copyFileSync(SELF, RELOCATED);
  // Not `try/finally`: `process.exit` in the try block terminates before the
  // finally runs, and the copy is left behind in the working tree.
  const run = spawnSync(process.execPath, [RELOCATED], {
    stdio: 'inherit',
    env: { ...process.env, LUMO_PROBE_RELOCATED: '1' },
  });
  fs.rmSync(RELOCATED, { force: true });
  process.exit(run.status ?? 1);
}

const React = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
const { NumberField } = await import('@base-ui/react/number-field');
const { Progress } = await import('@base-ui/react/progress');
const { Meter } = await import('@base-ui/react/meter');
const { Slider } = await import('@base-ui/react/slider');
const { Toast } = await import('@base-ui/react/toast');
const { Combobox } = await import('@base-ui/react/combobox');
const { Autocomplete } = await import('@base-ui/react/autocomplete');
const { Select } = await import('@base-ui/react/select');
const { DirectionProvider } = await import('@base-ui/react/direction-provider');

const h = React.createElement;

/** The formatter tag Lumo uses. Base UI takes it per-component; there is no provider. */
const FA = 'fa-IR-u-nu-arabext';

/** Every English literal the static dist census turned up in a spoken position. */
const ENGLISH = [
  'Number field',
  'Increase',
  'Decrease',
  'indeterminate progress',
  'start range',
  'end range',
  'Notifications',
  'Dismiss',
];

const arms = [];
function arm(name, node) {
  let html = '';
  let error = null;
  try {
    html = renderToStaticMarkup(node);
  } catch (e) {
    error = String(e?.message ?? e).slice(0, 300);
  }
  arms.push({ name, html, error, english: error ? null : ENGLISH.filter((s) => html.includes(s)) });
}

// ── NumberField: 'Number field' + 'Increase' + 'Decrease' ────────────────────
const numberField = (o = {}) =>
  h(
    NumberField.Root,
    { defaultValue: 1234, locale: FA },
    h(
      NumberField.Group,
      null,
      h(NumberField.Decrement, o.dec ?? null, '-'),
      h(NumberField.Input, o.input ?? null),
      h(NumberField.Increment, o.inc ?? null, '+'),
    ),
  );
arm('numberfield.bare', numberField());
arm(
  'numberfield.props',
  numberField({
    input: { 'aria-roledescription': 'فیلد عددی', 'aria-label': 'مقدار' },
    inc: { 'aria-label': 'افزایش' },
    dec: { 'aria-label': 'کاهش' },
  }),
);

// ── Progress: 'indeterminate progress' ───────────────────────────────────────
const progress = (p = {}) =>
  h(Progress.Root, { value: null, locale: FA, ...p }, h(Progress.Track, null, h(Progress.Indicator)));
arm('progress.bare', progress());
arm('progress.props.getAriaValueText', progress({ getAriaValueText: () => 'پیشرفت نامعین' }));
arm('progress.props.attr', progress({ 'aria-valuetext': 'پیشرفت نامعین' }));

// ── Slider: '<n> start range' / '<n> end range' — RANGE sliders only ─────────
const slider = (o = {}) =>
  h(
    Slider.Root,
    { defaultValue: [20, 60], locale: FA, ...(o.root ?? {}) },
    h(
      Slider.Control,
      null,
      h(
        Slider.Track,
        null,
        h(Slider.Thumb, { index: 0, ...(o.thumb0 ?? {}) }),
        h(Slider.Thumb, { index: 1, ...(o.thumb1 ?? {}) }),
      ),
    ),
  );
arm('slider.range.bare', slider());
// The trap: `getAriaValueText` is a Thumb prop. On Root it is not a prop at all —
// React forwards it to the DOM as an unknown attribute and the English survives.
arm('slider.range.props.on-root-WRONG', slider({ root: { getAriaValueText: (f) => `${f} آغاز بازه` } }));
arm(
  'slider.range.props.on-thumb',
  slider({
    thumb0: { getAriaValueText: (f) => `${f} آغاز بازه` },
    thumb1: { getAriaValueText: (f) => `${f} پایان بازه` },
  }),
);
arm(
  'slider.range.props.attr',
  slider({ thumb0: { 'aria-valuetext': 'بیست آغاز بازه' }, thumb1: { 'aria-valuetext': 'شصت پایان بازه' } }),
);
arm(
  'slider.single.bare',
  h(Slider.Root, { defaultValue: 30, locale: FA }, h(Slider.Control, null, h(Slider.Track, null, h(Slider.Thumb)))),
);

// ── Toast: 'Notifications' ───────────────────────────────────────────────────
arm('toast.bare', h(Toast.Provider, null, h(Toast.Viewport)));
arm('toast.props', h(Toast.Provider, null, h(Toast.Viewport, { 'aria-label': 'اعلان‌ها' })));

// ── Meter: control — a value-bearing component with NO English default ───────
arm('meter.bare', h(Meter.Root, { value: 40, locale: FA }, h(Meter.Track, null, h(Meter.Indicator))));

// ── Combobox / Autocomplete: 'Dismiss' — the unreachable one ─────────────────
const combobox = (rootExtra = {}, inputExtra = {}) =>
  h(
    Combobox.Root,
    { items: ['الف', 'ب'], defaultOpen: true, ...rootExtra },
    h(Combobox.Input, inputExtra),
    h(
      Combobox.Portal,
      null,
      h(
        Combobox.Positioner,
        null,
        h(Combobox.Popup, null, h(Combobox.List, null, h(Combobox.Item, { value: 'الف' }, 'الف'))),
      ),
    ),
  );
arm('combobox.open.modal.bare', combobox({ modal: true }));
arm('combobox.open.nonmodal.bare', combobox({ modal: false }));
// The nearest prop a consumer could plausibly aim at it. Its parent is neither.
arm('combobox.open.modal.props', combobox({ modal: true }, { 'aria-label': 'جستجو' }));
arm(
  'autocomplete.open.modal.bare',
  h(
    Autocomplete.Root,
    { items: ['الف'], defaultOpen: true, modal: true },
    h(Autocomplete.Input),
    h(
      Autocomplete.Portal,
      null,
      h(
        Autocomplete.Positioner,
        null,
        h(Autocomplete.Popup, null, h(Autocomplete.List, null, h(Autocomplete.Item, { value: 'الف' }, 'الف'))),
      ),
    ),
  ),
);
// Select is the control: it does NOT compose the combobox dismiss sentinels.
arm(
  'select.open.modal.bare',
  h(
    Select.Root,
    { items: ['الف'], defaultOpen: true, modal: true },
    h(Select.Trigger, null, h(Select.Value)),
    h(Select.Portal, null, h(Select.Positioner, null, h(Select.Popup, null, h(Select.Item, { value: 'الف' }, 'الف')))),
  ),
);

// ── No `locale` prop: what the server emits with nothing supplied ────────────
arm('numberfield.no-locale', h(NumberField.Root, { defaultValue: 1234 }, h(NumberField.Input)));
arm('progress.no-locale', h(Progress.Root, { value: 42 }, h(Progress.Track, null, h(Progress.Indicator))));
arm(
  'slider.range.no-locale',
  h(
    Slider.Root,
    { defaultValue: [20, 60] },
    h(Slider.Control, null, h(Slider.Track, null, h(Slider.Thumb, { index: 0 }), h(Slider.Thumb, { index: 1 }))),
  ),
);

// ── Direction: is it CSS-only, or does it change the served bytes? ───────────
const singleSlider = () =>
  h(Slider.Root, { defaultValue: 30, locale: FA }, h(Slider.Control, null, h(Slider.Track, null, h(Slider.Thumb))));
arm('direction.absent', singleSlider());
arm('direction.provider-rtl', h(DirectionProvider, { direction: 'rtl' }, singleSlider()));

const out = {
  probe: 'experiments/harness/probe.base-ui-i18n.mjs',
  node: process.version,
  react: React.version,
  icu_default_locale: new Intl.NumberFormat().resolvedOptions().locale,
  english_literals_searched: ENGLISH,
  arms: arms.map((a) => ({
    name: a.name,
    error: a.error,
    bytes: a.html.length,
    english_found: a.english,
    // `aria-valuetext` only. NOT every `value=`: a `<input type="range">` and
    // NumberField's hidden `<input type="number">` are REQUIRED by HTML to
    // carry a plain-ASCII number, so counting those would report a defect on
    // correct markup. This is an indicator for the `no-locale` arms; the gate's
    // own `no-latin-digits` rule is the authority and measure.mjs runs it.
    latin_digits_in_aria_valuetext: [...a.html.matchAll(/aria-valuetext="([^"]*)"/g)].filter((m) =>
      /[0-9]/.test(m[1]),
    ).length,
    html: a.html,
  })),
};
process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
