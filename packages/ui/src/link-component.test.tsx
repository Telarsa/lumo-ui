/**
 * `LumoProvider linkComponent` — one seam for the app's router link. Client
 * families read it from context; the server-safe `Link` takes it as a prop and
 * the client wrappers (`NavigationMenuLink`, `SidebarItem`) inject it. Default:
 * the platform `<a>` — proved too, so a provider without the prop changes nothing.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { LumoProvider } from "./provider.tsx";
import { Link } from "./link.tsx";
import { Item } from "./item.tsx";
import { Sidebar, SidebarContent, SidebarGroup, SidebarItem } from "./sidebar.tsx";
import type { LumoLinkRenderProps } from "./link-context.ts";

afterEach(cleanup);

/** A stand-in for Next's / a router's Link: it must forward the anchor props it is given. */
function RouterLink({ href, children, ...rest }: LumoLinkRenderProps) {
  return (
    <a data-router-link="" href={href} {...(rest as object)}>
      {children}
    </a>
  );
}

describe("the app's link component reaches every anchor Lumo renders", () => {
  it("Link takes it as a prop and keeps its own attributes (className, aria-current, target/rel)", () => {
    render(
      <Link href="/x" linkComponent={RouterLink} isCurrent="page" newTab newTabLabel="در برگهٔ تازه">
        خانه
      </Link>,
    );
    const a = screen.getByRole("link");
    expect(a.hasAttribute("data-router-link")).toBe(true);
    expect(a.getAttribute("href")).toBe("/x");
    expect(a.getAttribute("aria-current")).toBe("page");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toContain("noopener");
  });

  it("Item and SidebarItem read it from the provider", () => {
    render(
      <LumoProvider locale="fa-IR" linkComponent={RouterLink}>
        <Item href="/orders">سفارش‌ها</Item>
        <Sidebar label="ناوبری">
          <SidebarContent>
            <SidebarGroup title="گزارش‌ها">
              <SidebarItem href="/dash" icon={<svg aria-hidden="true" />}>داشبورد</SidebarItem>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </LumoProvider>,
    );
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) expect(link.hasAttribute("data-router-link"), link.outerHTML).toBe(true);
  });

  it("without the prop everything is a platform <a>, in the first byte", () => {
    const html = renderToStaticMarkup(
      <LumoProvider locale="fa-IR">
        <Item href="/orders">سفارش‌ها</Item>
        <Link href="/x">خانه</Link>
      </LumoProvider>,
    );
    expect(html.match(/<a /g)?.length).toBe(2);
    expect(html).not.toContain("data-router-link");
  });
});
