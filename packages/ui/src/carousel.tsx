"use client";

import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn, direction, type Locale, type LumoNode } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";

/**
 * A slide carousel, over embla.
 *
 *     <Carousel
 *       locale={locale}
 *       label="پیشنهادهای ویژه"
 *       roleDescription="چرخ‌فلک"
 *       slideRoleDescription="اسلاید"
 *     >
 *       <CarouselContent>
 *         <CarouselItem>…</CarouselItem>
 *       </CarouselContent>
 *       <CarouselPrevious label="اسلاید قبلی" />
 *       <CarouselNext label="اسلاید بعدی" />
 *     </Carousel>
 *
 * ═══ THREE THINGS UPSTREAM GETS WRONG IN PERSIAN, ALL SILENT ════════════════
 *
 * **1. `aria-roledescription="carousel"` and `="slide"`.** Two English strings,
 * hardcoded, spoken by a screen reader on every slide of every carousel — and
 * invisible to a sighted reviewer, which is why they survive. `lumo-gate` fails
 * a build over exactly this attribute (`no-latin-aria`), so they are required
 * props here. They live on `<Carousel>` rather than on each item because a
 * per-item prop is a prop somebody forgets on item seven.
 *
 * **2. The scroll direction.** embla takes a `direction: 'ltr' | 'rtl'` option
 * and defaults to `'ltr'`. Without it a Persian carousel starts at the LEFT and
 * advances rightward under a `dir="rtl"` layout — the slides and the buttons
 * disagree about which way "next" is. Lumo derives it from the locale via
 * `direction()`, so there is no `dir` prop to get wrong (rule 4).
 *
 * **3. The arrow keys.** Upstream maps ArrowLeft → previous and ArrowRight →
 * next. In Persian that is backwards: the reader's "back" is to the right. This
 * is the failure that survives a screenshot review, because the layout looks
 * perfect and only the keyboard is wrong.
 *
 * ── THE CHEVRONS ────────────────────────────────────────────────────────────
 *
 * Horizontal controls use `‹` (U+2039) and `›` (U+203A), the Unicode
 * `Bidi_Mirrored` pair, exactly as `pagination.tsx`, `menu.tsx` and
 * `breadcrumbs.tsx` do: the text engine draws each as the other when the
 * resolved direction is RTL, so the arrowhead flips with no CSS and nothing for
 * the RTL codemod to miss. Upstream's `IconPlaceholder` + `cn-rtl-flip` needs a
 * class that must be remembered on every copy and that silently does nothing if
 * the icon is later swapped for one already pointing the right way.
 *
 * Vertical controls use real lucide chevrons, because up and down are BLOCK-axis
 * directions and do not mirror in any horizontal writing mode. A mirrored glyph
 * rotated 90° would flip the wrong axis under RTL.
 */

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

interface CarouselContextProps {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  orientation: "horizontal" | "vertical";
  slideRoleDescription: string;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

export function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    // A developer error at mount, not a string any reader sees.
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

export interface CarouselProps
  extends Omit<
    React.ComponentProps<"div">,
    "children" | "className" | "aria-label" | "role" | "aria-roledescription"
  > {
  /** Decides embla's scroll direction and the arrow-key mapping. Required. */
  locale: Locale;
  /** Owned by `roleDescription`; cannot be overridden through the DOM surface. */
  "aria-roledescription"?: undefined;
  /** The region's announced name, e.g. «پیشنهادهای ویژه». Required. */
  label: string;
  /**
   * What this widget IS, announced before its name — e.g. «چرخ‌فلک». Required:
   * upstream hardcodes the English word "carousel" into `aria-roledescription`.
   */
  roleDescription: string;
  /**
   * What each slide IS, e.g. «اسلاید». Required, and applied to every
   * `<CarouselItem>` through context so it cannot be forgotten on one of them.
   */
  slideRoleDescription: string;
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical" | undefined;
  setApi?: ((api: CarouselApi) => void) | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Carousel({
  locale,
  label,
  roleDescription,
  slideRoleDescription,
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: CarouselProps) {
  const isRtl = direction(locale) === "rtl";

  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
      // Derived, never passed. embla defaults to 'ltr' and has no way to notice
      // that the document around it reads the other way.
      direction: isRtl ? "rtl" : "ltr",
    },
    plugins,
  );
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((current: CarouselApi) => {
    if (!current) return;
    setCanScrollPrev(current.canScrollPrev());
    setCanScrollNext(current.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        // In Persian the left arrow advances, because "forward" is leftward.
        if (isRtl) scrollNext();
        else scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isRtl) scrollPrev();
        else scrollNext();
      }
    },
    [scrollPrev, scrollNext, isRtl],
  );

  React.useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      // Upstream detaches only "select". Both are attached, so both come off, or
      // a remounted carousel accumulates handlers on a live embla instance.
      api.off("reInit", onSelect);
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        orientation,
        slideRoleDescription,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-label={label}
        aria-roledescription={roleDescription}
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

export interface CarouselContentProps extends Omit<React.ComponentProps<"div">, "className"> {
  className?: string | undefined;
}

/**
 * `-ms-4` / `-mt-4` cancel the per-item gutter. Logical on the inline axis, so
 * the negative margin lands on the same physical edge as the items' padding in
 * either script; upstream's `-ml-4` would double the gap on one side and clip on
 * the other under RTL.
 */
export function CarouselContent({ className, ...props }: CarouselContentProps) {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div ref={carouselRef} className="overflow-hidden" data-slot="carousel-content">
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ms-4" : "-mt-4 flex-col",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export interface CarouselItemProps
  extends Omit<
    React.ComponentProps<"div">,
    "className" | "aria-label" | "role" | "aria-roledescription"
  > {
  className?: string | undefined;
  /** Owned by Carousel context; cannot be overridden per slide. */
  "aria-roledescription"?: undefined;
  /**
   * Announced name of this slide, e.g. «کفش ورزشی مدل آلفا». REQUIRED.
   *
   * ── A ROLEDESCRIPTION WITHOUT A NAME ANNOUNCES ONE WORD ──────────────────
   *
   * `aria-roledescription` REPLACES the role in the announcement. With no
   * accessible name, this element is read out as «اسلاید» and nothing else —
   * so a reader arrowing through a carousel hears the same word once per
   * slide and learns nothing. Measured on the built export before this prop
   * existed: 18 of 23 roledescribed elements on the carousel page computed an
   * EMPTY name, and `named-roledescription` fires on exactly that.
   *
   * A heading inside the slide does NOT fix it, which is the trap. `group` is
   * not a name-from-content role, so its content is not consulted — the name
   * has to be on this element. There is a test pinning that, because the
   * obvious fix is the wrong one.
   *
   * Required rather than defaulted, like every announced string here: a
   * default would be English, and «اسلاید ۱» invented by the library is a
   * position, not a name. The caller knows what is on the slide.
   */
  label: string;
}

export function CarouselItem({ className, label, ...props }: CarouselItemProps) {
  const { orientation, slideRoleDescription } = useCarousel();

  return (
    <div
      role="group"
      // Persian, from the one prop on <Carousel>. Upstream hardcodes "slide".
      aria-roledescription={slideRoleDescription}
      aria-label={label}
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "ps-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
}

export interface CarouselControlProps
  extends Omit<React.ComponentProps<typeof IconButton>, "children" | "label"> {
  /** Announced name, e.g. «اسلاید قبلی». Required: a chevron is not a name. */
  label: string;
}

/**
 * `-start-12` / `-end-12` are `inset-inline-*`, so "previous" sits at the
 * reading start in both scripts — left in English, RIGHT in Persian — which is
 * the side embla's `scrollPrev` actually moves toward once `direction: 'rtl'`
 * is set. Upstream's `-left-12` pins it to the same physical edge in both, so in
 * Persian the back button sits where the carousel is heading.
 *
 * The vertical case centres with `start-0 end-0 mx-auto` rather than
 * `left-1/2 -translate-x-1/2`: both inline insets are zero, so the box is
 * direction-invariant and `margin-inline: auto` does the centring. `translate-x`
 * has no logical form and would need an `ltr:`/`rtl:` pair to say the same thing.
 */
export function CarouselPrevious({ label, className, ...props }: CarouselControlProps) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <IconButton
      data-slot="carousel-previous"
      label={label}
      variant="outline"
      size="sm"
      className={cn(
        "absolute touch-manipulation rounded-full",
        orientation === "horizontal"
          ? "inset-y-0 -start-12 my-auto"
          : "-top-12 start-0 end-0 mx-auto",
        className,
      )}
      isDisabled={!canScrollPrev}
      onPress={scrollPrev}
      {...props}
    >
      {orientation === "horizontal" ? (
        <span aria-hidden="true">‹</span>
      ) : (
        <ChevronUpIcon aria-hidden="true" />
      )}
    </IconButton>
  );
}

export function CarouselNext({ label, className, ...props }: CarouselControlProps) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <IconButton
      data-slot="carousel-next"
      label={label}
      variant="outline"
      size="sm"
      className={cn(
        "absolute touch-manipulation rounded-full",
        orientation === "horizontal"
          ? "inset-y-0 -end-12 my-auto"
          : "-bottom-12 start-0 end-0 mx-auto",
        className,
      )}
      isDisabled={!canScrollNext}
      onPress={scrollNext}
      {...props}
    >
      {orientation === "horizontal" ? (
        <span aria-hidden="true">›</span>
      ) : (
        <ChevronDownIcon aria-hidden="true" />
      )}
    </IconButton>
  );
}

export type { CarouselApi };
