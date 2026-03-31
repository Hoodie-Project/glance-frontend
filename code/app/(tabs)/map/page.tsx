import { PageHeader } from "@/components/layout/page-header";
import { HotRegions } from "@/components/map/hot-regions";
import { MapView } from "@/components/map/map-view";

export default function MapPage() {
  return (
    <main style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}>
      <PageHeader
        title="서울 글랜스"
        subtitle="태그 기반으로 지금 뜨는 지역 스레드를 확인합니다."
      />
      <HotRegions />
      <MapView />
    </main>
  );
}

