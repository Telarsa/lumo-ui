import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";

import { Skeleton } from "./skeleton.tsx";
import {
  SkeletonAvatar,
  SkeletonCard,
  SkeletonForm,
  SkeletonTable,
  SkeletonText,
} from "./skeleton-presets.tsx";

describe("Skeleton — decorative semantics are owned", () => {
  it("cannot be exposed through a spread prop", () => {
    const html = renderToStaticMarkup(
      <Skeleton {...({ "aria-hidden": false } as unknown as ComponentProps<typeof Skeleton>)} />,
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('aria-hidden="false"');
  });
});

describe("Skeleton presets — decorative semantics are owned", () => {
  it("cannot expose any preset root through a spread prop", () => {
    const nodes = [
      <SkeletonText key="text" {...({ "aria-hidden": false } as unknown as ComponentProps<typeof SkeletonText>)} />,
      <SkeletonAvatar key="avatar" {...({ "aria-hidden": false } as unknown as ComponentProps<typeof SkeletonAvatar>)} />,
      <SkeletonCard key="card" {...({ "aria-hidden": false } as unknown as ComponentProps<typeof SkeletonCard>)} />,
      <SkeletonForm key="form" {...({ "aria-hidden": false } as unknown as ComponentProps<typeof SkeletonForm>)} />,
      <SkeletonTable key="table" {...({ "aria-hidden": false } as unknown as ComponentProps<typeof SkeletonTable>)} />,
    ];
    for (const node of nodes) {
      const html = renderToStaticMarkup(node);
      expect(html).toContain('aria-hidden="true"');
      expect(html).not.toContain('aria-hidden="false"');
    }
  });
});
