import { useEffect, useState } from "react";

const formatTime = (value) => {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const Timer = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return undefined;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [onTimeUp, timeLeft]);

  const progress = duration > 0 ? Math.max(0, (timeLeft / duration) * 100) : 0;
  const urgent = timeLeft <= 300;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Remaining time
        </span>
        <strong style={{ fontSize: "22px", color: urgent ? "#dc2626" : "#0f172a" }}>
          {formatTime(timeLeft)}
        </strong>
      </div>

      <div
        style={{
          width: "100%",
          height: "8px",
          borderRadius: "999px",
          background: "rgba(15, 23, 42, 0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            borderRadius: "999px",
            background: urgent
              ? "linear-gradient(90deg, #f97316, #dc2626)"
              : "linear-gradient(90deg, #2563eb, #06b6d4)",
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
};

export default Timer;
