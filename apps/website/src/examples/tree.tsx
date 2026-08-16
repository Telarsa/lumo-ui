import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { FileText, Folder, Image } from "lucide-react";
import { Tree, TreeItem } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the tree page. Contract: `_system/types.ts` — each render
 * is a named top-level function so the loader can slice its source.
 *
 * A server module. `Tree` is a client component, but every prop below is a
 * string or an array of strings, so these prerender — which matters more here
 * than usual: the rows, their names and their `aria-level`s are all in the
 * served bytes, so `lumo-gate` grades a Persian hierarchy rather than an empty
 * box.
 */

const t = {
  filesLabel: { "fa-IR": "پرونده‌های پروژه", "en-US": "Project files" },
  documents: { "fa-IR": "اسناد", "en-US": "Documents" },
  salesReport: { "fa-IR": "گزارش فروش", "en-US": "Sales report" },
  contracts: { "fa-IR": "قراردادها", "en-US": "Contracts" },
  supplierContract: { "fa-IR": "قرارداد تأمین‌کننده", "en-US": "Supplier contract" },
  images: { "fa-IR": "تصویرها", "en-US": "Images" },
  cover: { "fa-IR": "جلد", "en-US": "Cover" },
  charts: { "fa-IR": "نمودارها", "en-US": "Charts" },

  categoriesLabel: { "fa-IR": "درخت دسته‌بندی کالا", "en-US": "Product category tree" },
  home: { "fa-IR": "خانه و آشپزخانه", "en-US": "Home and kitchen" },
  cookware: { "fa-IR": "ظروف پخت‌وپز", "en-US": "Cookware" },
  pans: { "fa-IR": "ماهیتابه", "en-US": "Pans" },
  pots: { "fa-IR": "قابلمه", "en-US": "Pots" },
  textiles: { "fa-IR": "منسوجات خانگی", "en-US": "Home textiles" },
  digital: { "fa-IR": "کالای دیجیتال", "en-US": "Digital goods" },

  teamLabel: { "fa-IR": "ساختار تیم", "en-US": "Team structure" },
  product: { "fa-IR": "محصول", "en-US": "Product" },
  design: { "fa-IR": "طراحی", "en-US": "Design" },
  research: { "fa-IR": "پژوهش", "en-US": "Research" },
  engineering: { "fa-IR": "مهندسی", "en-US": "Engineering" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <Tree
      label={t.filesLabel[l]}
      defaultExpandedKeys={["documents"]}
      selectionMode="single"
      className="w-full max-w-sm"
    >
      <TreeItem id="documents" textValue={t.documents[l]} title={t.documents[l]}>
        <TreeItem id="report" textValue={t.salesReport[l]} title={t.salesReport[l]} />
        <TreeItem id="contracts" textValue={t.contracts[l]} title={t.contracts[l]}>
          <TreeItem
            id="supplier"
            textValue={t.supplierContract[l]}
            title={t.supplierContract[l]}
          />
        </TreeItem>
      </TreeItem>
      <TreeItem id="images" textValue={t.images[l]} title={t.images[l]}>
        <TreeItem id="cover" textValue={t.cover[l]} title={t.cover[l]} />
      </TreeItem>
      <TreeItem id="charts" textValue={t.charts[l]} title={t.charts[l]} />
    </Tree>
  );
}

function IconsExample(l: Locale) {
  return (
    <Tree
      label={t.filesLabel[l]}
      defaultExpandedKeys={["documents", "images"]}
      selectionMode="single"
      className="w-full max-w-sm"
    >
      <TreeItem
        id="documents"
        textValue={t.documents[l]}
        title={
          <span className="flex items-center gap-2">
            <Folder aria-hidden="true" className="text-fg-muted" />
            {t.documents[l]}
          </span>
        }
      >
        <TreeItem
          id="report"
          textValue={t.salesReport[l]}
          title={
            <span className="flex items-center gap-2">
              <FileText aria-hidden="true" className="text-fg-muted" />
              {t.salesReport[l]}
            </span>
          }
        />
      </TreeItem>
      <TreeItem
        id="images"
        textValue={t.images[l]}
        title={
          <span className="flex items-center gap-2">
            <Folder aria-hidden="true" className="text-fg-muted" />
            {t.images[l]}
          </span>
        }
      >
        <TreeItem
          id="cover"
          textValue={t.cover[l]}
          title={
            <span className="flex items-center gap-2">
              <Image aria-hidden="true" className="text-fg-muted" />
              {t.cover[l]}
            </span>
          }
        />
      </TreeItem>
    </Tree>
  );
}

function DeepExample(l: Locale) {
  return (
    <Tree
      label={t.categoriesLabel[l]}
      defaultExpandedKeys={["home", "cookware"]}
      selectionMode="single"
      className="w-full max-w-sm"
    >
      <TreeItem id="home" textValue={t.home[l]} title={t.home[l]}>
        <TreeItem id="cookware" textValue={t.cookware[l]} title={t.cookware[l]}>
          <TreeItem id="pans" textValue={t.pans[l]} title={t.pans[l]} />
          <TreeItem id="pots" textValue={t.pots[l]} title={t.pots[l]} />
        </TreeItem>
        <TreeItem id="textiles" textValue={t.textiles[l]} title={t.textiles[l]} />
      </TreeItem>
      <TreeItem id="digital" textValue={t.digital[l]} title={t.digital[l]} />
    </Tree>
  );
}

function MultipleExample(l: Locale) {
  return (
    <Tree
      label={t.teamLabel[l]}
      defaultExpandedKeys={["product"]}
      defaultSelectedKeys={["design"]}
      selectionMode="multiple"
      className="w-full max-w-sm"
    >
      <TreeItem id="product" textValue={t.product[l]} title={t.product[l]}>
        <TreeItem id="design" textValue={t.design[l]} title={t.design[l]} />
        <TreeItem id="research" textValue={t.research[l]} title={t.research[l]} />
      </TreeItem>
      <TreeItem id="engineering" textValue={t.engineering[l]} title={t.engineering[l]} />
    </Tree>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "فهرستی تودرتو که در جای خود با صفحه‌کلید و تایپ‌یاب مرور می‌شود: درخت پرونده، طرح کلی دسته‌ها.",
        "en-US": "A nested list browsed in place with keyboard and typeahead: a file tree, a category outline.",
      },
      whenNot: {
        "fa-IR": "انتخاب برای یک فیلد فرم — `TreeSelect`. یک مسیر — `Cascader`. بخش‌هایی که باز و بسته می‌شوند — `Disclosure`. ناوبری برنامه — `Sidebar`.",
        "en-US": "Selecting into a form field — `TreeSelect`. One path — `Cascader`. Sections that open and close — `Disclosure`. Application navigation — `Sidebar`.",
      },
    },
    tier: "data",
    isNew: true,
    title: { "fa-IR": "درخت", "en-US": "Tree" },
    intro: {
      "fa-IR":
        "فهرست تودرتو با پیمایش صفحه‌کلید و جست‌وجوی تایپی. جهت کلیدهای باز و بسته کردن از زبان صفحه می‌آید — در فارسی چپ باز می‌کند — و نشانگر باز و بسته با نویسهٔ آینه‌شوندهٔ یونیکد کشیده می‌شود، نه با وارونه‌کردن تصویر.",
      "en-US":
        "A nested list with keyboard navigation and typeahead. Which arrow expands comes from the page's language — in Persian it is the left one — and the marker is drawn with a Unicode character that mirrors itself rather than with a flipped image.",
    },
    composition: [
      `<Tree label defaultExpandedKeys selectionMode>`,
      `  <TreeItem id textValue title>   ← textValue is the name AND the typeahead key`,
      `    <TreeItem id textValue title />`,
      `  </TreeItem>`,
      `</Tree>`,
    ].join("\n"),
    parts: [
      {
        name: "Tree",
        description: {
          "fa-IR":
            "خودِ درخت. label الزامی است چون موتور این ناحیه را بی‌نام می‌سازد و یک درختِ بی‌نام فقط «جدول درختی» خوانده می‌شود.",
          "en-US":
            "The tree itself. label is required because React Aria leaves the region unnamed, and an unnamed one is announced as bare «tree grid».",
        },
      },
      {
        name: "TreeItem",
        description: {
          "fa-IR":
            "یک ردیف. textValue هم نام اعلام‌شده است و هم کلید جست‌وجوی تایپی؛ title چیزی است که دیده می‌شود و می‌تواند آیکون و شمارنده هم داشته باشد.",
          "en-US":
            "One row. textValue is both the announced name and the typeahead key; title is what is drawn and may carry an icon or a count.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR":
          "تورفتگی از ویژگی سفارشی خودِ موتور می‌آید و روی محور منطقی اعمال می‌شود، پس در فارسی از راست پله می‌خورد بدون هیچ قاعدهٔ جداگانه.",
        "en-US":
          "The indent comes from React Aria's own custom property and is applied on the logical axis, so a Persian tree steps in from the right with no separate rule.",
      },
      render: BasicExample,
    },
    {
      id: "icons",
      title: { "fa-IR": "با آیکون", "en-US": "With icons" },
      description: {
        "fa-IR":
          "آیکون در title می‌نشیند و نه در textValue: چیزی که تایپ می‌شود باید فقط نام باشد. آیکون‌ها از درخت دسترس‌پذیری بیرون‌اند.",
        "en-US":
          "The icon goes in title and never in textValue: what typing matches must be the name alone. The icons stay out of the accessibility tree.",
      },
      render: IconsExample,
    },
    {
      id: "deep",
      title: { "fa-IR": "سه سطح", "en-US": "Three levels" },
      description: {
        "fa-IR":
          "هر سطح یک پله تورفتگی می‌گیرد و ردیف‌های بی‌فرزند یک جای خالی به اندازهٔ نشانگر، تا نام‌ها در یک سطح هم‌تراز بمانند.",
        "en-US":
          "Each level takes one step of indent, and a childless row takes a spacer the width of the marker so names at one level stay aligned.",
      },
      render: DeepExample,
    },
    {
      id: "multiple",
      title: { "fa-IR": "انتخاب چندتایی", "en-US": "Multiple selection" },
      description: {
        "fa-IR":
          "انتخاب و باز کردن دو کار جدا هستند: نشانگر دکمهٔ خودش را دارد، پس فشردن ردیف هرگز به‌طور اتفاقی شاخه را باز نمی‌کند.",
        "en-US":
          "Selecting and expanding are separate: the marker is its own button, so pressing a row never expands a branch by accident.",
      },
      render: MultipleExample,
    },
  ],
};
