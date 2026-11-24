/** Choose a language for the bare homepage only; explicit localized URLs are never rewritten. */
export function languageForRequest(cookie, acceptLanguage, country) {
  const saved = /(?:^|;\s*)site-language=(en|de|fa)(?=;|$)/.exec(cookie)?.[1];
  if (saved) return saved;

  const languages = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const quality = params.find((param) => /^\s*q=/.test(param));
      const q = quality ? Number(quality.trim().slice(2)) : 1;
      return { language: tag.split("-")[0], q, index };
    })
    .filter(({ language, q }) => ["en", "de", "fa", "*"].includes(language) && q >= 0 && q <= 1);
  const preferred = languages
    .filter(({ language, q }) => language !== "*" && q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)[0]?.language;
  const permits = (language) => {
    const explicit = languages.find((entry) => entry.language === language);
    const wildcard = languages.find((entry) => entry.language === "*");
    return (explicit ?? wildcard)?.q !== 0;
  };
  if (preferred === "fa" || preferred === "de") return preferred;
  if (country === "IR" && permits("fa")) return "fa";
  if (["DE", "AT", "LI"].includes(country) && permits("de")) return "de";
  return preferred ?? "en";
}
