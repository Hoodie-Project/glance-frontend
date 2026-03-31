"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ThreadSummary } from "@/types/thread";

const threads: ThreadSummary[] = [
  {
    id: "1",
    title: "성수 카페 거리 지금 줄 길어요",
    body: "입장 대기 길고, 주변 골목은 비교적 한산해요. 바로 옆 팝업은 10분 정도 대기 중입니다.",
    tag: "성수",
    likes: 12,
    comments: 4,
    createdAt: "방금 전"
  },
  {
    id: "2",
    title: "을지로 야시장 분위기 올라오는 중",
    body: "사람 조금씩 많아지는 중이고, 골목 안쪽은 아직 자리 있습니다. 조용한 쪽 찾으면 괜찮아요.",
    tag: "을지로",
    likes: 8,
    comments: 2,
    createdAt: "4분 전"
  },
  {
    id: "3",
    title: "잠실 한강공원 바람 괜찮아요",
    body: "돗자리 깔기 좋고 사람 밀도도 심하지 않아요. 러닝하는 사람들 꽤 많습니다.",
    tag: "잠실",
    likes: 21,
    comments: 7,
    createdAt: "12분 전"
  }
];

export function FeedList() {
  return (
    <section style={{ display: "grid", gap: 12 }}>
      {threads.map((thread, index) => (
        <motion.div
          key={thread.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.05 }}
        >
          <Link
            className="surface"
            href={`/thread/${thread.id}`}
            style={{
              display: "block",
              borderRadius: 24,
              padding: 18
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div className="chip" style={{ background: "var(--accent-soft)" }}>
                #{thread.tag}
              </div>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>{thread.createdAt}</span>
            </div>
            <h2 style={{ margin: "14px 0 8px", fontSize: 18, lineHeight: 1.35 }}>{thread.title}</h2>
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>{thread.body}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 14, color: "var(--muted)", fontSize: 14 }}>
              <span>좋아요 {thread.likes}</span>
              <span>댓글 {thread.comments}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </section>
  );
}

