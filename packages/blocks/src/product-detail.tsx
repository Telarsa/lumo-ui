"use client";

import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import {
  Badge,
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  DescriptionDetail,
  DescriptionGroup,
  DescriptionList,
  DescriptionTerm,
  NumberField,
  Radio,
  RadioGroup,
  Rating,
  optional,
} from "@lumo-ui/ui";

/**
 * A single product page: gallery, price, stock, variants, quantity, specs.
 *
 * No routing chrome (that is `page-header.tsx`), but it DOES own the `<h1>`.
 * Stock is three strings, not a boolean: each state carries its own announced
 * word (a colour-only badge fails WCAG 1.4.1) and `lowStock` is a function of
 * the already-formatted count. Variants are `RadioGroup`, never a colour-only
 * swatch picker.
 *
 * `"use client"`: `onAddToCart`, `onQuantityChange` and `onVariantChange` are
 * callbacks, and `Carousel` is itself a client component.
 */
export interface ProductImage {
  src: string;
  /** `""` is legitimate when the gallery sits beside a title that already
   * names the product — see `avatar.tsx` for the general argument. */
  alt: string;
  /**
   * Names this image's SLIDE, e.g. «نمای جلو». REQUIRED, and deliberately not
   * the same field as `alt`: `alt=""` can be right, but four unnamed slides are
   * four identical announcements (caught by `named-roledescription`).
   */
  label: string;
}

export interface ProductVariantOption {
  id: string;
  label: string;
  isAvailable?: boolean | undefined;
}

export interface ProductVariantGroup {
  /** Stable key, sent back through `onVariantChange`. */
  id: string;
  /** Announced and displayed name of the group, e.g. «رنگ». */
  label: string;
  options: readonly ProductVariantOption[];
}

export interface ProductSpec {
  /** Stable key. Not rendered. */
  id: string;
  term: string;
  detail: LumoNode;
}

export type ProductStockState = "in-stock" | "low-stock" | "out-of-stock";

export interface ProductDetailStrings {
  /** Announced name of the gallery region. */
  galleryLabel: string;
  /** What the gallery IS, e.g. «چرخ‌فلک». See `carousel.tsx`. */
  galleryRoleDescription: string;
  /** What each image IS, e.g. «اسلاید». */
  slideRoleDescription: string;
  imagePrevious: string;
  imageNext: string;
  /** Announced prefix on the price, e.g. «قیمت». `sr-only`. */
  priceLabel: string;
  /** Announced prefix on the struck-through original price. Required with `compareAtPrice`. */
  compareAtLabel?: string | undefined;
  /** The read-only rating's whole announced name. See `rating.tsx`. */
  ratingValueLabel: (value: string, maxValue: string) => string;
  inStock: string;
  outOfStock: string;
  /** As a function of the ALREADY-FORMATTED remaining count. See the file header. */
  lowStock: (count: string) => string;
  quantityLabel: string;
  quantityDecrement: string;
  quantityIncrement: string;
  quantityRoleDescription: string;
  addToCart: string;
  /** Announced name of the specification list's region. */
  specsLabel: string;
}

export interface ProductDetailProps {
  strings: ProductDetailStrings;
  /** Formats the price, the rating and the stock count. Required by design. */
  locale: Locale;
  /** The product name. Rendered as the page `<h1>`. */
  title: string;
  description?: LumoNode;
  images: readonly ProductImage[];
  /** A corner marker, e.g. «تازه». */
  badge?: string | undefined;
  price: number;
  /** A struck-through original price. Requires `strings.compareAtLabel`. */
  compareAtPrice?: number | undefined;
  priceFormat?: Intl.NumberFormatOptions | undefined;
  rating?: number | undefined;
  ratingCount?: number | undefined;
  stock: ProductStockState;
  /** Read only when `stock === "low-stock"`. */
  lowStockCount?: number | undefined;
  variants?: readonly ProductVariantGroup[] | undefined;
  /** Chosen option per group, keyed by `ProductVariantGroup.id`. */
  selectedVariants?: Readonly<Record<string, string | undefined>> | undefined;
  onVariantChange?: ((groupId: string, optionId: string) => void) | undefined;
  specs?: readonly ProductSpec[] | undefined;
  quantity?: number | undefined;
  onQuantityChange?: ((quantity: number) => void) | undefined;
  onAddToCart?: (() => void) | undefined;
  isPending?: boolean | undefined;
  className?: string | undefined;
}

export function ProductDetail({
  strings,
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
  onVariantChange,
  specs,
  quantity,
  onQuantityChange,
  onAddToCart,
  isPending = false,
  className,
}: ProductDetailProps) {
  return (
    <section
      className={cn(
        "flex w-full flex-col gap-8 px-4 py-8 md:flex-row md:items-start",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <Carousel
          locale={locale}
          label={strings.galleryLabel}
          roleDescription={strings.galleryRoleDescription}
          slideRoleDescription={strings.slideRoleDescription}
          className="w-full"
        >
          <CarouselContent>
            {images.map((image) => (
              <CarouselItem key={image.src} label={image.label}>
                <img
                  src={image.src}
                  alt={image.alt}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 ? (
            <>
              <CarouselPrevious label={strings.imagePrevious} />
              <CarouselNext label={strings.imageNext} />
            </>
          ) : null}
        </Carousel>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 text-start">
        {badge !== undefined ? (
          <Badge tone="accent" variant="subtle">
            {badge}
          </Badge>
        ) : null}

        <h1 className="text-2xl leading-snug font-semibold text-fg">{title}</h1>

        {rating !== undefined && ratingCount !== undefined ? (
          <Rating
            isReadOnly
            value={rating}
            maxValue={5}
            locale={locale}
            valueLabel={strings.ratingValueLabel}
            size="sm"
          />
        ) : null}

        <p className="flex flex-wrap items-baseline gap-2">
          <span className="sr-only">{strings.priceLabel}</span>
          <span className="text-2xl font-semibold text-fg">
            {formatNumber(price, locale, priceFormat)}
          </span>
          {compareAtPrice !== undefined ? (
            <span className="text-base text-fg-subtle line-through">
              {strings.compareAtLabel !== undefined ? (
                <span className="sr-only">{strings.compareAtLabel}</span>
              ) : null}
              {formatNumber(compareAtPrice, locale, priceFormat)}
            </span>
          ) : null}
        </p>

        <div>
          <Badge
            tone={
              stock === "in-stock" ? "positive" : stock === "low-stock" ? "caution" : "critical"
            }
            variant="subtle"
          >
            {stock === "in-stock"
              ? strings.inStock
              : stock === "out-of-stock"
                ? strings.outOfStock
                : strings.lowStock(formatNumber(lowStockCount ?? 0, locale))}
          </Badge>
        </div>

        {description !== undefined ? (
          <p className="max-w-prose text-sm text-fg-muted">{description}</p>
        ) : null}

        {(variants ?? []).map((group) => (
          <RadioGroup
            key={group.id}
            label={group.label}
            orientation="horizontal"
            {...optional("value", selectedVariants?.[group.id])}
            onChange={(value) => onVariantChange?.(group.id, value)}
          >
            {group.options.map((option) => (
              <Radio key={option.id} value={option.id} isDisabled={option.isAvailable === false}>
                {option.label}
              </Radio>
            ))}
          </RadioGroup>
        ))}

        <div className="flex flex-wrap items-end gap-3">
          <NumberField
            label={strings.quantityLabel}
            decrementLabel={strings.quantityDecrement}
            incrementLabel={strings.quantityIncrement}
            roleDescription={strings.quantityRoleDescription}
            minValue={1}
            className="w-32 shrink-0"
            {...optional("value", quantity)}
            onChange={(next) => onQuantityChange?.(next)}
          />

          <Button
            size="lg"
            isDisabled={stock === "out-of-stock" || isPending}
            className="flex-1"
            {...optional("onPress", onAddToCart)}
          >
            {strings.addToCart}
          </Button>
        </div>

        {specs !== undefined && specs.length > 0 ? (
          <section aria-label={strings.specsLabel} className="pbs-2">
            <DescriptionList>
              {specs.map((spec) => (
                <DescriptionGroup key={spec.id}>
                  <DescriptionTerm>{spec.term}</DescriptionTerm>
                  <DescriptionDetail>{spec.detail}</DescriptionDetail>
                </DescriptionGroup>
              ))}
            </DescriptionList>
          </section>
        ) : null}
      </div>
    </section>
  );
}
