import { FeedList } from "@/components/thread/FeedList";

export default function FeedPage() {
  return (
    <main
      style={{
        paddingTop: "max(18px, env(safe-area-inset-top))",
        paddingBottom: "calc(var(--tabbar-height) + env(safe-area-inset-bottom) + 40px)"
      }}
    >
      <FeedList />
    </main>
  );
}
