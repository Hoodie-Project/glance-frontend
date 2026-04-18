import { MapView } from "@/components/map/MapView";

type MapPageProps = {
  searchParams: Promise<{
    select?: string;
    returnTo?: string;
  }>;
};

export default async function MapPage({ searchParams }: MapPageProps) {
  const params = await searchParams;
  const isSelectMode = params.select === "1";
  const returnTo = params.returnTo ?? "/write";

  return (
    <main className="map-page">
      <MapView isSelectMode={isSelectMode} returnTo={returnTo} />
    </main>
  );
}
