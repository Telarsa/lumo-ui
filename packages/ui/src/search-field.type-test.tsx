/**
 * Compile-time pin for `SearchField`: `label` and `clearLabel` are required,
 * `validationBehavior` and `type` are rejected, and the field takes no
 * children. An unused `@ts-expect-error` fails `tsc`.
 */
import { SearchField } from "./search-field.tsx";

// @ts-expect-error label is required: it names the input
void <SearchField clearLabel="پاک کردن" />;
// @ts-expect-error clearLabel is required: the clear button would be nameless
void <SearchField label="جستجو" />;
// @ts-expect-error validationBehavior is not implemented
void <SearchField label="جستجو" clearLabel="پاک کردن" validationBehavior="native" />;
// @ts-expect-error type is fixed to search
void <SearchField label="جستجو" clearLabel="پاک کردن" type="text" />;
// @ts-expect-error the field renders its own input; children are not a prop
void <SearchField label="جستجو" clearLabel="پاک کردن">متن</SearchField>;

void <SearchField label="جستجو" clearLabel="پاک کردن" />;
void <SearchField label="جستجو" clearLabel="پاک کردن" onSubmit={() => undefined} onClear={() => undefined} placeholder="جستجو…" isInvalid errorMessage="خطا" />;
