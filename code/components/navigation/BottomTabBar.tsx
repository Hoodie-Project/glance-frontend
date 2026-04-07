"use client";

import { MapPinned, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/map", label: "지도", icon: MapPinned },
  { href: "/feed", label: "피드", icon: MessageSquareText }
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="surface"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "max(0px, env(safe-area-inset-bottom))",
        zIndex: 30,
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        width: "min(calc(100% - 24px), var(--page-max-width))",
        transform: "translateX(-50%)",
        borderRadius: 24,
        padding: "10px 12px",
        marginBottom: 8
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              minHeight: 48,
              borderRadius: 16,
              background: isActive ? "var(--accent-soft)" : "transparent",
              color: isActive ? "var(--foreground)" : "var(--muted)"
            }}
          >
            <Icon size={18} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

