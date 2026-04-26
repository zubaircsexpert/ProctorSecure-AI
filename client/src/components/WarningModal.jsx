const severityPalette = {
  medium: {
    background: "linear-gradient(180deg, #fff9f2 0%, #ffffff 100%)",
    border: "1px solid rgba(249, 115, 22, 0.16)",
    accent: "#ea580c",
  },
  high: {
    background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
    border: "1px solid rgba(245, 158, 11, 0.18)",
    accent: "#d97706",
  },
  critical: {
    background: "linear-gradient(180deg, #fff1f2 0%, #ffffff 100%)",
    border: "1px solid rgba(239, 68, 68, 0.18)",
    accent: "#dc2626",
  },
};

const WarningModal = ({ message, severity = "medium", count = 0, compact = false }) => {
  const palette = severityPalette[severity] || severityPalette.medium;

  return (
    <div
      style={{
        position: "fixed",
        top: compact ? "96px" : "110px",
        right: compact ? "12px" : "18px",
        left: compact ? "12px" : "auto",
        zIndex: 2500,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: compact ? "100%" : "min(380px, calc(100vw - 36px))",
          borderRadius: compact ? "22px" : "24px",
          padding: compact ? "16px 18px" : "18px 20px",
          background: palette.background,
          border: palette.border,
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.16)",
          textAlign: "left",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: palette.accent,
            }}
          >
            Suspicious activity detected
          </div>

          <div
            style={{
              minWidth: "34px",
              height: "34px",
              borderRadius: "999px",
              display: "grid",
              placeItems: "center",
              background: "rgba(15, 23, 42, 0.06)",
              color: "#0f172a",
              fontWeight: 800,
              fontSize: "13px",
            }}
          >
            {count}
          </div>
        </div>

        <div
          style={{
            fontSize: compact ? "16px" : "18px",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "6px",
          }}
        >
          Warning counted, exam continues
        </div>

        <p style={{ margin: 0, color: "#475569", lineHeight: 1.55, fontSize: compact ? "14px" : "15px" }}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default WarningModal;
