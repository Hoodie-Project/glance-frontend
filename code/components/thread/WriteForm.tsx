"use client";

import { useState } from "react";

type WriteFormProps = {
  currentLocation?: {
    lat: string;
    lng: string;
  } | null;
};

export function WriteForm({ currentLocation }: WriteFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");

  const isValid = title.trim().length >= 50 || body.trim().length >= 50;

  return (
    <section className="surface" style={{ borderRadius: 28, padding: 20 }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>새 스레드 작성</h1>
      <p style={{ marginTop: 8, color: "var(--muted)", lineHeight: 1.6 }}>
        GPS 없이 태그로 장소를 표현합니다. 제목 또는 본문이 50자 이상일 때만 작성 완료 버튼이 활성화됩니다.
      </p>

      {currentLocation ? (
        <div
          className="chip"
          style={{
            width: "fit-content",
            marginTop: 16,
            background: "var(--accent-soft)"
          }}
        >
          현재 위치 {currentLocation.lat}, {currentLocation.lng}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <label style={{ display: "grid", gap: 8 }}>
          <span>제목</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 성수 카페 거리 지금 줄 길어요"
            style={{
              width: "100%",
              border: "1px solid var(--border)",
              borderRadius: 18,
              background: "rgba(255,255,255,0.03)",
              color: "var(--foreground)",
              padding: 14
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span>본문</span>
          <textarea
            rows={7}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="현재 분위기, 혼잡도, 대기 시간 등을 입력하세요."
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
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span>장소 태그</span>
          <input
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            placeholder="예: 성수, 을지로, 잠실"
            style={{
              width: "100%",
              border: "1px solid var(--border)",
              borderRadius: 18,
              background: "rgba(255,255,255,0.03)",
              color: "var(--foreground)",
              padding: 14
            }}
          />
        </label>

        <div style={{ color: "var(--muted)", fontSize: 14 }}>
          제목 {title.trim().length}자 / 본문 {body.trim().length}자 / 태그 {tag.trim() ? 1 : 0}개
        </div>

        <button
          className={isValid ? "button-primary" : "button-secondary"}
          disabled={!isValid}
          type="button"
          style={{ opacity: isValid ? 1 : 0.5, cursor: isValid ? "pointer" : "not-allowed" }}
        >
          작성 완료
        </button>
      </div>
    </section>
  );
}
