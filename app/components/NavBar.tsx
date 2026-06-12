"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Predictor" },
  { href: "/docs", label: "Documentación" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-20 border-b border-usach-navy/10 bg-usach-navy text-white shadow-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-usach-orange font-bold text-white">
            SP
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Stock Price Predictor</p>
            <p className="text-[11px] text-sky-200/80">
              Universidad de Santiago de Chile
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-usach-orange text-white"
                    : "text-sky-100/90 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
