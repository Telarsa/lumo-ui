/** The docs reading order — the nav and every page's prev/next read this one list. */
export const DOCS_ORDER = ["getting-started", "contract", "dates", "gate", "mobile"] as const;

export const DOCS_LABEL: Record<string, Record<string, string>> = {
  "fa-IR": {
    "getting-started": "شروع",
    "contract": "قرارداد مشترک",
    "dates": "تاریخ جلالی",
    "gate": "دروازه",
    "mobile": "موبایل"
  },
  "en-US": {
    "getting-started": "Getting started",
    "contract": "The contract",
    "dates": "Jalali dates",
    "gate": "The gate",
    "mobile": "Mobile"
  }
};
