/**
 * POISON FIXTURE — every line marked BAD must produce exactly one
 * physical-utility error, and every line marked OK must produce none.
 *
 * This file exists because the physical-utility rule shipped, was documented in
 * CONTRIBUTING.md as "a physical utility is caught by lint", and was never run.
 * When it finally was, it fired on 34 English sentences and stayed silent on
 * `after:-inset-x-2`. A rule with no fixture is a claim; this is the test.
 *
 * NOT LINTED by the repository's own config — `packages/config/fixtures/**` is
 * in the root ignore list, exactly like the HTML gate's poison fixtures. A clean
 * poison fixture is a broken poison fixture.
 */
declare function cn(...parts: unknown[]): string;
declare function cva(base: string, config?: unknown): unknown;

export function Bad() {
  return (
    <div>
      {/* BAD: the plain case, and the one the audit injected to prove nothing ran. */}
      <span className="ml-2 text-left" />
      {/* BAD: behind a responsive variant. The old pattern could not see past `md:`. */}
      <span className="md:ml-4" />
      {/* BAD: behind a pseudo-element variant, negative. The `resizable.tsx` shape. */}
      <span className="after:-mr-2" />
      {/* BAD: not the first token in the string. */}
      <span className="flex items-center pl-3" />
      {/* BAD: a template chunk. */}
      <span className={`flex rounded-tl-md`} />
      {/* BAD: a className-suffixed prop, not just `className`. */}
      <span itemClassName="border-l-2" />
      {/* BAD: inside cn(). */}
      <span className={cn("gap-2", "float-right")} />

      {/* OK: the logical spellings the rule exists to push people toward. */}
      <span className="ms-2 me-4 ps-3 pe-3 text-start rounded-ss-md border-s-2 start-0 end-0" />
      {/* OK: `rtl:` and `ltr:` are direction-specific BY INTENTION. */}
      <span className="rtl:ml-2 ltr:mr-2" />
      {/* OK: a data-attribute carve-out describes a computed side. */}
      <span className="data-[placement=left]:mr-2" />
      {/* OK: one sanctioned token must not excuse an unsanctioned neighbour —
          but here BOTH are sanctioned, so this line stays clean. */}
      <span className="rtl:pl-2 rtl:pr-2" />
      {/* OK: `inset-x-*` compiles to `inset-inline` on tailwindcss 4. */}
      <span className="absolute inset-x-0 after:-inset-x-2" />
      {/* OK: `space-x-*` compiles to margin-inline-start/end on tailwindcss 4. */}
      <span className="space-x-4" />
      {/* OK: near-misses that must not be swallowed. */}
      <span className="border-red-500 rounded-lg text-red-500 mb-2 pt-2 top-1/2" />
      {/* OK: prose is not a class. This is the 34/37 case. */}
      <span title="Use text-start rather than text-left; ml-2 breaks right-to-left." />
    </div>
  );
}

/* BAD: a cva base string, which is where 359 of this repo's class strings live. */
export const badVariants = cva("absolute left-0 top-0");

/* OK: the same call with logical spellings. */
export const goodVariants = cva("absolute start-0 top-0");

/* OK: outside any class position, these characters are just characters. */
export const prose = "The dot sits bottom-right in English; right-click to see it.";
