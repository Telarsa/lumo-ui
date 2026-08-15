/**
 * Compile-time pin for the Button family: no link or press/hover-lifecycle
 * surface on a `<button>`, `IconButton` names itself through a required
 * `label` (not `aria-label`), and a bare number child does not compile. An
 * unused `@ts-expect-error` fails `tsc`.
 */
import { Button, IconButton, type IconButtonProps } from "./button.tsx";

// @ts-expect-error a button is not a link
void <Button href="/x">ذخیره</Button>;
// @ts-expect-error no press lifecycle: Base UI has no press abstraction
void <Button onPressStart={() => undefined}>ذخیره</Button>;
// @ts-expect-error no hover lifecycle: Base UI has no hover abstraction
void <Button onHoverChange={() => undefined}>ذخیره</Button>;
// @ts-expect-error focus-change state is not synthesized
void <Button onFocusChange={() => undefined}>ذخیره</Button>;
// @ts-expect-error pending state is not modelled
void <Button isPending>ذخیره</Button>;
// @ts-expect-error focus-on-press cannot be controlled
void <Button preventFocusOnPress>ذخیره</Button>;
// @ts-expect-error tab exclusion is not mapped; use tabIndex
void <Button excludeFromTabOrder>ذخیره</Button>;
// @ts-expect-error no RAC slot
void <Button slot="x">ذخیره</Button>;
// @ts-expect-error the icon button's label is required
void <IconButton>✓</IconButton>;
// @ts-expect-error aria-label is owned: `label` is the one name
const iconNamed: IconButtonProps = { label: "بستن", "aria-label": "بستن" };
void iconNamed;
// @ts-expect-error a bare number child is not a LumoNode
void <Button>{5}</Button>;

void <Button variant="solid" onPress={() => undefined} tabIndex={-1}>ذخیره</Button>;
void <IconButton label="بستن" size="sm">✕</IconButton>;
