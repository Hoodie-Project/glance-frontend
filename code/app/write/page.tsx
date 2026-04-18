import { WriteForm } from "@/components/thread/WriteForm";

type WritePageProps = {
  searchParams: Promise<{
    lat?: string;
    lng?: string;
    locationName?: string;
  }>;
};

export default async function WritePage({ searchParams }: WritePageProps) {
  const params = await searchParams;
  const currentLocation =
    params.lat && params.lng
      ? {
          lat: params.lat,
          lng: params.lng,
          name: params.locationName
        }
      : null;

  return (
    <main className="app-shell" style={{ paddingTop: "max(16px, env(safe-area-inset-top))", paddingBottom: 32 }}>
      <WriteForm currentLocation={currentLocation} />
    </main>
  );
}
