import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button, buttonVariants } from "./button.tsx";

it("keeps default buttons compact with a proportionate control icon", () => {
  const classes = buttonVariants();
  expect(classes).toContain("h-control-md");
  expect(classes).toContain("[&_svg]:size-4");
  expect(classes).not.toContain("h-control-lg");
  expect(classes).not.toContain("[&_svg]:size-5");
});

describe("Button event contracts", () => {
  it("delivers both onPress and onClick when both are supplied", () => {
    const onPress = vi.fn();
    const onClick = vi.fn();
    render(
      <Button onPress={onPress} onClick={onClick}>
        ذخیره
      </Button>,
    );

    fireEvent.click(screen.getByRole("button", { name: "ذخیره" }));

    expect(onPress).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not advertise interaction callbacks it cannot deliver", () => {
    // @ts-expect-error Base UI has no press-start delivery seam.
    void (<Button onPressStart={() => undefined}>ذخیره</Button>);
    // @ts-expect-error Base UI has no press-end delivery seam.
    void (<Button onPressEnd={() => undefined}>ذخیره</Button>);
    // @ts-expect-error Base UI has no press-up delivery seam.
    void (<Button onPressUp={() => undefined}>ذخیره</Button>);
    // @ts-expect-error Base UI has no press-change delivery seam.
    void (<Button onPressChange={() => undefined}>ذخیره</Button>);
    // @ts-expect-error Base UI has no hover-start delivery seam.
    void (<Button onHoverStart={() => undefined}>ذخیره</Button>);
    // @ts-expect-error Base UI has no hover-end delivery seam.
    void (<Button onHoverEnd={() => undefined}>ذخیره</Button>);
    // @ts-expect-error Base UI has no hover-change delivery seam.
    void (<Button onHoverChange={() => undefined}>ذخیره</Button>);
    // @ts-expect-error focus events use onFocus/onBlur; this aggregate callback is unsupported.
    void (<Button onFocusChange={() => undefined}>ذخیره</Button>);
    expect(true).toBe(true);
  });
});
