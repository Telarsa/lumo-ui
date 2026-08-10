import { appendFileSync } from "node:fs";
import { describe, it } from "vitest";
import { act, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Button,
  I18nProvider,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  UNSTABLE_Toast as RacToast,
  UNSTABLE_ToastContent as RacToastContent,
  UNSTABLE_ToastQueue as RacToastQueue,
  UNSTABLE_ToastRegion as RacToastRegion,
} from "react-aria-components";

const OUT =
  "/private/tmp/claude-501/-Users-kamyabnazari-Documents-personal-projects-projects-protfolio-projects/8ba86192-a035-4f0c-956e-2edac5972cfe/scratchpad/probe2.txt";
const log = (s: string) => appendFileSync(OUT, s + "\n\n");

const FA = "fa-IR-u-ca-persian-nu-arabext";

describe("probe2", () => {
  it("slider under I18nProvider", () => {
    const { container } = render(
      <I18nProvider locale={FA}>
        <Slider aria-label="اندازه" defaultValue={40}>
          <SliderOutput />
          <SliderTrack>
            <SliderThumb />
          </SliderTrack>
        </Slider>
      </I18nProvider>,
    );
    log("SLIDER FA:\n" + container.innerHTML);
  });

  it("slider aria-valuetext override attempt", () => {
    const { container } = render(
      <Slider aria-label="اندازه" defaultValue={40}>
        <SliderTrack>
          <SliderThumb aria-valuetext={"۴۰"} />
        </SliderTrack>
      </Slider>,
    );
    log("SLIDER OVERRIDE ATTEMPT:\n" + container.innerHTML);
  });

  it("slider SSR without provider", () => {
    log(
      "SLIDER SSR NO PROVIDER:\n" +
        renderToStaticMarkup(
          <Slider aria-label="اندازه" defaultValue={40}>
            <SliderOutput />
            <SliderTrack>
              <SliderThumb />
            </SliderTrack>
          </Slider>,
        ),
    );
    log(
      "SLIDER SSR WITH PROVIDER:\n" +
        renderToStaticMarkup(
          <I18nProvider locale={FA}>
            <Slider aria-label="اندازه" defaultValue={40}>
              <SliderOutput />
              <SliderTrack>
                <SliderThumb />
              </SliderTrack>
            </Slider>
          </I18nProvider>,
        ),
    );
  });

  it("toast dir, with and without provider", async () => {
    const queue = new RacToastQueue<{ title: string }>({ maxVisibleToasts: 3 });
    const region = (
      <RacToastRegion queue={queue}>
        {({ toast }) => (
          <RacToast toast={toast}>
            <RacToastContent>{toast.content.title}</RacToastContent>
            <Button slot="close">x</Button>
          </RacToast>
        )}
      </RacToastRegion>
    );
    render(<>{region}</>);
    await act(async () => {
      queue.add({ title: "ذخیره شد" });
    });
    log("TOAST NO PROVIDER:\n" + document.body.innerHTML);

    const queue2 = new RacToastQueue<{ title: string }>({});
    render(
      <I18nProvider locale={FA}>
        <RacToastRegion queue={queue2}>
          {({ toast }) => (
            <RacToast toast={toast}>
              <RacToastContent>{toast.content.title}</RacToastContent>
              <Button slot="close" aria-label="بستن">
                x
              </Button>
            </RacToast>
          )}
        </RacToastRegion>
      </I18nProvider>,
    );
    await act(async () => {
      queue2.add({ title: "ذخیره شد" });
    });
    log("TOAST WITH PROVIDER:\n" + document.body.innerHTML);
  });
});
