/**
 * Compile-time pin for `Alert`: dismissal is all-or-nothing (`onClose` and
 * `closeLabel` travel together), the owned `role` is not a prop, and a bare
 * number child does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Alert } from "./alert.tsx";

// @ts-expect-error onClose without closeLabel: the close button would be nameless
void <Alert onClose={() => undefined}>متن</Alert>;
// @ts-expect-error closeLabel without onClose: a label with no button to name
void <Alert closeLabel="بستن">متن</Alert>;
// @ts-expect-error role is owned by the component (status/alert from `live`)
void <Alert role="alert">متن</Alert>;
// @ts-expect-error a bare number child is not a LumoNode
void <Alert>{5}</Alert>;

void <Alert tone="accent" title="توجه">متن</Alert>;
void <Alert tone="critical" live="assertive" onClose={() => undefined} closeLabel="بستن">خطا</Alert>;
