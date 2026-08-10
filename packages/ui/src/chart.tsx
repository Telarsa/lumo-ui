"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type { TooltipValueType, XAxisProps, YAxisProps } from "recharts";

import { cn, formatNumber, type Locale } from "@lumo-ui/core";
// No `"use client"` in that module, so a SERVER-rendered chart panel can call
// the variants and the direction arithmetic. See chart.variants.ts's header,
// which also records everything that was measured about recharts under RTL.
import {
  chartColor,
  chartColorVar,
  chartContainerVariants,
  chartLegendItemVariants,
  chartLegendVariants,
  chartMirror,
  chartStyleSheet,
  chartTickFormatter,
  chartTooltipIndicatorVariants,
  chartTooltipVariants,
  type ChartConfig,
  type ChartMirror,
} from "./chart.variants.ts";

export {
  chartColor,
  chartColorVar,
  chartContainerVariants,
  chartLegendItemVariants,
  chartLegendVariants,
  chartMirror,
  chartStyleSheet,
  chartTickFormatter,
  chartTooltipIndicatorVariants,
  chartTooltipVariants,
};
export type { ChartConfig, ChartMirror };

/**
 * Charts. The one thing no headless library ships, and the reason this file is
 * vendored from shadcn rather than written: ~10.5k characters of recharts
 * plumbing that already works.
 *
 *     <ChartContainer config={config} locale={locale} label="فروش ماهانه">
 *       <BarChart data={data} layout="horizontal">
 *         <CartesianGrid vertical={false} />
 *         <ChartCategoryAxis dataKey="month" />
 *         <ChartValueAxis />
 *         <ChartTooltip content={<ChartTooltipContent />} />
 *         <ChartLegend content={<ChartLegendContent />} />
 *         <Bar dataKey="sales" fill={chartColor("sales")} radius={4} />
 *       </BarChart>
 *     </ChartContainer>
 *
 * ═══ THE GATE CANNOT SEE THIS COMPONENT ═════════════════════════════════════
 *
 * Measured: recharts renders 148 bytes on the server — a `<div>` and no `<svg>`.
 * `lumo-gate` grades the served HTML, so it grades nothing here. Every other
 * component in this library has a second line of defence; this one does not.
 * `chart.test.tsx` mounts the chart and reads the real SVG, and that suite is
 * the ONLY thing standing between a Persian dashboard and an axis of Latin
 * digits. Treat a weakened assertion there as a shipped defect.
 *
 * It also means a route whose only numbers are in a chart will fail
 * `persian-digit-floor` — correctly. The floor asks for Persian digits in the
 * served bytes, and a chart serves none. Put the same figures in a `<Num>`
 * beside the chart, which a screen reader and a no-JS reader can both use
 * anyway.
 *
 * ═══ WHY `locale` AND `label` ARE REQUIRED ══════════════════════════════════
 *
 * `locale` because every tick, every tooltip value and every legend figure is a
 * number, and `LumoNode` cannot reach inside recharts to stop `1,200` — recharts
 * builds those `<text>` nodes itself. A context with a default would render
 * confidently in the wrong numbering system with nothing red anywhere, which is
 * the argument `pagination.tsx` and `progress.tsx` already make.
 *
 * `label` because recharts' accessibility layer emits, measured,
 * `<svg role="application" tabindex="0">`. That is a keyboard-focusable element
 * with a role that tells a screen reader to hand over its own key handling — and
 * without a name it is announced as bare "application". It is the same defect as
 * the 33 unnamed controls, on the one element in the library a user can tab into
 * and get nothing from. The name is cloned onto the chart child because that is
 * the only element whose attributes recharts forwards to that `<svg>`; verified
 * by rendering with `aria-label` and reading the output.
 */

interface ChartContextProps {
  config: ChartConfig;
  locale: Locale;
}

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    // Not user-facing: this is a developer error thrown at mount, never a string
    // a reader sees. The library's no-English rule is about announced strings.
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

const INITIAL_DIMENSION = { width: 320, height: 200 } as const;

export interface ChartContainerProps
  extends Omit<React.ComponentProps<"div">, "children" | "className" | "aria-label"> {
  config: ChartConfig;
  /** The numbering system every tick, tooltip and legend figure is formatted in. */
  locale: Locale;
  /**
   * The chart's announced name, e.g. «فروش ماهانه به تفکیک دسته».
   *
   * REQUIRED. recharts makes the plot a focusable `role="application"`; an
   * unnamed one is a tab stop that announces nothing.
   */
  label: string;
  /** Exactly one recharts chart element. */
  children: React.ReactElement;
  initialDimension?: { width: number; height: number } | undefined;
  className?: string | undefined;
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  locale,
  label,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: ChartContainerProps) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  // recharts forwards unknown props from the chart element straight onto the
  // root `<svg>` (verified: `RootSurface` spreads `otherAttributes`), and that
  // `<svg>` is the element carrying `role="application" tabindex="0"`. Naming
  // the wrapper `<div>` instead would leave the actual tab stop nameless.
  const named = React.cloneElement(
    children as React.ReactElement<{ "aria-label"?: string }>,
    { "aria-label": label },
  );

  return (
    <ChartContext.Provider value={{ config, locale }}>
      <div
        data-lumo=""
        data-slot="chart"
        data-chart={chartId}
        className={cn(chartContainerVariants(), className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>
          {named}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const css = chartStyleSheet(id, config);
  if (!css) return null;
  // The CSS text is built in chart.variants.ts, where config keys are filtered
  // against /^[A-Za-z0-9_-]+$/ before they reach a selector or a property name.
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/* ════════════════════════════════════════════════════════════════════════════
 * AXES
 *
 * `ChartCategoryAxis` and `ChartValueAxis` are Lumo additions, not upstream's.
 * They exist because the two things recharts gets wrong under RTL — the scale
 * direction and the tick text anchor — are both fixed by props the author has to
 * remember on every axis of every chart, and a rule nobody can follow by hand is
 * a rule that fails silently. These make the mirrored path the default path.
 *
 * They work because recharts 3 registers axes through its own store rather than
 * by inspecting `element.type` on its direct children, so a wrapper component is
 * a first-class child. Verified: a wrapper emitted the same reversed, right-hand,
 * Persian-ticked axis as the inline form. Recharts 2 did NOT work this way — if
 * this ever regresses on an upgrade, the axes disappear entirely rather than
 * degrade, so the test asserts on tick text.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Everything a caller may still set. Direction and formatting are ours. */
type AxisPassthrough = Omit<
  YAxisProps,
  "orientation" | "reversed" | "textAnchor" | "tickFormatter" | "ref"
>;

export interface ChartAxisProps extends AxisPassthrough {
  /**
   * The chart's own `layout`. MUST match the value given to the chart, because
   * it decides which of the two axes carries the categories and therefore which
   * one mirrors. Default `"horizontal"`, same as recharts.
   */
  layout?: "horizontal" | "vertical" | undefined;
  /** Passed to `Intl.NumberFormat` for numeric ticks. */
  numberFormat?: Intl.NumberFormatOptions | undefined;
}

/**
 * The axis that carries the categories — X when bars stand up, Y when they lie
 * down. Under RTL the scale reverses, so the first category sits at the reading
 * start.
 */
export function ChartCategoryAxis({
  layout = "horizontal",
  numberFormat,
  ...props
}: ChartAxisProps) {
  const { locale } = useChart();
  const mirror = chartMirror(locale);
  const tickFormatter = chartTickFormatter(locale, numberFormat);

  return layout === "horizontal" ? (
    <RechartsPrimitive.XAxis
      // One cast, stated rather than hidden: XAxis and YAxis share every prop
      // this component exposes, but recharts declares them as two unrelated
      // types, so there is no structural way to write "the props of whichever
      // axis this turns out to be".
      {...(props as XAxisProps)}
      {...mirror.mainAxis}
      tickFormatter={tickFormatter}
    />
  ) : (
    <RechartsPrimitive.YAxis {...props} {...mirror.crossAxis} tickFormatter={tickFormatter} />
  );
}

/**
 * The axis that carries the values — Y when bars stand up, X when they lie down.
 *
 * Its ticks are ALWAYS numbers, which is why `tickFormatter` is not optional
 * here in practice: it is the only thing that reaches the `<text>` recharts
 * builds from the scale domain.
 */
export function ChartValueAxis({
  layout = "horizontal",
  numberFormat,
  ...props
}: ChartAxisProps) {
  const { locale } = useChart();
  const mirror = chartMirror(locale);
  const tickFormatter = chartTickFormatter(locale, numberFormat);

  return layout === "horizontal" ? (
    <RechartsPrimitive.YAxis {...props} {...mirror.crossAxis} tickFormatter={tickFormatter} />
  ) : (
    <RechartsPrimitive.XAxis
      {...(props as XAxisProps)}
      {...mirror.mainAxis}
      tickFormatter={tickFormatter}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * TOOLTIP
 * ═══════════════════════════════════════════════════════════════════════════ */

export type ChartTooltipProps = Omit<
  React.ComponentProps<typeof RechartsPrimitive.Tooltip>,
  "reverseDirection"
>;

/**
 * Upstream re-exports recharts' `Tooltip` unchanged. Lumo wraps it for one
 * reason, measured in `getTooltipTranslate`: the tooltip prefers
 * `coordinate.x + offset`, i.e. the space to the RIGHT of the pointer, and only
 * falls back to the left when it would overflow. In Persian the space ahead of
 * the pointer is the left, so a tooltip that leads the cursor in English trails
 * it in Persian. `reverseDirection.x` swaps the preference and is derived from
 * the locale rather than accepted as a prop.
 */
export function ChartTooltip(props: ChartTooltipProps) {
  const { locale } = useChart();
  return <RechartsPrimitive.Tooltip {...props} {...chartMirror(locale).tooltip} />;
}

type TooltipNameType = number | string;

/**
 * An intersection rather than an `interface extends`, because recharts declares
 * `formatter` differently on `TooltipProps` and on `DefaultTooltipContentProps`
 * and an interface may not extend two types that disagree on a member. Upstream
 * writes the same intersection inline in the parameter position.
 */
export type ChartTooltipContentProps = React.ComponentProps<
  typeof RechartsPrimitive.Tooltip
> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  } & Omit<
    RechartsPrimitive.DefaultTooltipContentProps<TooltipValueType, TooltipNameType>,
    "accessibilityLayer"
  >;

export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: ChartTooltipContentProps) {
  const { config, locale } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string"
        ? (config[label]?.label ?? label)
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div className={cn(chartTooltipVariants(), className)}>
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color ?? item.payload?.fill ?? item.color;

            return (
              <div
                key={index}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-fg-muted",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            chartTooltipIndicatorVariants({ indicator, nested: nestLabel }),
                          )}
                          // `--lumo-chart-swatch`, not `--color-bg`/`--color-border`:
                          // those two names ARE Tailwind theme tokens in this
                          // workspace, so upstream's inline values would shadow
                          // the design system inside every tooltip.
                          style={
                            { "--lumo-chart-swatch": indicatorColor } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-fg-muted">
                          {itemConfig?.label ?? formatName(item.name, locale)}
                        </span>
                      </div>
                      {item.value != null && (
                        // No `font-mono`, and no `tabular-nums`. tokens.css
                        // resets `font-variant-numeric` to `normal` under
                        // `:lang(fa)` because tabular figures are a Latin
                        // typographic idea, and a utility here would out-specify
                        // that reset for arabext digits. `num.tsx` makes the same
                        // omission for the same reason.
                        <span className="font-medium text-fg">
                          {typeof item.value === "number"
                            ? formatNumber(item.value, locale)
                            : String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

/**
 * A series name falls back to recharts' own `name`, which is typed
 * `number | string`. The number case is the one that matters: it renders Latin
 * digits, and it is exactly the case a reviewer never sees because the fallback
 * only fires for series missing from `config`.
 */
function formatName(name: unknown, locale: Locale): string {
  if (name == null) return "";
  if (typeof name === "number") {
    return Number.isFinite(name) ? formatNumber(name, locale) : "";
  }
  return String(name);
}

/* ════════════════════════════════════════════════════════════════════════════
 * LEGEND
 * ═══════════════════════════════════════════════════════════════════════════ */

export const ChartLegend = RechartsPrimitive.Legend;

export type ChartLegendContentProps = React.ComponentProps<"div"> & {
  hideIcon?: boolean;
  nameKey?: string;
} & RechartsPrimitive.DefaultLegendContentProps;

/**
 * `content={<ChartLegendContent />}` is not optional styling.
 *
 * Measured on recharts' DEFAULT legend under `dir="rtl"`: every item is an
 * `<li style="display:inline-block;margin-right:10px">` inside a
 * `<ul style="text-align:left">`, and each swatch is
 * `<svg aria-label="v legend icon">` — the dataKey, in English, in an attribute
 * a screen reader speaks. Three physical properties and a Latin `aria-label`,
 * none of which any prop reaches.
 *
 * This replacement is a flex row, so it mirrors from `direction` alone, and its
 * swatches are `aria-hidden` decoration beside real text.
 */
export function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: ChartLegendContentProps) {
  const { config, locale } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div className={cn(chartLegendVariants({ verticalAlign }), className)}>
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div key={index} className={cn(chartLegendItemVariants())}>
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-[2px] bg-(--lumo-chart-swatch)"
                  style={{ "--lumo-chart-swatch": item.color } as React.CSSProperties}
                />
              )}
              {itemConfig?.label ?? formatName(item.value, locale)}
            </div>
          );
        })}
    </div>
  );
}

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}
