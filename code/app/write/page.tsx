import { WriteForm } from "@/components/thread/WriteForm";

type WritePageProps = {
  searchParams: Promise<{
    lat?: string;
    lng?: string;
    address?: string;
    region?: string;
  }>;
};

export default async function WritePage({ searchParams }: WritePageProps) {
  const params = await searchParams;
  const currentLocation =
    params.lat && params.lng
      ? {
          lat: params.lat,
          lng: params.lng,
          address: params.address,
          region: params.region
        }
      : null;

  return (
    <main className="app-shell" style={{ paddingTop: "max(16px, env(safe-area-inset-top))", paddingBottom: 32 }}>
      <WriteForm currentLocation={currentLocation} />
    </main>
  );
}
