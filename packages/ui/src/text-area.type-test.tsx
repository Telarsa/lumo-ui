/**
 * Compile-time pin for `TextArea`: `label` is required, `validationBehavior`
 * and `type` are rejected, and the field takes no children. An unused
 * `@ts-expect-error` fails `tsc`.
 */
import { TextArea } from "./text-area.tsx";

// @ts-expect-error label is required: it names the textarea
void <TextArea placeholder="توضیح" />;
// @ts-expect-error validationBehavior is not implemented
void <TextArea label="توضیح" validationBehavior="native" />;
// @ts-expect-error a textarea has no input type
void <TextArea label="توضیح" type="text" />;
// @ts-expect-error React Aria context slots do not exist
void <TextArea label="توضیح" slot="x" />;
// @ts-expect-error the field renders its own textarea; children are not a prop
void <TextArea label="توضیح">متن</TextArea>;

void <TextArea label="توضیح" />;
void <TextArea label="توضیح" rows={4} isInvalid errorMessage="خطا" description="توضیح" onChange={() => undefined} />;
