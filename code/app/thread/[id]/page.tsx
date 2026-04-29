import { ThreadDetail } from "@/components/thread/ThreadDetail";

type ThreadDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ThreadDetailPage({ params }: ThreadDetailPageProps) {
  const { id } = await params;

  return (
    <main
      className="app-shell thread-detail-page"
      style={{ paddingTop: "max(18px, env(safe-area-inset-top))", paddingBottom: 32 }}
    >
      <ThreadDetail threadId={id} />
    </main>
  );
}
