/**
 * Compile-time pin for the RadioGroup family: the group's `label` and a
 * radio's `value` are required, validation modes and slots the engine lacks
 * are rejected, and a bare number child does not compile. An unused
 * `@ts-expect-error` fails `tsc`.
 */
import { Radio, RadioGroup } from "./radio-group.tsx";

// @ts-expect-error the group's label is required
void <RadioGroup><Radio value="a">الف</Radio></RadioGroup>;
// @ts-expect-error a radio's value is required: it is what the group reports
void <Radio>الف</Radio>;
// @ts-expect-error per-group validation mode is not implemented
void <RadioGroup label="اندازه" validationBehavior="native" />;
// @ts-expect-error React Aria context slots do not exist
void <RadioGroup label="اندازه" slot="size" />;
// @ts-expect-error a bare number child is not a LumoNode
void <Radio value="a">{5}</Radio>;

void (
  <RadioGroup label="اندازه" orientation="horizontal" isInvalid errorMessage="خطا">
    <Radio value="a" description="توضیح">الف</Radio>
  </RadioGroup>
);
void <RadioGroup label="اندازه" defaultValue="a" onChange={() => undefined} />;
