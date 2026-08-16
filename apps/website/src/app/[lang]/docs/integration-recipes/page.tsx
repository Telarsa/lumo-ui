import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { assertLocale, localeParams } from "@/lib/locale";
import { Bullets, DocSection, DocsShell, P, Snippet, Term } from "../docs-shell";

const DEBOUNCE = `function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [delay, value])

  return debounced
}`;

const MEDIA_QUERY = `function useMediaQuery(query: string, serverMatches: boolean): boolean {
  const subscribe = React.useCallback((notify: () => void) => {
    if (typeof window === "undefined") return () => {}
    const media = window.matchMedia(query)
    media.addEventListener("change", notify)
    return () => media.removeEventListener("change", notify)
  }, [query])

  const getSnapshot = React.useCallback(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
    [query],
  )
  const getServerSnapshot = React.useCallback(() => serverMatches, [serverMatches])

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}`;

const COPY = {
  "en-US": {
    title: "Integration recipes",
    intro: "Small, tested browser hooks to copy into an application when a Lumo-owned abstraction would add more API than value.",
    headings: { policy: "Recipe, component, or dependency?", debounce: "Debounced values", media: "Media queries without a hydration guess" },
    policy: "Lumo owns recurring product behavior and rents hard interaction machines. A ten-line browser adapter belongs beside the product that chooses its policy. These recipes are compiled and behavior-tested in this repository, but they are not exported from @lumo-ui/ui.",
    bullets: [
      "Use a Lumo component when accessibility, localization, or product state must be consistent across applications.",
      "Use an existing engine when it owns focus, overlays, virtualization, parsing, or another failure-prone machine.",
      "Copy a recipe when the behavior is small and the application must choose the policy itself.",
    ],
    debounce: "Use this for delayed local work such as a search request trigger. The cleanup cancels superseded work; cancellation of the request itself still belongs to the async collection controller.",
    media: "The second argument is intentionally required. It is the layout represented by the server HTML, so hydration never invents a viewport and silently changes the first byte.",
    tested: "The executable source and assertions live at",
  },
  "fa-IR": {
    title: "دستورهای یکپارچه‌سازی",
    intro: "هوک‌های کوچک و آزمودهٔ مرورگر که وقتی یک انتزاع متعلق به لومو فقط API را بزرگ می‌کند، باید در برنامه کپی شوند.",
    headings: { policy: "دستور، کامپوننت، یا وابستگی؟", debounce: "مقدار با تأخیر", media: "پرس‌وجوی رسانه بدون حدس هنگام hydration" },
    policy: "لومو رفتار تکرارشوندهٔ محصول را در اختیار می‌گیرد و ماشین‌های تعاملی دشوار را اجاره می‌کند. یک رابط ده‌خطی مرورگر باید کنار محصولی باشد که سیاستش را انتخاب می‌کند. این دستورها در همین مخزن کامپایل و آزمون رفتاری می‌شوند، اما از @lumo-ui/ui صادر نمی‌شوند.",
    bullets: [
      "وقتی دسترس‌پذیری، بومی‌سازی، یا حالت محصول باید میان برنامه‌ها یکسان باشد از کامپوننت لومو استفاده کنید.",
      "وقتی یک موتور فوکوس، لایه‌ها، مجازی‌سازی، تجزیه، یا ماشین خطاپذیر دیگری را در اختیار دارد از همان موتور استفاده کنید.",
      "وقتی رفتار کوچک است و خود برنامه باید سیاست را انتخاب کند، دستور را کپی کنید.",
    ],
    debounce: "برای کار محلی با تأخیر، مثل آغاز درخواست جست‌وجو، از این استفاده کنید. پاک‌سازی، کار قبلی را لغو می‌کند؛ لغو خود درخواست همچنان متعلق به کنترل‌گر مجموعهٔ ناهمگام است.",
    media: "آرگومان دوم عمداً اجباری است. این مقدار چیدمانی است که HTML سرور نشان می‌دهد؛ بنابراین hydration هرگز یک viewport حدس نمی‌زند و نخستین بایت را بی‌صدا تغییر نمی‌دهد.",
    tested: "منبع اجرایی و assertionها در این مسیرها هستند:",
  },
} as const satisfies Record<Locale, unknown>;

export function generateStaticParams() {
  return localeParams;
}

export default async function IntegrationRecipesPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLocale((await params).lang);
  const copy = COPY[lang];
  const sections = ["policy", "debounce", "media"].map((id) => ({
    id,
    label: copy.headings[id as keyof typeof copy.headings],
  }));
  return (
    <DocsShell lang={lang} slug="integration-recipes" title={copy.title} intro={copy.intro} sections={sections}>
      <DocSection id="policy" title={copy.headings.policy}>
        <P>{copy.policy}</P>
        <Bullets items={copy.bullets.map((body, index) => ({ key: String(index), body }))} />
      </DocSection>
      <DocSection id="debounce" title={copy.headings.debounce}>
        <P>{copy.debounce}</P>
        <Snippet code={DEBOUNCE} lang={lang} />
      </DocSection>
      <DocSection id="media" title={copy.headings.media}>
        <P>{copy.media}</P>
        <Snippet code={MEDIA_QUERY} lang={lang} />
        <P>
          {copy.tested} <Term>apps/website/src/recipes/browser-hooks.ts</Term> /{" "}
          <Term>browser-hooks.test.tsx</Term>
        </P>
      </DocSection>
    </DocsShell>
  );
}
