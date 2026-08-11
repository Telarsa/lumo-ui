The React Aria baselines, copied verbatim from `experiments/baseline-rac/` plus
three one-line shims (`form.tsx`, `button.variants.ts`, `toggle.variants.ts`)
that re-export from the parent directory so their relative imports resolve.
`date-field.tsx` is excluded: it has no Base UI counterpart to diff against.

They live here so both engines can be rendered from ONE piece of JSX in the same
process. To re-run the api-shape probes:

    cp -r experiments/harness/racbase packages/ui/src/
    cp experiments/harness/probe.api-shape*.test.tsx packages/ui/src/
    pnpm --filter @lumo-ui/ui exec vitest run src/probe.api-shape.test.tsx \
      src/probe.api-shape-detail.test.tsx src/probe.api-shape-fixability.test.tsx
    rm -rf packages/ui/src/racbase packages/ui/src/probe.api-shape*.test.tsx
