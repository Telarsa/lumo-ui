/**
 * Compile-time pin for the Toast family: `closeLabel` is required on both the
 * toast and the region, the region needs `locale` and `label`, and neither
 * takes children. An unused `@ts-expect-error` fails `tsc`.
 */
import { Toast, ToastRegion, type LumoQueuedToast, type LumoToastQueue } from "./toast.tsx";

declare const queue: LumoToastQueue;
declare const queued: LumoQueuedToast;

// @ts-expect-error closeLabel is required: the close button would be nameless
void <Toast toast={queued} />;
// @ts-expect-error label is required: it names the region
void <ToastRegion queue={queue} locale="fa-IR" closeLabel="بستن" />;
// @ts-expect-error closeLabel is required on the region
void <ToastRegion queue={queue} locale="fa-IR" label="اعلان‌ها" />;
// @ts-expect-error locale is required: it formats the toast count
void <ToastRegion queue={queue} label="اعلان‌ها" closeLabel="بستن" />;
// @ts-expect-error the region renders the queue; children are not a prop
void <ToastRegion queue={queue} locale="fa-IR" label="اعلان‌ها" closeLabel="بستن">متن</ToastRegion>;

void <Toast toast={queued} closeLabel="بستن" />;
void <ToastRegion queue={queue} locale="fa-IR" label="اعلان‌ها" closeLabel="بستن" />;
