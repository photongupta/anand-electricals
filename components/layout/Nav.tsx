"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const LINKS = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/inventory", key: "inventory" },
  { href: "/ledger", key: "ledger" },
  { href: "/settings", key: "settings" },
] as const;

export function Nav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="flex gap-4 border-b border-border px-4 py-2">
      {LINKS.map(({ href, key }) => (
        <Link
          key={href}
          href={href}
          className={
            pathname.startsWith(href)
              ? "font-semibold text-primary"
              : "text-muted-foreground hover:text-foreground"
          }
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
