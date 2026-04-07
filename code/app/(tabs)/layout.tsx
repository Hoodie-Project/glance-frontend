import { BottomTabBar } from "@/components/navigation/BottomTabBar";

export default function TabsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-shell" style={{ paddingBottom: "calc(var(--tabbar-height) + 24px)" }}>
      {children}
      <BottomTabBar />
    </div>
  );
}
