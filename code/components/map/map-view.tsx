"use client";

import { MapPin, RefreshCcw } from "lucide-react";

const markers = [
  { id: "1", title: "성수 카페 거리 지금 줄 길어요", tag: "성수", x: "36%", y: "42%" },
  { id: "2", title: "을지로 야시장 분위기 올라오는 중", tag: "을지로", x: "53%", y: "38%" },
  { id: "3", title: "잠실 한강공원 바람 괜찮아요", tag: "잠실", x: "73%", y: "52%" }
];

export function MapView() {
  return (
    <section
      className="surface"
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "calc(100vh - 220px)",
        borderRadius: 28,
        padding: 16
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16
        }}
      >
        <div>
          <strong style={{ display: "block", fontSize: 18 }}>서울 지도</strong>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>
            네이버 지도 SDK 연결 전 임시 레이아웃
          </span>
        </div>
        <button className="button-secondary" type="button">
          <RefreshCcw size={16} />
          새로고침
        </button>
      </div>

      <div
        style={{
          position: "relative",
          height: "100%",
          minHeight: 480,
          borderRadius: 24,
          border: "1px solid var(--border)",
          background:
            "radial-gradient(circle at 20% 20%, rgba(143, 92, 255, 0.16), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
        }}
      >
        {markers.map((marker) => (
          <button
            key={marker.id}
            type="button"
            style={{
              position: "absolute",
              left: marker.x,
              top: marker.y,
              transform: "translate(-50%, -50%)",
              display: "grid",
              placeItems: "center",
              width: 44,
              height: 44,
              border: 0,
              borderRadius: 999,
              background: "linear-gradient(135deg, #8f5cff 0%, #6f46ff 100%)",
              color: "#fff",
              boxShadow: "0 12px 30px rgba(111, 70, 255, 0.3)",
              cursor: "pointer"
            }}
          >
            <MapPin size={18} />
          </button>
        ))}

        <div
          className="surface"
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            borderRadius: 24,
            padding: 16,
            background: "var(--card-strong)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ color: "var(--accent)", fontSize: 13, fontWeight: 600 }}>#성수</div>
              <strong style={{ display: "block", marginTop: 4 }}>성수 카페 거리 지금 줄 길어요</strong>
              <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 14 }}>
                마커 클릭 시 최신 스레드 요약이 이 영역에 표시됩니다.
              </p>
            </div>
            <div className="chip">방금 전</div>
          </div>
        </div>
      </div>
    </section>
  );
}

