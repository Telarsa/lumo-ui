"use client";
import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { Accordion } from "@base-ui/react/accordion";
import { Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
type Item = { label: string; href: string };
export function MobileNav({
  brand,
  openLabel,
  closeLabel,
  title,
  docsLabel,
  home,
  started,
  docs,
  source,
}: {
  brand: string;
  openLabel: string;
  closeLabel: string;
  title: string;
  docsLabel: string;
  home: Item;
  started: Item;
  docs: Item[];
  source: Item;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const media = matchMedia("(min-width: 72rem)");
    const close = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="mobile-menu-trigger control"
        aria-label={openLabel}
      >
        <Menu size={19} aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="mobile-menu-backdrop" />
        <Dialog.Popup className="mobile-menu-sheet">
          <div className="mobile-menu-top">
            <span data-lumo-latn dir="ltr">
              {brand}
            </span>
            <Dialog.Close className="control" aria-label={closeLabel}>
              <X size={19} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <nav aria-label={title} className="mobile-menu-nav">
            <Dialog.Close
              render={<Link href={home.href} />}
              className="mobile-menu-link"
            >
              {home.label}
            </Dialog.Close>
            <Dialog.Close
              render={<Link href={started.href} />}
              className="mobile-menu-link"
            >
              {started.label}
            </Dialog.Close>
            <Accordion.Root>
              <Accordion.Item>
                <Accordion.Header>
                  <Accordion.Trigger className="mobile-menu-link">
                    {docsLabel}
                    <ChevronDown size={18} aria-hidden="true" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel className="mobile-menu-docs">
                  {docs.map((item) => (
                    <Dialog.Close
                      key={item.href}
                      render={<Link href={item.href} />}
                      className="mobile-menu-sublink"
                    >
                      {item.label}
                    </Dialog.Close>
                  ))}
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
            <Dialog.Close
              render={<a href={source.href} />}
              className="mobile-menu-link"
            >
              {source.label}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Dialog.Close>
          </nav>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
