/** The website accepts only explicit light and dark choices. */
export function themeScript() {
  return 'var t="light";try{if(localStorage.getItem("lumo-theme")==="dark")t="dark"}catch(e){}document.documentElement.setAttribute("data-theme",t);var m=document.querySelector(\'meta[name="theme-color"]\');if(m)m.setAttribute("content",t==="dark"?"#101114":"#f8f7f3")';
}

export function getSiteTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function setSiteTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#101114" : "#f8f7f3");
  try { localStorage.setItem("lumo-theme", theme); } catch { /* The selection remains active for this document. */ }
}
