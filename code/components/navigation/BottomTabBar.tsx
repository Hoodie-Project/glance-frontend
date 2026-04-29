"use client";

import { List, MapPinned, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const tabs = [
  { href: "/map", label: "지도", icon: MapPinned },
  { href: "/feed", label: "피드", icon: List }
];

export function BottomTabBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMapSelectMode = pathname === "/map" && searchParams.get("select") === "1";

  if (isMapSelectMode) {
    return null;
  }

  return (
    <nav className="bottom-tab-shell">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="bottom-tab-item"
            data-active={isActive}
          >
            <Icon size={18} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{tab.label}</span>
          </Link>
        );
      })}

      <Link aria-label="제보하기" className="bottom-tab-plus" href="/write">
        <Plus size={30} strokeWidth={2.2} />
      </Link>
    </nav>
  );
}
