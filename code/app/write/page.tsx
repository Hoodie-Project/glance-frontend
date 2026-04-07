import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WriteForm } from "@/components/thread/WriteForm";

type WritePageProps = {
  searchParams: Promise<{
    lat?: string;
    lng?: string;
    source?: string;
  }>;
};

export default async function WritePage({ searchParams }: WritePageProps) {
  const params = await searchParams;
  const currentLocation =
    params.source === "current-location" && params.lat && params.lng
      ? {
          lat: params.lat,
          lng: params.lng
        }
      : null;

  return (
    <main className="app-shell" style={{ paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: 32 }}>
      <div className="page-header">
        <Link className="chip" href="/map">
          <ChevronLeft size={16} />
          지도
        </Link>
      </div>
      <WriteForm currentLocation={currentLocation} />
    </main>
  );
}
