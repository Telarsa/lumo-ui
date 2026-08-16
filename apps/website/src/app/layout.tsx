/**
 * Next requires a root layout, but every page lives under `[lang]`, whose layout
 * writes the real `<html>` — so this one must pass children through untouched.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
