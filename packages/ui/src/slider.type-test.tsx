/**
 * Compile-time pin for `Slider`: `label` and `locale` are required, the slider
 * owns its name (`aria-label` rejected), and it takes no children. An unused
 * `@ts-expect-error` fails `tsc`.
 */
import { Slider, type SliderProps } from "./slider.tsx";

// @ts-expect-error label is required: it names the thumb
void <Slider locale="fa-IR" />;
// @ts-expect-error locale is required: it formats the value
void <Slider label="حجم" />;
// @ts-expect-error aria-label is owned: `label` is the one name
const named: SliderProps = { label: "حجم", locale: "fa-IR", "aria-label": "حجم" };
void named;
// @ts-expect-error the slider renders its own track; children are not a prop
void <Slider label="حجم" locale="fa-IR">متن</Slider>;

void <Slider label="حجم" locale="fa-IR" />;
void <Slider label="حجم" locale="fa-IR" defaultValue={30} minValue={0} maxValue={100} step={10} hideValue onChangeEnd={() => undefined} />;
