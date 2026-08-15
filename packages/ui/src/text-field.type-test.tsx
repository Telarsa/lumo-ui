/**
 * Compile-time pin for `TextField`: `label` is required, `validationBehavior`
 * and RAC slots are rejected, and the field takes no children. An unused
 * `@ts-expect-error` fails `tsc`.
 */
import { TextField } from "./text-field.tsx";

// @ts-expect-error label is required: it names the input
void <TextField placeholder="نام" />;
// @ts-expect-error validationBehavior is not implemented
void <TextField label="نام" validationBehavior="native" />;
// @ts-expect-error React Aria context slots do not exist
void <TextField label="نام" slot="x" />;
// @ts-expect-error the field renders its own input; children are not a prop
void <TextField label="نام">متن</TextField>;

void <TextField label="نام" />;
void <TextField label="رایانامه" type="email" isRequired isInvalid errorMessage="خطا" size="sm" onChange={() => undefined} />;
