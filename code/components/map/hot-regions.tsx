const regions = ["성수", "을지로", "한남", "망원", "성북", "잠실"];

export function HotRegions() {
  return (
    <section style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {regions.map((region, index) => (
          <div
            key={region}
            className="chip"
            style={{
              whiteSpace: "nowrap",
              background: index === 0 ? "var(--accent-soft)" : undefined
            }}
          >
            #{region}
          </div>
        ))}
      </div>
    </section>
  );
}

