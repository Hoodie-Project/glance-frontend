import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ThreadDetail } from "@/components/thread/ThreadDetail";

type ThreadDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ThreadDetailPage({ params }: ThreadDetailPageProps) {
  const { id } = await params;

  return (
    <main className="app-shell" style={{ paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: 32 }}>
      <div className="page-header">
        <Link className="chip" href="/feed">
          <ChevronLeft size={16} />
          피드로
        </Link>
      </div>
      <ThreadDetail threadId={id} />
    </main>
  );
}
