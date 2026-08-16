"use client";

import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn, direction, type Locale, type LumoNode } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";

/**
 * A slide carousel, over embla.
 *
 *     <Carousel locale={locale} label="پیشنهادهای ویژه" roleDescription="چرخ‌فلک" slideRoleDescription="اسلاید">
 *       <CarouselContent><CarouselItem label="…">…</CarouselItem></CarouselContent>
 *       <CarouselPrevious label="اسلاید قبلی" />
 *       <CarouselNext label="اسلاید بعدی" />
 *     </Carousel>
 *
 * Three silent upstream defects in Persian: hardcoded English `aria-roledescription`
 * ("carousel"/"slide") — required props here, on `<Carousel>` so no item forgets; embla's
 * `direction` defaults to `'ltr'` — derived from the locale, no `dir` prop; and ArrowLeft
 * → previous, which is backwards in RTL. Horizontal chevrons are the `Bidi_Mirrored` pair
 * `‹`/`›`, so the glyph flips with no CSS; vertical ones are lucide (block axis, no mirror).
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
  /** Embla carousel options, forwarded to the engine. */
  opts?: CarouselOptions;
  /** Embla plugins, forwarded to the engine. */
  plugins?: CarouselPlugin;
  /** The scroll axis. */
  orientation?: "horizontal" | "vertical" | undefined;
  /** Receives the embla API once the carousel mounts. */
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
      // Derived, never passed. embla defaults to 'ltr'.
      direction: isRtl ? "rtl" : "ltr",
    },
    plugins,
  );
  // embla is an external store: subscribe to its `select`/`reInit` and read
  // `canScroll*` as snapshots, rather than mirroring them into state from an effect.
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      if (!api) return () => {};
      api.on("reInit", onChange);
      api.on("select", onChange);
      return () => {
        // Upstream detaches only "select"; both are attached, so both come off.
        api.off("reInit", onChange);
        api.off("select", onChange);
      };
    },
    [api],
  );
  const canScrollPrev = React.useSyncExternalStore(
    subscribe,
    () => api?.canScrollPrev() ?? false,
    () => false,
  );
  const canScrollNext = React.useSyncExternalStore(
    subscribe,
    () => api?.canScrollNext() ?? false,
    () => false,
  );

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

/** `-ms-4` / `-mt-4` cancel the per-item gutter; logical, so it lands on the right edge in either script. */
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
   * Announced name of this slide, e.g. «کفش ورزشی مدل آلفا». REQUIRED: `aria-roledescription`
   * REPLACES the role, so an unnamed slide is read as «اسلاید» and nothing else. A heading
   * inside does NOT fix it — `group` is not a name-from-content role.
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
 * `-start-12` / `-end-12` are `inset-inline-*`, so "previous" sits at the reading start in
 * both scripts — the side embla's `scrollPrev` moves toward under `direction: 'rtl'`. The
 * vertical case centres with `start-0 end-0 mx-auto`; `translate-x` has no logical form.
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
