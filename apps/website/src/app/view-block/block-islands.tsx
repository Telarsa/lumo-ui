"use client";

import { useState } from "react";
import { formatDate, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Badge, optional } from "@lumo-ui/ui";
import {
  CheckoutSummary,
  DataToolbar,
  ListingGrid,
  OtpVerify,
  ProductDetail,
  RequestPasswordReset,
  TableView,
  type CheckoutCharge,
  type CheckoutItem,
  type CheckoutSummaryStrings,
  type DataToolbarStrings,
  type DataToolbarView,
  type Listing,
  type ListingGridStrings,
  type OtpVerifyStrings,
  type ProductDetailStrings,
  type ProductImage,
  type ProductSpec,
  type ProductStockState,
  type ProductVariantGroup,
  type RequestPasswordResetStrings,
  type SortOption,
  type TableViewColumn,
  type TableViewStrings,
} from "@lumo-ui/blocks";

/**
 * Client islands for the seven blocks whose `strings` contract requires a FUNCTION
 * (`resendIn`, `resultCount`, `rating`, …). `../../lib/blocks.tsx` reads block source with
 * `node:fs`, so it must stay a server module, and a server module cannot pass a function
 * prop to a Client Component — see `demo-islands.tsx`'s header. Every prop below is a
 * plain serialisable value; the Persian and English words are still authored in
 * `blocks.tsx` and merely PASSED IN as prefix/suffix pairs — only word order lives here.
 */

/* ────────────────────────────────────────────────────────────── otp-verify ── */

export interface OtpVerifyIslandProps {
  locale: Locale;
  title: string;
  description?: string | undefined;
  codeLabel: string;
  codePlaceholder?: string | undefined;
  codeHint?: string | undefined;
  submit: string;
  resend: string;
  /** Joined around the already-formatted seconds: `${prefix}${seconds}${suffix}`. */
  resendInPrefix: string;
  resendInSuffix: string;
  resendAfterSeconds?: number | undefined;
  length?: number | undefined;
}

export function OtpVerifyIsland({
  locale,
  title,
  description,
  codeLabel,
  codePlaceholder,
  codeHint,
  submit,
  resend,
  resendInPrefix,
  resendInSuffix,
  resendAfterSeconds,
  length,
}: OtpVerifyIslandProps) {
  const strings: OtpVerifyStrings = {
    title,
    ...optional("description", description),
    codeLabel,
    ...optional("codePlaceholder", codePlaceholder),
    ...optional("codeHint", codeHint),
    submit,
    resend,
    resendIn: (seconds) => `${resendInPrefix}${seconds}${resendInSuffix}`,
  };
  return (
    <OtpVerify
      locale={locale}
      strings={strings}
      {...optional("length", length)}
      {...optional("resendAfterSeconds", resendAfterSeconds)}
    />
  );
}

/* ─────────────────────────────────────────────────── request-password-reset ── */

export interface RequestPasswordResetIslandProps {
  locale: Locale;
  signInHref: string;
  status?: "idle" | "sent" | undefined;
  title: string;
  description?: string | undefined;
  emailLabel: string;
  emailPlaceholder?: string | undefined;
  submit: string;
  backToSignIn: string;
  sentTitle: string;
  sentDescription?: string | undefined;
  resend: string;
  resendInPrefix: string;
  resendInSuffix: string;
  resendAfterSeconds?: number | undefined;
}

export function RequestPasswordResetIsland({
  locale,
  signInHref,
  status,
  title,
  description,
  emailLabel,
  emailPlaceholder,
  submit,
  backToSignIn,
  sentTitle,
  sentDescription,
  resend,
  resendInPrefix,
  resendInSuffix,
  resendAfterSeconds,
}: RequestPasswordResetIslandProps) {
  const strings: RequestPasswordResetStrings = {
    title,
    ...optional("description", description),
    emailLabel,
    ...optional("emailPlaceholder", emailPlaceholder),
    submit,
    backToSignIn,
    sentTitle,
    ...optional("sentDescription", sentDescription),
    resend,
    resendIn: (seconds) => `${resendInPrefix}${seconds}${resendInSuffix}`,
  };
  return (
    <RequestPasswordReset
      locale={locale}
      signInHref={signInHref}
      strings={strings}
      {...optional("status", status)}
      {...optional("resendAfterSeconds", resendAfterSeconds)}
    />
  );
}

/* ──────────────────────────────────────────────────────────── data-toolbar ── */

export interface DataToolbarIslandProps {
  locale: Locale;
  toolbarLabel: string;
  searchLabel: string;
  searchClearLabel: string;
  searchPlaceholder?: string | undefined;
  sortLabel: string;
  sortPlaceholder: string;
  viewLabel: string;
  viewList: string;
  viewGrid: string;
  /** Joined around the already-formatted total: `${prefix}${count}${suffix}`. */
  resultCountPrefix: string;
  resultCountSuffix: string;
  total?: number | undefined;
  sortOptions?: readonly SortOption[] | undefined;
  sort?: string | undefined;
  view?: DataToolbarView | undefined;
}

export function DataToolbarIsland({
  locale,
  toolbarLabel,
  searchLabel,
  searchClearLabel,
  searchPlaceholder,
  sortLabel,
  sortPlaceholder,
  viewLabel,
  viewList,
  viewGrid,
  resultCountPrefix,
  resultCountSuffix,
  total,
  sortOptions,
  sort,
  view,
}: DataToolbarIslandProps) {
  const strings: DataToolbarStrings = {
    toolbarLabel,
    searchLabel,
    searchClearLabel,
    ...optional("searchPlaceholder", searchPlaceholder),
    sortLabel,
    sortPlaceholder,
    viewLabel,
    viewList,
    viewGrid,
    resultCount: (count) => `${resultCountPrefix}${count}${resultCountSuffix}`,
  };
  return (
    <DataToolbar
      locale={locale}
      strings={strings}
      {...optional("total", total)}
      {...optional("sortOptions", sortOptions)}
      {...optional("sort", sort)}
      {...optional("view", view)}
    />
  );
}

/* ──────────────────────────────────────────────────────────────── table-view ── */

export interface OrderRow {
  id: string;
  customer: string;
  placedAt: Date;
  amount: number;
  status: "paid" | "pending" | "canceled";
}

export interface TableViewIslandProps {
  locale: Locale;
  rows: readonly OrderRow[];
  customerHeader: string;
  dateHeader: string;
  amountHeader: string;
  statusHeader: string;
  statusLabel: Record<OrderRow["status"], string>;
  tableLabel: string;
  selectAllLabel: string;
  /** Joined before the row's own label: `${prefix}${rowLabel}`. */
  selectRowPrefix: string;
  sortAscendingLabel: string;
  sortDescendingLabel: string;
  emptyTitle: string;
  toolbarLabel: string;
  searchLabel: string;
  searchClearLabel: string;
  searchPlaceholder?: string | undefined;
  sortLabel: string;
  sortPlaceholder: string;
  viewLabel: string;
  viewList: string;
  viewGrid: string;
  resultCountPrefix: string;
  resultCountSuffix: string;
  sortOptions?: readonly SortOption[] | undefined;
  toolbarSort?: string | undefined;
  view?: DataToolbarView | undefined;
  paginationLabel: string;
  previousPageLabel: string;
  nextPageLabel: string;
  /** Joined before the already-formatted page number: `${prefix}${page}`. */
  pageWordPrefix: string;
  pageCount: number;
}

export function TableViewIsland({
  locale,
  rows,
  customerHeader,
  dateHeader,
  amountHeader,
  statusHeader,
  statusLabel,
  tableLabel,
  selectAllLabel,
  selectRowPrefix,
  sortAscendingLabel,
  sortDescendingLabel,
  emptyTitle,
  toolbarLabel,
  searchLabel,
  searchClearLabel,
  searchPlaceholder,
  sortLabel,
  sortPlaceholder,
  viewLabel,
  viewList,
  viewGrid,
  resultCountPrefix,
  resultCountSuffix,
  sortOptions,
  toolbarSort,
  view,
  paginationLabel,
  previousPageLabel,
  nextPageLabel,
  pageWordPrefix,
  pageCount,
}: TableViewIslandProps) {
  // Local, client-owned state — the same trade `PaginationIsland` makes in
  // `demo-islands.tsx`: a deterministic initial value keeps the prerendered
  // bytes stable across builds, and the interaction is real after hydration.
  const [page, setPage] = useState(1);

  const columns: TableViewColumn<OrderRow>[] = [
    {
      id: "customer",
      header: customerHeader,
      isRowHeader: true,
      cell: (row) => row.customer,
    },
    {
      id: "date",
      header: dateHeader,
      allowsSorting: true,
      // What the header sorts BY. `cell` returns a `<time>` element and a
      // sortable column now has to say what is underneath it — see
      // `table-view.tsx`. Before this the header sorted nothing at all.
      sortValue: (row) => row.placedAt.getTime(),
      cell: (row) => (
        <time dateTime={row.placedAt.toISOString()}>
          {formatDate(row.placedAt, locale, { dateStyle: "medium" })}
        </time>
      ),
    },
    {
      id: "amount",
      header: amountHeader,
      allowsSorting: true,
      // The raw number, never the formatted string: «۱٬۲۰۰٬۰۰۰ ریال» sorts by
      // its first Persian digit, which is not what any reader means by "sort
      // by amount".
      sortValue: (row) => row.amount,
      cell: (row) => formatNumber(row.amount, locale, { style: "currency", currency: "IRR", maximumFractionDigits: 0 }),
    },
    {
      id: "status",
      header: statusHeader,
      cell: (row) => (
        <Badge
          tone={row.status === "paid" ? "positive" : row.status === "pending" ? "caution" : "critical"}
          variant="subtle"
        >
          {statusLabel[row.status]}
        </Badge>
      ),
    },
  ];

  const strings: TableViewStrings = {
    toolbar: {
      toolbarLabel,
      searchLabel,
      searchClearLabel,
      ...optional("searchPlaceholder", searchPlaceholder),
      sortLabel,
      sortPlaceholder,
      viewLabel,
      viewList,
      viewGrid,
      resultCount: (count) => `${resultCountPrefix}${count}${resultCountSuffix}`,
    },
    tableLabel,
    selectAllLabel,
    selectRow: (rowLabel) => `${selectRowPrefix}${rowLabel}`,
    sortAscendingLabel,
    sortDescendingLabel,
    emptyTitle,
  };

  return (
    <TableView<OrderRow>
      strings={strings}
      locale={locale}
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      rowLabel={(row) => row.customer}
      {...optional("sortOptions", sortOptions)}
      {...optional("toolbarSort", toolbarSort)}
      {...optional("view", view)}
      pagination={{
        page,
        count: pageCount,
        onPageChange: setPage,
        label: paginationLabel,
        previousLabel: previousPageLabel,
        nextLabel: nextPageLabel,
        pageLabel: (formattedPage) => `${pageWordPrefix}${formattedPage}`,
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────── listing-grid ── */

export interface ListingGridIslandProps {
  locale: Locale;
  items: readonly Listing[];
  regionLabel: string;
  priceLabel: string;
  /** Joined around the two already-formatted numbers: `${value}${joiner}${count}${suffix}`. */
  ratingJoiner: string;
  ratingSuffix: string;
  emptyTitle: string;
  emptyDescription?: string | undefined;
  priceFormat?: Intl.NumberFormatOptions | undefined;
}

export function ListingGridIsland({
  locale,
  items,
  regionLabel,
  priceLabel,
  ratingJoiner,
  ratingSuffix,
  emptyTitle,
  emptyDescription,
  priceFormat,
}: ListingGridIslandProps) {
  const strings: ListingGridStrings = {
    regionLabel,
    priceLabel,
    rating: (value, count) => `${value}${ratingJoiner}${count}${ratingSuffix}`,
    emptyTitle,
    ...optional("emptyDescription", emptyDescription),
  };
  return (
    <ListingGrid
      strings={strings}
      items={items}
      locale={locale}
      {...optional("priceFormat", priceFormat)}
    />
  );
}

/* ─────────────────────────────────────────────────────────── checkout-summary ── */

export interface CheckoutSummaryIslandProps {
  locale: Locale;
  items: readonly CheckoutItem[];
  charges?: readonly CheckoutCharge[] | undefined;
  total: number;
  currencyFormat?: Intl.NumberFormatOptions | undefined;
  title: string;
  itemsLabel: string;
  /** Joined before the already-formatted quantity: `${prefix}${count}`. */
  quantityPrefix: string;
  removeItem: string;
  /** Joined before the item's own title: `${prefix}${title}`. */
  removeItemLabelPrefix: string;
  promoLabel: string;
  promoPlaceholder?: string | undefined;
  promoApply: string;
  totalLabel: string;
  confirm: string;
  footnote?: string | undefined;
}

export function CheckoutSummaryIsland({
  locale,
  items,
  charges,
  total,
  currencyFormat,
  title,
  itemsLabel,
  quantityPrefix,
  removeItem,
  removeItemLabelPrefix,
  promoLabel,
  promoPlaceholder,
  promoApply,
  totalLabel,
  confirm,
  footnote,
}: CheckoutSummaryIslandProps) {
  const strings: CheckoutSummaryStrings = {
    title,
    itemsLabel,
    quantity: (count) => `${quantityPrefix}${count}`,
    removeItem,
    removeItemLabel: (itemTitle) => `${removeItemLabelPrefix}${itemTitle}`,
    promoLabel,
    ...optional("promoPlaceholder", promoPlaceholder),
    promoApply,
    totalLabel,
    confirm,
    ...optional("footnote", footnote),
  };
  return (
    <CheckoutSummary
      strings={strings}
      locale={locale}
      items={items}
      total={total}
      {...optional("charges", charges)}
      {...optional("currencyFormat", currencyFormat)}
    />
  );
}

/* ─────────────────────────────────────────────────────────── product-detail ── */

export interface ProductDetailIslandProps {
  locale: Locale;
  title: string;
  description?: LumoNode;
  images: readonly ProductImage[];
  badge?: string | undefined;
  price: number;
  compareAtPrice?: number | undefined;
  priceFormat?: Intl.NumberFormatOptions | undefined;
  rating?: number | undefined;
  ratingCount?: number | undefined;
  stock: ProductStockState;
  lowStockCount?: number | undefined;
  variants?: readonly ProductVariantGroup[] | undefined;
  selectedVariants?: Readonly<Record<string, string | undefined>> | undefined;
  specs?: readonly ProductSpec[] | undefined;
  quantity?: number | undefined;
  galleryLabel: string;
  galleryRoleDescription: string;
  slideRoleDescription: string;
  imagePrevious: string;
  imageNext: string;
  priceLabel: string;
  compareAtLabel?: string | undefined;
  /** Joined around the two already-formatted numbers: `${value}${joiner}${maxValue}`. */
  ratingJoiner: string;
  inStock: string;
  outOfStock: string;
  /** Joined around the already-formatted count: `${prefix}${count}${suffix}`. */
  lowStockPrefix: string;
  lowStockSuffix: string;
  quantityLabel: string;
  quantityDecrement: string;
  quantityIncrement: string;
  quantityRoleDescription: string;
  addToCart: string;
  specsLabel: string;
}

export function ProductDetailIsland({
  locale,
  title,
  description,
  images,
  badge,
  price,
  compareAtPrice,
  priceFormat,
  rating,
  ratingCount,
  stock,
  lowStockCount,
  variants,
  selectedVariants,
  specs,
  quantity,
  galleryLabel,
  galleryRoleDescription,
  slideRoleDescription,
  imagePrevious,
  imageNext,
  priceLabel,
  compareAtLabel,
  ratingJoiner,
  inStock,
  outOfStock,
  lowStockPrefix,
  lowStockSuffix,
  quantityLabel,
  quantityDecrement,
  quantityIncrement,
  quantityRoleDescription,
  addToCart,
  specsLabel,
}: ProductDetailIslandProps) {
  const strings: ProductDetailStrings = {
    galleryLabel,
    galleryRoleDescription,
    slideRoleDescription,
    imagePrevious,
    imageNext,
    priceLabel,
    ...optional("compareAtLabel", compareAtLabel),
    ratingValueLabel: (value, maxValue) => `${value}${ratingJoiner}${maxValue}`,
    inStock,
    outOfStock,
    lowStock: (count) => `${lowStockPrefix}${count}${lowStockSuffix}`,
    quantityLabel,
    quantityDecrement,
    quantityIncrement,
    quantityRoleDescription,
    addToCart,
    specsLabel,
  };
  return (
    <ProductDetail
      strings={strings}
      locale={locale}
      title={title}
      images={images}
      price={price}
      stock={stock}
      {...optional("description", description)}
      {...optional("badge", badge)}
      {...optional("compareAtPrice", compareAtPrice)}
      {...optional("priceFormat", priceFormat)}
      {...optional("rating", rating)}
      {...optional("ratingCount", ratingCount)}
      {...optional("lowStockCount", lowStockCount)}
      {...optional("variants", variants)}
      {...optional("selectedVariants", selectedVariants)}
      {...optional("specs", specs)}
      {...optional("quantity", quantity)}
    />
  );
}
