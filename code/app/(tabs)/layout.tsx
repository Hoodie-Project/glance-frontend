import { Plus } from "lucide-react";
import Link from "next/link";
import { BottomTabBar } from "@/components/navigation/bottom-tab-bar";

export default function TabsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-shell" style={{ paddingBottom: "calc(var(--tabbar-height) + 24px)" }}>
      {children}
      <Link
        aria-label="새 글 작성"
        className="button-primary"
        href="/write"
        style={{
          position: "fixed",
          right: "max(16px, env(safe-area-inset-right))",
          bottom: "calc(var(--tabbar-height) + 16px)",
          width: "var(--fab-size)",
          height: "var(--fab-size)",
          padding: 0,
          borderRadius: "999px",
          boxShadow: "0 16px 40px rgba(111, 70, 255, 0.3)"
        }}
      >
        <Plus size={24} />
      </Link>
      <BottomTabBar />
    </div>
  );
}

