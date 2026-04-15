import { PageHeader } from "@/components/layout/PageHeader";
import { HotRegions } from "@/components/map/HotRegions";
import { FeedList } from "@/components/thread/FeedList";

export default function FeedPage() {
  return (
    <main
      style={{
        paddingTop: "max(8px, env(safe-area-inset-top))",
        paddingBottom: "calc(var(--tabbar-height) + env(safe-area-inset-bottom) + 40px)"
      }}
    >
      <PageHeader
        title="실시간 피드"
        subtitle="최신 작성 순으로 스레드를 확인합니다."
      />
      <HotRegions />
      <FeedList />
    </main>
  );
}
