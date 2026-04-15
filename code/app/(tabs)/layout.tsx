import { BottomTabBar } from "@/components/navigation/BottomTabBar";

export default function TabsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-shell">
      {children}
      <BottomTabBar />
    </div>
  );
}
