/**
 * Compile-time pin for `Pagination`: `label`, `previousLabel`, `nextLabel`,
 * `pageLabel` and `locale` are required, the nav owns its name (`aria-label`
 * rejected) and takes no children. An unused `@ts-expect-error` fails `tsc`.
 */
import { Pagination, type PaginationProps } from "./pagination.tsx";

// @ts-expect-error label is required: it names the nav
void <Pagination locale="fa-IR" page={1} count={5} onPageChange={() => undefined} previousLabel="قبلی" nextLabel="بعدی" pageLabel={(p) => p} />;
// @ts-expect-error previousLabel is required
void <Pagination locale="fa-IR" page={1} count={5} onPageChange={() => undefined} label="صفحه‌بندی" nextLabel="بعدی" pageLabel={(p) => p} />;
// @ts-expect-error nextLabel is required
void <Pagination locale="fa-IR" page={1} count={5} onPageChange={() => undefined} label="صفحه‌بندی" previousLabel="قبلی" pageLabel={(p) => p} />;
// @ts-expect-error pageLabel is required: each page button would be a bare digit
void <Pagination locale="fa-IR" page={1} count={5} onPageChange={() => undefined} label="صفحه‌بندی" previousLabel="قبلی" nextLabel="بعدی" />;
// @ts-expect-error locale is required: it formats the page numbers
void <Pagination page={1} count={5} onPageChange={() => undefined} label="صفحه‌بندی" previousLabel="قبلی" nextLabel="بعدی" pageLabel={(p) => p} />;
// @ts-expect-error aria-label is owned: `label` is the one name
const named: PaginationProps = { locale: "fa-IR", page: 1, count: 5, onPageChange: () => undefined, label: "صفحه‌بندی", previousLabel: "قبلی", nextLabel: "بعدی", pageLabel: (p) => p, "aria-label": "x" };
void named;
// @ts-expect-error the nav renders its own buttons; children are not a prop
void <Pagination locale="fa-IR" page={1} count={5} onPageChange={() => undefined} label="صفحه‌بندی" previousLabel="قبلی" nextLabel="بعدی" pageLabel={(p) => p}>متن</Pagination>;

void <Pagination locale="fa-IR" page={1} count={5} onPageChange={() => undefined} label="صفحه‌بندی" previousLabel="قبلی" nextLabel="بعدی" pageLabel={(p) => `صفحه ${p}`} />;
void <Pagination locale="fa-IR" page={2} count={9} onPageChange={() => undefined} label="صفحه‌بندی" previousLabel="قبلی" nextLabel="بعدی" pageLabel={(p) => p} siblingCount={2} size="sm" />;
