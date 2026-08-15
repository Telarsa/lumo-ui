"use client";

import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  DescriptionDetail,
  DescriptionGroup,
  DescriptionList,
  DescriptionTerm,
  Separator,
  TextField,
  optional,
} from "@lumo-ui/ui";

/**
 * The panel beside a checkout FORM: what is in the cart, what it costs, one
 * confirm action.
 *
 * `"use client"`: `onConfirm`, `onPromoApply` and `onRemoveItem` are callbacks.
 *
 * The cart-shaped half of the `booking-summary.tsx` pair. Money rows go through
 * `DescriptionList` (a hand-written `<dl>` accepts a bare number). `lineTotal`
 * is pre-computed by the caller — this block does no arithmetic on money. A
 * successful promo is a new negative `charges` row, not an invented message.
 * The remove control is visible text plus a fuller `aria-label`; the visible
 * word must be a PREFIX of the announced one (WCAG 2.5.3).
 */
export interface CheckoutItem {
  /** Stable key, sent back through `onRemoveItem`. */
  id: string;
  /** The product name. */
  title: string;
  /** A variant line, e.g. «سایز L / آبی». */
  description?: string | undefined;
  image?: { src: string; alt: string } | undefined;
  /** How many. Announced through `strings.quantity`, never rendered raw. */
  quantity: number;
  /** `unitPrice × quantity`, already computed. See the file header. */
  lineTotal: number;
}

export interface CheckoutCharge {
  /** Stable key. Not rendered. */
  id: string;
  /** What this charge is for, e.g. «هزینهٔ ارسال». */
  label: string;
  note?: string | undefined;
  /** Negative for a discount. */
  amount: number;
}

export interface CheckoutSummaryStrings {
  title: string;
  /** Announced name of the item list. */
  itemsLabel: string;
  /** As a function of the ALREADY-FORMATTED quantity, e.g. «تعداد: ۲». */
  quantity: (count: string) => string;
  /** Visible remove-row text. Short — see the file header. */
  removeItem: string;
  /** The remove control's announced name, built from the item's own title. */
  removeItemLabel: (title: string) => string;
  promoLabel: string;
  promoPlaceholder?: string | undefined;
  promoApply: string;
  totalLabel: string;
  /** The confirm button. */
  confirm: string;
  footnote?: string | undefined;
}

export interface CheckoutSummaryProps {
  strings: CheckoutSummaryStrings;
  /** Formats every amount and every quantity. Required by design. */
  locale: Locale;
  items: readonly CheckoutItem[];
  /** Shipping, tax, a discount — rows between the items and the total. */
  charges?: readonly CheckoutCharge[] | undefined;
  total: number;
  currencyFormat?: Intl.NumberFormatOptions | undefined;
  promoCode?: string | undefined;
  onPromoCodeChange?: ((value: string) => void) | undefined;
  onPromoApply?: (() => void) | undefined;
  /** An invalid or expired code, already translated. See the file header for
   * how a SUCCESSFUL code is represented instead. */
  promoError?: LumoNode;
  onRemoveItem?: ((id: string) => void) | undefined;
  onConfirm?: (() => void) | undefined;
  /** A payment or availability failure, already translated. */
  error?: LumoNode;
  isPending?: boolean | undefined;
  className?: string | undefined;
}

export function CheckoutSummary({
  strings,
  locale,
  items,
  charges,
  total,
  currencyFormat,
  promoCode,
  onPromoCodeChange,
  onPromoApply,
  promoError,
  onRemoveItem,
  onConfirm,
  error,
  isPending = false,
  className,
}: CheckoutSummaryProps) {
  return (
    <Card variant="outlined" className={cn("w-full max-w-sm", className)}>
      <CardHeader>
        <CardTitle level={2}>{strings.title}</CardTitle>
      </CardHeader>

      <CardBody className="flex flex-col gap-4">
        <ul aria-label={strings.itemsLabel} className="flex list-none flex-col gap-3 p-0">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              {item.image !== undefined ? (
                <img
                  src={item.image.src}
                  alt={item.image.alt}
                  className="size-12 shrink-0 rounded-md object-cover"
                />
              ) : null}

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-fg">{item.title}</span>
                {item.description !== undefined ? (
                  <span className="truncate text-xs text-fg-muted">{item.description}</span>
                ) : null}
                <span className="text-xs text-fg-subtle">
                  {strings.quantity(formatNumber(item.quantity, locale))}
                </span>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-medium text-fg">
                  {formatNumber(item.lineTotal, locale, currencyFormat)}
                </span>
                {onRemoveItem !== undefined ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={strings.removeItemLabel(item.title)}
                    onPress={() => onRemoveItem(item.id)}
                    className="h-auto px-1.5 py-0.5 text-xs text-fg-muted"
                  >
                    {strings.removeItem}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <Separator />

        {charges !== undefined && charges.length > 0 ? (
          <DescriptionList>
            {charges.map((charge) => (
              <DescriptionGroup key={charge.id}>
                <DescriptionTerm className="flex flex-col text-fg-muted">
                  <span className="truncate">{charge.label}</span>
                  {charge.note !== undefined ? (
                    <span className="text-xs text-fg-subtle">{charge.note}</span>
                  ) : null}
                </DescriptionTerm>
                <DescriptionDetail>
                  {formatNumber(charge.amount, locale, currencyFormat)}
                </DescriptionDetail>
              </DescriptionGroup>
            ))}
          </DescriptionList>
        ) : null}

        <div className="flex items-end gap-2">
          <TextField
            label={strings.promoLabel}
            size="sm"
            className="flex-1"
            {...optional("placeholder", strings.promoPlaceholder)}
            {...optional("value", promoCode)}
            onChange={(value) => onPromoCodeChange?.(value)}
          />
          <Button variant="outline" size="sm" {...optional("onPress", onPromoApply)}>
            {strings.promoApply}
          </Button>
        </div>
        {promoError !== undefined ? (
          <Alert tone="critical" live="polite">
            {promoError}
          </Alert>
        ) : null}

        <Separator />

        <DescriptionList>
          <DescriptionGroup>
            <DescriptionTerm className="text-sm font-medium text-fg">
              {strings.totalLabel}
            </DescriptionTerm>
            <DescriptionDetail className="text-lg font-semibold text-fg">
              {formatNumber(total, locale, currencyFormat)}
            </DescriptionDetail>
          </DescriptionGroup>
        </DescriptionList>

        {error !== undefined ? (
          <Alert tone="critical" live="assertive">
            {error}
          </Alert>
        ) : null}
      </CardBody>

      <CardFooter className="flex-col items-stretch gap-2">
        <Button size="lg" isDisabled={isPending} {...optional("onPress", onConfirm)}>
          {strings.confirm}
        </Button>
        {strings.footnote !== undefined ? (
          <p className="text-center text-xs text-fg-subtle">{strings.footnote}</p>
        ) : null}
      </CardFooter>
    </Card>
  );
}
