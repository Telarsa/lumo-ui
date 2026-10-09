import type { Locale } from "./site";

type LegalCopy = {
  eyebrow: string; updated: string; company: string; name: string; registration: string; nationalId: string; contact: string;
  imprint: { title: string; lead: string; relationship: string; incomplete: string };
  privacy: { title: string; lead: string; sections: { title: string; body: string; code?: string }[] };
};

export const legalCopy: Record<Locale, LegalCopy> = {
  en: {
    eyebrow: "Website information", updated: "Updated", company: "Website operator", name: "Registered company name", registration: "Registration number", nationalId: "National ID", contact: "Contact",
    imprint: {
      title: "Legal notice", lead: "Lumo UI is a Telarsa project. This website introduces Lumo UI and provides its documentation.",
      relationship: "Lumo UI, including the source of this website, is available under the MIT licence. The Lumo UI and Telarsa names and logos remain trademarks of Telarsa, and the fonts keep their own licences.",
      incomplete: "These are the company details currently confirmed. The registered address and authorized representative have not yet been supplied; the legal notice will be completed before public launch.",
    },
    privacy: {
      title: "Website privacy", lead: "This notice covers the Lumo UI marketing and documentation website. It does not describe data processed by an application that uses Lumo UI.",
      sections: [
        { title: "Reading this website", body: "The website has no analytics, advertising trackers, contact forms, user accounts or third-party embeds. Its fonts and documentation assets are served by the website itself." },
        { title: "Theme preference", body: "When you choose a theme, the website stores that preference in your browser. It is not sent to Telarsa. You can remove it by clearing this website’s local storage.", code: "lumo-theme" },
        { title: "Documentation examples", body: "Interactive examples run in your browser. Selecting a date or changing an example does not submit that value to Telarsa." },
        { title: "Hosting and requests", body: "Serving a page requires the hosting server to receive network information, including your IP address and the requested URL. This preview has no confirmed public hosting configuration. The public host, any retained request logs and their retention periods must be recorded here before launch." },
        { title: "Contacting us", body: "An email link opens your own email application. If you send Telarsa a message, your address and message are used to respond and handle the conversation. The public launch notice will specify the email service and retention arrangements." },
        { title: "Other websites", body: "Links to GitHub and Telarsa take you to separate websites with their own privacy information. No GitHub content is embedded into this documentation." },
        { title: "Privacy questions", body: "Contact the website operator below to ask about personal information or exercise rights available under applicable law, including access, correction or deletion. Deployment details and any additional disclosures will be confirmed before this preview is published." },
      ],
    },
  },
  de: {
    eyebrow: "Informationen zur Website", updated: "Stand", company: "Betreiber der Website", name: "Eingetragener Firmenname", registration: "Registrierungsnummer", nationalId: "Nationale Unternehmenskennung", contact: "Kontakt",
    imprint: {
      title: "Impressum", lead: "Lumo UI ist ein Projekt von Telarsa. Diese Website stellt Lumo UI vor und bietet die zugehörige Dokumentation.",
      relationship: "Lumo UI, einschließlich des Quelltexts dieser Website, steht unter der MIT-Lizenz. Die Namen und Logos von Lumo UI und Telarsa bleiben Marken von Telarsa; die Schriften behalten ihre eigenen Lizenzen.",
      incomplete: "Dies sind die bisher bestätigten Unternehmensangaben. Die eingetragene Anschrift und die vertretungsberechtigte Person wurden noch nicht mitgeteilt; das Impressum wird vor der Veröffentlichung vervollständigt.",
    },
    privacy: {
      title: "Datenschutz der Website", lead: "Diese Hinweise gelten für die Marketing- und Dokumentationswebsite von Lumo UI. Sie beschreiben nicht die Datenverarbeitung einer Anwendung, die Lumo UI verwendet.",
      sections: [
        { title: "Besuch der Website", body: "Die Website enthält keine Analysedienste, Werbetracker, Kontaktformulare, Benutzerkonten oder Einbettungen von Drittanbietern. Schriftarten und Dokumentationsinhalte werden von der Website selbst bereitgestellt." },
        { title: "Darstellungseinstellung", body: "Wenn Sie eine Darstellung auswählen, speichert die Website diese Einstellung in Ihrem Browser. Sie wird nicht an Telarsa gesendet. Sie können sie durch Löschen des lokalen Speichers dieser Website entfernen.", code: "lumo-theme" },
        { title: "Dokumentationsbeispiele", body: "Interaktive Beispiele laufen in Ihrem Browser. Eine Datumsauswahl oder eine Änderung im Beispiel übermittelt den Wert nicht an Telarsa." },
        { title: "Hosting und Seitenaufrufe", body: "Zur Auslieferung einer Seite empfängt der Hosting-Server Netzwerkdaten, darunter Ihre IP-Adresse und die aufgerufene URL. Für diese Vorschau steht das öffentliche Hosting noch nicht fest. Anbieter, gegebenenfalls gespeicherte Zugriffsprotokolle und Aufbewahrungsfristen müssen hier vor der Veröffentlichung ergänzt werden." },
        { title: "Kontaktaufnahme", body: "Ein E-Mail-Link öffnet Ihr eigenes E-Mail-Programm. Wenn Sie Telarsa schreiben, werden Ihre Adresse und Nachricht zur Beantwortung und Bearbeitung des Gesprächs verwendet. Vor der Veröffentlichung werden der E-Mail-Dienst und die Aufbewahrung geregelt und hier beschrieben." },
        { title: "Andere Websites", body: "Links zu GitHub und Telarsa führen zu eigenständigen Websites mit eigenen Datenschutzhinweisen. Inhalte von GitHub sind nicht in diese Dokumentation eingebettet." },
        { title: "Fragen zum Datenschutz", body: "Wenden Sie sich an den unten genannten Betreiber, um Fragen zu personenbezogenen Informationen zu stellen oder Rechte nach dem anwendbaren Recht auszuüben, etwa Auskunft, Berichtigung oder Löschung. Angaben zum Betrieb und weitere erforderliche Informationen werden vor der Veröffentlichung dieser Vorschau bestätigt." },
      ],
    },
  },
  fa: {
    eyebrow: "اطلاعات وب‌سایت", updated: "آخرین به‌روزرسانی", company: "مسئول وب‌سایت", name: "نام ثبتی شرکت", registration: "شماره ثبت", nationalId: "شناسه ملی", contact: "تماس",
    imprint: {
      title: "اطلاعات حقوقی", lead: "لومو یوآی یکی از پروژه‌های تلارسا است. این وب‌سایت لومو یوآی را معرفی می‌کند و مستندات آن را در اختیار شما می‌گذارد.",
      relationship: "لومو یوآی، از جمله کد منبع همین وب‌سایت، با مجوز [[MIT]] ارائه می‌شود. نام و نشان لومو یوآی و تلارسا علامت تجاری تلارسا می‌ماند و قلم‌ها مجوز جداگانهٔ خود را دارند.",
      incomplete: "این‌ها اطلاعات تأییدشده شرکت تا این زمان هستند. نشانی ثبتی و نام نماینده قانونی هنوز ارائه نشده‌اند؛ اطلاعات حقوقی پیش از انتشار عمومی تکمیل خواهد شد.",
    },
    privacy: {
      title: "حریم خصوصی وب‌سایت", lead: "این متن مربوط به وب‌سایت معرفی محصول و مستندات لومو یوآی است. پردازش داده در برنامه‌هایی که از لومو یوآی استفاده می‌کنند، موضوع این متن نیست.",
      sections: [
        { title: "بازدید از وب‌سایت", body: "این وب‌سایت ابزار تحلیل بازدید، ردیاب تبلیغاتی، فرم تماس، حساب کاربری یا محتوای جاسازی‌شده از سرویس‌های دیگر ندارد. فونت‌ها و دارایی‌های مستندات از خود وب‌سایت دریافت می‌شوند." },
        { title: "تنظیم ظاهر", body: "وقتی ظاهر وب‌سایت را انتخاب می‌کنید، این تنظیم در مرورگر شما ذخیره می‌شود و به تلارسا ارسال نمی‌شود. با پاک‌کردن حافظه محلی این وب‌سایت می‌توانید آن را حذف کنید.", code: "lumo-theme" },
        { title: "نمونه‌های مستندات", body: "نمونه‌های تعاملی در مرورگر شما اجرا می‌شوند. انتخاب تاریخ یا تغییر یک نمونه، آن مقدار را به تلارسا ارسال نمی‌کند." },
        { title: "میزبانی و درخواست‌ها", body: "برای نمایش صفحه، سرور میزبان اطلاعات شبکه از جمله نشانی آی‌پی شما و نشانی صفحه درخواستی را دریافت می‌کند. میزبانی عمومی این پیش‌نمایش هنوز تأیید نشده است. نام میزبان، هرگونه گزارش ذخیره‌شده درخواست‌ها و مدت نگهداری آن‌ها باید پیش از انتشار در این صفحه ثبت شود." },
        { title: "تماس با ما", body: "پیوند ایمیل، برنامه ایمیل خود شما را باز می‌کند. اگر به تلارسا پیام بفرستید، نشانی و متن پیام شما برای پاسخ‌دادن و پیگیری گفتگو استفاده می‌شود. سرویس ایمیل و شیوه نگهداری پیام‌ها پیش از انتشار عمومی در این متن مشخص خواهد شد." },
        { title: "وب‌سایت‌های دیگر", body: "پیوندهای گیت‌هاب و تلارسا شما را به وب‌سایت‌های جداگانه با اطلاعات حریم خصوصی خودشان می‌برند. هیچ محتوایی از گیت‌هاب در این مستندات جاسازی نشده است." },
        { title: "پرسش‌های حریم خصوصی", body: "برای پرسش درباره اطلاعات شخصی یا استفاده از حقوقی که قانون قابل‌اجرا در اختیار شما می‌گذارد، از جمله دسترسی، اصلاح یا حذف، با مسئول وب‌سایت که در ادامه معرفی شده تماس بگیرید. جزئیات میزبانی و اطلاعات تکمیلی لازم پیش از انتشار این پیش‌نمایش تأیید خواهند شد." },
      ],
    },
  },
};
