const WarningModal = ({ message }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.28)",
        display: "grid",
        placeItems: "center",
        zIndex: 2500,
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "min(420px, 100%)",
          borderRadius: "26px",
          padding: "24px",
          background: "linear-gradient(180deg, #fff9f2 0%, #ffffff 100%)",
          border: "1px solid rgba(249, 115, 22, 0.14)",
          boxShadow: "0 28px 56px rgba(15, 23, 42, 0.18)",
          textAlign: "left",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#ea580c",
            marginBottom: "10px",
          }}
        >
          Suspicious activity detected
        </div>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "24px", color: "#111827" }}>
          Stay focused on the exam window
        </h3>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{message}</p>
      </div>
    </div>
  );
};

export default WarningModal;
