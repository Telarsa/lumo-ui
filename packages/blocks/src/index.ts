/**
 * `@lumo-ui/blocks` — whole screen sections composed from `@lumo-ui/ui`.
 *
 * The contract every file here obeys is written out once, at the top of
 * `sign-in.tsx`. The short version: a block takes ALL of its text as a required
 * `strings` prop, so a missing translation is TS2741 in the editor rather than
 * an English word a Persian reader finds in production.
 *
 * Types are exported beside their components — a consumer building a
 * translation dictionary imports `SignInStrings` and lets `tsc` tell them what
 * is missing, which is the whole reason each block has a named interface rather
 * than an inline object type.
 */

export { SignIn } from "./sign-in.tsx";
export type { SignInProps, SignInStrings } from "./sign-in.tsx";

export { SignUp } from "./sign-up.tsx";
export type { SignUpProps, SignUpStrings } from "./sign-up.tsx";

export { OtpVerify } from "./otp-verify.tsx";
export type { OtpVerifyProps, OtpVerifyStrings } from "./otp-verify.tsx";

export { AppShell } from "./app-shell.tsx";
export type { AppShellNavItem, AppShellProps, AppShellStrings } from "./app-shell.tsx";

export { PageHeader } from "./page-header.tsx";
export type { PageHeaderCrumb, PageHeaderProps, PageHeaderStrings } from "./page-header.tsx";

export { StatGrid } from "./stat-grid.tsx";
export type { StatGridProps, StatGridStrings, StatItem } from "./stat-grid.tsx";

export { ChartPanel } from "./chart-panel.tsx";
export type {
  ChartPanelProps,
  ChartPanelStrings,
  ChartPanelSummaryItem,
} from "./chart-panel.tsx";

export { ActivityFeed } from "./activity-feed.tsx";
export type {
  ActivityFeedProps,
  ActivityFeedStrings,
  ActivityItem,
} from "./activity-feed.tsx";

export { FilterBar } from "./filter-bar.tsx";
export type {
  ActiveFilter,
  FilterBarProps,
  FilterBarStrings,
  FilterDefinition,
  FilterOption,
} from "./filter-bar.tsx";

export { ListDetail } from "./list-detail.tsx";
export type { ListDetailItem, ListDetailProps, ListDetailStrings } from "./list-detail.tsx";

export { DataToolbar } from "./data-toolbar.tsx";
export type {
  DataToolbarProps,
  DataToolbarStrings,
  DataToolbarView,
  SortOption,
} from "./data-toolbar.tsx";

export { EmptyCollection } from "./empty-collection.tsx";
export type {
  EmptyCollectionHint,
  EmptyCollectionProps,
  EmptyCollectionStrings,
} from "./empty-collection.tsx";

export { ListingGrid } from "./listing-grid.tsx";
export type {
  Listing,
  ListingGridProps,
  ListingGridStrings,
  ListingImage,
} from "./listing-grid.tsx";

export { BookingSummary } from "./booking-summary.tsx";
export type {
  BookingLine,
  BookingSummaryProps,
  BookingSummaryStrings,
} from "./booking-summary.tsx";

export { SettingsForm } from "./settings-form.tsx";
export type {
  SettingsFormProps,
  SettingsFormStatus,
  SettingsFormStrings,
} from "./settings-form.tsx";

export { DangerZone } from "./danger-zone.tsx";
export type { DangerZoneProps, DangerZoneStrings } from "./danger-zone.tsx";

export { Hero } from "./hero.tsx";
export type { HeroProps, HeroStrings } from "./hero.tsx";

export { FeatureGrid } from "./feature-grid.tsx";
export type { Feature, FeatureGridProps, FeatureGridStrings } from "./feature-grid.tsx";

export { PricingTable } from "./pricing-table.tsx";
export type {
  PricingFeature,
  PricingPlan,
  PricingTableProps,
  PricingTableStrings,
} from "./pricing-table.tsx";

export { Faq } from "./faq.tsx";
export type { FaqItem, FaqProps, FaqStrings } from "./faq.tsx";

export { RequestPasswordReset, SetNewPassword } from "./password-reset.tsx";
export type {
  RequestPasswordResetProps,
  RequestPasswordResetStatus,
  RequestPasswordResetStrings,
  SetNewPasswordProps,
  SetNewPasswordStrings,
} from "./password-reset.tsx";

export { TwoFactor } from "./two-factor.tsx";
export type { TwoFactorMode, TwoFactorProps, TwoFactorStrings } from "./two-factor.tsx";

export { CommandPalette } from "./command-palette.tsx";
export type {
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteProps,
  CommandPaletteStrings,
} from "./command-palette.tsx";

export { TableView } from "./table-view.tsx";
export type {
  TableViewColumn,
  TableViewPagination,
  TableViewProps,
  TableViewStrings,
} from "./table-view.tsx";

export { ProductDetail } from "./product-detail.tsx";
export type {
  ProductDetailProps,
  ProductDetailStrings,
  ProductImage,
  ProductSpec,
  ProductStockState,
  ProductVariantGroup,
  ProductVariantOption,
} from "./product-detail.tsx";

export { CheckoutSummary } from "./checkout-summary.tsx";
export type {
  CheckoutCharge,
  CheckoutItem,
  CheckoutSummaryProps,
  CheckoutSummaryStrings,
} from "./checkout-summary.tsx";

export { Preferences } from "./preferences.tsx";
export type {
  PreferenceControl,
  PreferenceGroup,
  PreferenceItem,
  PreferenceRadioOption,
  PreferenceSelectOption,
  PreferencesProps,
  PreferencesStrings,
} from "./preferences.tsx";

export { Footer } from "./footer.tsx";
export type { FooterLink, FooterLinkGroup, FooterProps, FooterStrings } from "./footer.tsx";
