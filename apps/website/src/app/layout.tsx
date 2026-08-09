/**
 * Next requires a root layout, but every real page lives under `[lang]`, whose
 * layout writes the actual `<html>` element. This one must therefore render its
 * children untouched — wrapping them in a second `<html>` would nest documents.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
