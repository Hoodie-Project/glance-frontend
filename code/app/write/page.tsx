import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WriteForm } from "@/components/thread/write-form";

export default function WritePage() {
  return (
    <main className="app-shell" style={{ paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: 32 }}>
      <div className="page-header">
        <Link className="chip" href="/map">
          <ChevronLeft size={16} />
          지도
        </Link>
      </div>
      <WriteForm />
    </main>
  );
}

