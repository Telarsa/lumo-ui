export type SiteTheme = "light" | "dark";
export function themeScript(): string;
export function getSiteTheme(): SiteTheme;
export function setSiteTheme(theme: SiteTheme): void;
