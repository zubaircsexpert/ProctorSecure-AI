import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const Proctoring = ({ addWarning, onTelemetryChange }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const soundIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const baselineRef = useRef(null);
  const lastWarningRef = useRef({
    eye: 0,
    head: 0,
    sound: 0,
    faceMissing: 0,
    multipleFace: 0,
  });

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraState, setCameraState] = useState("Booting camera");
  const [presenceLabel, setPresenceLabel] = useState("Scanning face");
  const [audioLevel, setAudioLevel] = useState(0);

  const emitTelemetry = useCallback((payload) => {
    if (typeof onTelemetryChange === "function") {
      onTelemetryChange(payload);
    }
  }, [onTelemetryChange]);

  const triggerWarning = useCallback((type, message, cooldown = 4000) => {
    const now = Date.now();

    if (now - (lastWarningRef.current[type] || 0) > cooldown) {
      addWarning(type, message);
      lastWarningRef.current[type] = now;
    }
  }, [addWarning]);

  const startDetection = useCallback(() => {
    clearInterval(detectionIntervalRef.current);

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        return;
      }

      try {
        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 })
          )
          .withFaceLandmarks();

        if (!detections.length) {
          setPresenceLabel("Face missing");
          emitTelemetry({ faceVisible: false, multipleFaces: false });
          triggerWarning("faceMissing", "Face not detected. Stay inside the frame.");
          return;
        }

        if (detections.length > 1) {
          setPresenceLabel("Multiple faces");
          emitTelemetry({ faceVisible: true, multipleFaces: true });
          triggerWarning("multipleFace", "Multiple persons detected in front of camera.");
        } else {
          emitTelemetry({ faceVisible: true, multipleFaces: false });
        }

        const primaryFace = detections[0];
        const { box } = primaryFace.detection;
        const landmarks = primaryFace.landmarks;
        const nosePoint = landmarks.getNose()[3];
        const jaw = landmarks.getJawOutline();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const faceCenterX = box.x + box.width / 2;
        const faceCenterY = box.y + box.height / 2;

        if (!baselineRef.current) {
          baselineRef.current = {
            x: faceCenterX,
            y: faceCenterY,
            width: box.width,
            height: box.height,
          };
        }

        const baseline = baselineRef.current;
        const shiftX = Math.abs(faceCenterX - baseline.x) / Math.max(baseline.width, 1);
        const shiftY = Math.abs(faceCenterY - baseline.y) / Math.max(baseline.height, 1);

        const leftEyeCenter = (leftEye[0].x + leftEye[3].x) / 2;
        const rightEyeCenter = (rightEye[0].x + rightEye[3].x) / 2;
        const eyeCenter = (leftEyeCenter + rightEyeCenter) / 2;
        const eyeDrift = Math.abs(eyeCenter - nosePoint.x) / Math.max(box.width, 1);

        const distLeft = Math.abs(nosePoint.x - jaw[0].x);
        const distRight = Math.abs(jaw[16].x - nosePoint.x);
        const yawRatio = distLeft / Math.max(distRight, 1);

        const headTurned = shiftX > 0.22 || shiftY > 0.2 || yawRatio < 0.65 || yawRatio > 1.55;
        const eyesShifted = eyeDrift > 0.085;

        setPresenceLabel(headTurned ? "Head movement" : eyesShifted ? "Eye drift" : "Focused");

        if (headTurned) {
          triggerWarning("head", "Head moved away from the expected exam posture.");
        }

        if (eyesShifted) {
          triggerWarning("eye", "Eyes moved away from the screen focus area.");
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    }, 900);
  }, [emitTelemetry, triggerWarning]);

  const startAudioDetection = useCallback(async () => {
    if (!streamRef.current) {
      return;
    }

    try {
      const audioContext = new window.AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(streamRef.current);
      source.connect(analyser);

      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      emitTelemetry({ microphoneReady: true });

      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const averageLevel =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

        const normalizedLevel = Math.min(100, Math.round((averageLevel / 80) * 100));
        setAudioLevel(normalizedLevel);

        if (averageLevel > 58) {
          triggerWarning("sound", "Talking or strong background noise detected.", 5000);
        }
      }, 1600);
    } catch (err) {
      console.error("Audio monitoring error:", err);
      emitTelemetry({ microphoneReady: false });
    }
  }, [emitTelemetry, triggerWarning]);

  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        const modelUrl = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
        ]);

        if (mounted) {
          setModelsLoaded(true);
          setCameraState("AI models ready");
        }
      } catch (err) {
        console.error("Face model load error:", err);
        setCameraState("AI model failed");
      }
    };

    loadModels();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!modelsLoaded) {
      return undefined;
    }

    const startCamera = async () => {
      try {
        setCameraState("Requesting camera");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 960 },
            height: { ideal: 540 },
          },
          audio: true,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        baselineRef.current = null;
        setCameraState("Camera live");
        emitTelemetry({ cameraReady: true });
        startDetection();
        startAudioDetection();
      } catch (err) {
        console.error("Camera error:", err);
        setCameraState("Camera blocked");
        emitTelemetry({ cameraReady: false, microphoneReady: false });
        addWarning("focus", "Camera or microphone access is blocked.");
      }
    };

    startCamera();

    return () => {
      clearInterval(detectionIntervalRef.current);
      clearInterval(soundIntervalRef.current);

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [addWarning, emitTelemetry, modelsLoaded, startAudioDetection, startDetection]);

  return (
    <div
      style={{
        position: "fixed",
        right: "18px",
        bottom: "18px",
        width: "min(260px, calc(100vw - 36px))",
        borderRadius: "24px",
        overflow: "hidden",
        background: "rgba(10, 18, 38, 0.88)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 46px rgba(15, 23, 42, 0.28)",
        zIndex: 1900,
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "12px 14px 10px",
          color: "#e2e8f0",
          fontSize: "12px",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            AI Shield
          </div>
          <div style={{ color: "rgba(226,232,240,0.72)" }}>{cameraState}</div>
        </div>
        <div
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            background: "rgba(34, 197, 94, 0.16)",
            color: "#86efac",
            fontWeight: 700,
          }}
        >
          {presenceLabel}
        </div>
      </div>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "100%",
          aspectRatio: "16 / 10",
          objectFit: "cover",
          display: "block",
          background: "#020617",
        }}
      />

      <div
        style={{
          padding: "12px 14px 14px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          color: "#e2e8f0",
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: "11px", color: "rgba(226,232,240,0.65)" }}>Face status</div>
          <div style={{ fontSize: "14px", fontWeight: 700 }}>{presenceLabel}</div>
        </div>

        <div
          style={{
            padding: "10px 12px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: "11px", color: "rgba(226,232,240,0.65)" }}>Audio meter</div>
          <div style={{ fontSize: "14px", fontWeight: 700 }}>{audioLevel}%</div>
        </div>
      </div>
    </div>
  );
};

export default Proctoring;
