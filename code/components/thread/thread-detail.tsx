"use client";

import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";

type ThreadDetailProps = {
  threadId: string;
};

export function ThreadDetail({ threadId }: ThreadDetailProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(12);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    { id: "c1", body: "지금 가도 괜찮을까요?", createdAt: "1분 전" },
    { id: "c2", body: "골목 안쪽은 아직 여유 있어요.", createdAt: "방금 전" }
  ]);

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleSubmitComment = () => {
    if (!comment.trim()) return;

    setComments((prev) => [
      ...prev,
      { id: `c-${prev.length + 1}`, body: comment.trim(), createdAt: "방금 전" }
    ]);
    setComment("");
  };

  return (
    <section className="surface" style={{ borderRadius: 28, padding: 20 }}>
      <div className="chip" style={{ background: "var(--accent-soft)", marginBottom: 16 }}>
        #{threadId === "1" ? "성수" : "서울"}
      </div>
      <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.3 }}>성수 카페 거리 지금 줄 길어요</h1>
      <p style={{ color: "var(--muted)", marginTop: 8 }}>2026.04.01 19:20</p>
      <p style={{ marginTop: 20, lineHeight: 1.7 }}>
        입장 대기 길고, 주변 골목은 비교적 한산해요. 바로 옆 팝업은 10분 정도 대기 중입니다. 태그 기반
        위치 표현과 댓글 상호작용을 이 화면에서 검증할 수 있습니다.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button className="button-secondary" onClick={handleLike} type="button">
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
          좋아요 {likes}
        </button>
        <div className="chip">
          <MessageCircle size={16} />
          댓글 {comments.length}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>댓글</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {comments.map((item) => (
            <div key={item.id} className="surface" style={{ borderRadius: 18, padding: 14 }}>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{item.body}</p>
              <span style={{ display: "block", marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                {item.createdAt}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
        <textarea
          placeholder="댓글을 입력하세요"
          rows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          style={{
            width: "100%",
            border: "1px solid var(--border)",
            borderRadius: 18,
            background: "rgba(255,255,255,0.03)",
            color: "var(--foreground)",
            padding: 14,
            resize: "vertical"
          }}
        />
        <button className="button-primary" onClick={handleSubmitComment} type="button">
          댓글 등록
        </button>
      </div>
    </section>
  );
}

