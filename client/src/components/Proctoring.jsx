import { useCallback, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const SPOKEN_ALERTS = {
  eye: "Please keep your eyes focused on the exam screen.",
  head: "Please center your head inside the frame.",
  faceMissing: "Face not visible. Please move back inside the camera area.",
  multipleFace: "Multiple faces detected. Only one candidate should remain visible.",
  focus: "Please return to the exam window.",
};

const FACE_GUIDE = {
  left: 0.12,
  top: 0.07,
  width: 0.76,
  height: 0.84,
};

const EVIDENCE_TYPES = new Set(["eye", "head", "faceMissing", "multipleFace"]);

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const averagePoint = (points) => ({
  x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
  y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
});

const averageIndexPoints = (landmarks, indices) =>
  averagePoint(indices.map((index) => landmarks[index]));

const getPresenceTone = (label) => {
  if (["Face locked", "Stable face"].includes(label)) {
    return {
      background: "rgba(34, 197, 94, 0.18)",
      color: "#86efac",
      stroke: "#22c55e",
    };
  }

  if (
    ["Move closer", "Re-aligning", "Head movement", "Eye drift"].includes(label)
  ) {
    return {
      background: "rgba(245, 158, 11, 0.18)",
      color: "#fdba74",
      stroke: "#f59e0b",
    };
  }

  return {
    background: "rgba(248, 113, 113, 0.18)",
    color: "#fca5a5",
    stroke: "#ef4444",
  };
};

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const Proctoring = ({
  addWarning,
  onTelemetryChange,
  onEvidenceCapture,
  videoStream = null,
  audioStream = null,
  compact = false,
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const animationFrameRef = useRef(null);
  const processingRef = useRef(false);
  const soundIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const baselineRef = useRef(null);
  const missingFramesRef = useRef(0);
  const speechCooldownRef = useRef({});
  const lastWarningRef = useRef({
    eye: 0,
    head: 0,
    sound: 0,
    faceMissing: 0,
    multipleFace: 0,
  });
  const lastFaceSeenAtRef = useRef(0);
  const trackingScoreRef = useRef(0);
  const faceApiReadyRef = useRef(false);
  const fallbackBusyRef = useRef(false);
  const fallbackLastRunRef = useRef(0);
  const lastRenderBoxRef = useRef(null);
  const headDriftFramesRef = useRef(0);
  const eyeDriftFramesRef = useRef(0);
  const evidenceCooldownRef = useRef({});

  const [cameraState, setCameraState] = useState("Preparing camera");
  const [presenceLabel, setPresenceLabel] = useState("Aligning face");
  const [framingLabel, setFramingLabel] = useState(
    "Center your face inside the live guide."
  );
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioState, setAudioState] = useState("Calibrating room");
  const [trackingScore, setTrackingScore] = useState(0);
  const [trackingMode, setTrackingMode] = useState("Hybrid AI");

  const emitTelemetry = useCallback(
    (payload) => {
      if (typeof onTelemetryChange === "function") {
        onTelemetryChange({
          cameraState,
          ...payload,
        });
      }
    },
    [cameraState, onTelemetryChange]
  );

  const updateTrackingScore = useCallback((value) => {
    const nextValue = clamp(Math.round(value));
    trackingScoreRef.current = nextValue;
    setTrackingScore(nextValue);
    return nextValue;
  }, []);

  const captureEvidence = useCallback(
    (type, message) => {
      if (!EVIDENCE_TYPES.has(type) || typeof onEvidenceCapture !== "function") {
        return;
      }

      const videoElement = videoRef.current;
      if (!videoElement || videoElement.readyState < 2) {
        return;
      }

      const now = Date.now();
      const lastCapturedAt = evidenceCooldownRef.current[type] || 0;
      if (now - lastCapturedAt < 9000) {
        return;
      }

      evidenceCooldownRef.current[type] = now;

      try {
        const sourceWidth = videoElement.videoWidth || 0;
        const sourceHeight = videoElement.videoHeight || 0;

        if (!sourceWidth || !sourceHeight) {
          return;
        }

        const captureCanvas = document.createElement("canvas");
        const captureWidth = compact ? 320 : 420;
        const captureHeight = Math.round((captureWidth / sourceWidth) * sourceHeight);
        captureCanvas.width = captureWidth;
        captureCanvas.height = captureHeight;

        const ctx = captureCanvas.getContext("2d");
        if (!ctx) {
          return;
        }

        ctx.drawImage(videoElement, 0, 0, captureWidth, captureHeight);
        ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
        ctx.fillRect(0, captureHeight - 42, captureWidth, 42);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "600 13px Segoe UI";
        ctx.fillText(`${type.toUpperCase()} | ${new Date(now).toLocaleTimeString()}`, 12, captureHeight - 16);

        onEvidenceCapture({
          type,
          message,
          occurredAt: new Date(now).toISOString(),
          severity:
            type === "multipleFace" || type === "faceMissing" ? "high" : "medium",
          trackingScore: trackingScoreRef.current,
          detectionMode: trackingMode,
          imageData: captureCanvas.toDataURL("image/jpeg", compact ? 0.56 : 0.6),
        });
      } catch (error) {
        console.error("Evidence capture error:", error);
      }
    },
    [compact, onEvidenceCapture, trackingMode]
  );

  const speakAlert = useCallback((type, fallbackMessage) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    const phrase = SPOKEN_ALERTS[type] || fallbackMessage;
    if (!phrase) {
      return;
    }

    const now = Date.now();
    const lastSpokenAt = speechCooldownRef.current[type] || 0;

    if (now - lastSpokenAt < 7000) {
      return;
    }

    speechCooldownRef.current[type] = now;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speech guidance error:", error);
    }
  }, []);

  const triggerWarning = useCallback(
    (type, message, cooldown = 5000, announce = true) => {
      const now = Date.now();
      if (now - (lastWarningRef.current[type] || 0) <= cooldown) {
        return;
      }

      addWarning(type, message);
      lastWarningRef.current[type] = now;
      captureEvidence(type, message);

      if (announce) {
        speakAlert(type, message);
      }
    },
    [addWarning, captureEvidence, speakAlert]
  );

  const renderGuide = useCallback((box, label) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) {
      return;
    }

    const width = video.videoWidth || 1;
    const height = video.videoHeight || 1;

    if (!width || !height) {
      return;
    }

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const guideX = FACE_GUIDE.left * width;
    const guideY = FACE_GUIDE.top * height;
    const guideWidth = FACE_GUIDE.width * width;
    const guideHeight = FACE_GUIDE.height * height;
    const tone = getPresenceTone(label);

    drawRoundedRect(ctx, guideX, guideY, guideWidth, guideHeight, 28);
    ctx.strokeStyle = "rgba(255,255,255,0.38)";
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 12]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (!box) {
      return;
    }

    drawRoundedRect(ctx, box.x, box.y, box.width, box.height, 24);
    ctx.strokeStyle = tone.stroke;
    ctx.lineWidth = 4;
    ctx.stroke();
  }, []);

  const loadFallbackModels = useCallback(async () => {
    if (faceApiReadyRef.current || typeof window === "undefined") {
      return;
    }

    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      faceApiReadyRef.current = true;
    } catch (error) {
      console.error("Fallback face detector failed to load:", error);
    }
  }, []);

  const applyFallbackDetection = useCallback(async () => {
    const videoElement = videoRef.current;

    if (!faceApiReadyRef.current || !videoElement || videoElement.readyState < 2) {
      return false;
    }

    if (fallbackBusyRef.current) {
      return false;
    }

    const now = Date.now();
    if (now - fallbackLastRunRef.current < 650) {
      return false;
    }

    fallbackBusyRef.current = true;
    fallbackLastRunRef.current = now;

    try {
      const detections = await faceapi.detectAllFaces(
        videoElement,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: compact ? 256 : 320,
          scoreThreshold: compact ? 0.16 : 0.2,
        })
      );

      if (!detections.length) {
        return false;
      }

      setTrackingMode("Hybrid AI + fallback");
      missingFramesRef.current = 0;
      lastFaceSeenAtRef.current = Date.now();

      const videoWidth = videoElement.videoWidth || 1;
      const videoHeight = videoElement.videoHeight || 1;
      const primary = detections
        .slice()
        .sort((left, right) => right.box.width * right.box.height - left.box.width * left.box.height)[0];

      lastRenderBoxRef.current = primary.box;

      if (detections.length > 1) {
        const nextScore = updateTrackingScore(28);
        setPresenceLabel("Multiple faces");
        setFramingLabel("Only one candidate should remain visible in front of the camera.");
        emitTelemetry({
          faceVisible: true,
          multipleFaces: true,
          faceStatus: "Multiple faces",
          framingStatus: "Only one candidate should remain visible in front of the camera.",
          trackingScore: nextScore,
          detectionMode: "fallback",
        });
        renderGuide(primary.box, "Multiple faces");
        triggerWarning(
          "multipleFace",
          "Multiple persons detected in front of camera.",
          6500
        );
        return true;
      }

      const normalizedBox = {
        x: primary.box.x / videoWidth,
        y: primary.box.y / videoHeight,
        width: primary.box.width / videoWidth,
        height: primary.box.height / videoHeight,
      };

      const guidePadding = compact ? 0.055 : 0.04;
      const insideGuide =
        normalizedBox.x >= FACE_GUIDE.left - guidePadding &&
        normalizedBox.y >= FACE_GUIDE.top - guidePadding &&
        normalizedBox.x + normalizedBox.width <= FACE_GUIDE.left + FACE_GUIDE.width + guidePadding &&
        normalizedBox.y + normalizedBox.height <= FACE_GUIDE.top + FACE_GUIDE.height + guidePadding;

      const faceCoverage = normalizedBox.width * normalizedBox.height;
      const tooFar =
        faceCoverage < (compact ? 0.05 : 0.038) ||
        normalizedBox.width < (compact ? 0.23 : 0.18);

      let nextPresence = "Face locked";
      let nextFraming =
        "Fallback detector confirmed your face. Hold steady while detailed eye tracking reconnects.";
      let nextScore = 76;

      if (tooFar) {
        nextPresence = "Move closer";
        nextFraming =
          "Your face is visible, but move slightly closer so the AI can confirm eyes and posture.";
        nextScore = 62;
      } else if (!insideGuide) {
        nextPresence = "Re-aligning";
        nextFraming =
          "Your face is visible. Re-center yourself inside the guide for stronger tracking.";
        nextScore = 68;
      }

      const score = updateTrackingScore(nextScore);
      setPresenceLabel(nextPresence);
      setFramingLabel(nextFraming);
      emitTelemetry({
        faceVisible: true,
        multipleFaces: false,
        faceStatus: nextPresence,
        framingStatus: nextFraming,
        trackingScore: score,
        detectionMode: "fallback",
      });
      renderGuide(primary.box, nextPresence);
      return true;
    } catch (error) {
      console.error("Fallback face detection error:", error);
      return false;
    } finally {
      fallbackBusyRef.current = false;
    }
  }, [compact, emitTelemetry, renderGuide, triggerWarning, updateTrackingScore]);

  const handleTrackingResults = useCallback(
    (results) => {
      const landmarksArray = results.multiFaceLandmarks || [];

      if (!landmarksArray.length) {
        missingFramesRef.current += 1;
        headDriftFramesRef.current = 0;
        eyeDriftFramesRef.current = 0;
        const msSinceFaceSeen = Date.now() - lastFaceSeenAtRef.current;

        if (missingFramesRef.current <= (compact ? 8 : 6) || msSinceFaceSeen < 2800) {
          const nextScore = updateTrackingScore(
            trackingScoreRef.current ? trackingScoreRef.current - 6 : 60
          );
          setPresenceLabel("Re-aligning");
          setFramingLabel("Hold steady while the system refreshes your face landmarks.");
          emitTelemetry({
            faceVisible: msSinceFaceSeen < 2600,
            multipleFaces: false,
            faceStatus: "Re-aligning",
            framingStatus: "Hold steady while the system refreshes your face landmarks.",
            trackingScore: nextScore,
            detectionMode: "pending",
          });
          renderGuide(lastRenderBoxRef.current, "Re-aligning");
          return;
        }

        setPresenceLabel("Face missing");
        setFramingLabel("Move your face back into the camera frame and improve lighting.");
        emitTelemetry({
          faceVisible: false,
          multipleFaces: false,
          faceStatus: "Face missing",
          framingStatus: "Move your face back into the camera frame and improve lighting.",
          trackingScore: updateTrackingScore(0),
          detectionMode: "pending",
        });
        renderGuide(null, "Face missing");
        triggerWarning("faceMissing", "Face not detected. Stay inside the frame.", 6500);
        return;
      }

      missingFramesRef.current = 0;
      lastFaceSeenAtRef.current = Date.now();
      setTrackingMode("Hybrid AI");

      const primaryLandmarks = [...landmarksArray].sort((left, right) => {
        const leftXs = left.map((point) => point.x);
        const leftYs = left.map((point) => point.y);
        const rightXs = right.map((point) => point.x);
        const rightYs = right.map((point) => point.y);
        const leftArea =
          (Math.max(...leftXs) - Math.min(...leftXs)) *
          (Math.max(...leftYs) - Math.min(...leftYs));
        const rightArea =
          (Math.max(...rightXs) - Math.min(...rightXs)) *
          (Math.max(...rightYs) - Math.min(...rightYs));
        return rightArea - leftArea;
      })[0];

      const xs = primaryLandmarks.map((point) => point.x);
      const ys = primaryLandmarks.map((point) => point.y);
      const box = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };

      const nose = primaryLandmarks[1];
      const chin = primaryLandmarks[152];
      const forehead = primaryLandmarks[10];
      const leftCheek = primaryLandmarks[234];
      const rightCheek = primaryLandmarks[454];
      const leftIris = averageIndexPoints(primaryLandmarks, [468, 469, 470, 471, 472]);
      const rightIris = averageIndexPoints(primaryLandmarks, [473, 474, 475, 476, 477]);
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      if (!baselineRef.current) {
        baselineRef.current = {
          x: centerX,
          y: centerY,
          width: box.width,
          height: box.height,
          gazeLeft: 0.5,
          gazeRight: 0.5,
        };
      }

      const baseline = baselineRef.current;
      const shiftX = Math.abs(centerX - baseline.x) / Math.max(baseline.width, 0.0001);
      const shiftY = Math.abs(centerY - baseline.y) / Math.max(baseline.height, 0.0001);
      const faceCoverage = box.width * box.height;
      const tooFar =
        faceCoverage < (compact ? 0.05 : 0.038) ||
        box.width < (compact ? 0.23 : 0.18);

      const distLeft = Math.abs(nose.x - leftCheek.x);
      const distRight = Math.abs(rightCheek.x - nose.x);
      const yawRatio = distLeft / Math.max(distRight, 0.0001);
      const pitchRatio =
        Math.abs(nose.y - forehead.y) / Math.max(Math.abs(chin.y - nose.y), 0.0001);

      const leftEyeMin = Math.min(primaryLandmarks[33].x, primaryLandmarks[133].x);
      const leftEyeMax = Math.max(primaryLandmarks[33].x, primaryLandmarks[133].x);
      const rightEyeMin = Math.min(primaryLandmarks[362].x, primaryLandmarks[263].x);
      const rightEyeMax = Math.max(primaryLandmarks[362].x, primaryLandmarks[263].x);
      const gazeLeft = clamp(
        (leftIris.x - leftEyeMin) / Math.max(leftEyeMax - leftEyeMin, 0.0001),
        0,
        1
      );
      const gazeRight = clamp(
        (rightIris.x - rightEyeMin) / Math.max(rightEyeMax - rightEyeMin, 0.0001),
        0,
        1
      );

      const guidePadding = compact ? 0.055 : 0.04;
      const insideGuide =
        box.x >= FACE_GUIDE.left - guidePadding &&
        box.y >= FACE_GUIDE.top - guidePadding &&
        box.x + box.width <= FACE_GUIDE.left + FACE_GUIDE.width + guidePadding &&
        box.y + box.height <= FACE_GUIDE.top + FACE_GUIDE.height + guidePadding;

      const rawHeadTurned =
        shiftX > (compact ? 0.4 : 0.34) ||
        shiftY > (compact ? 0.31 : 0.27) ||
        yawRatio < 0.5 ||
        yawRatio > 1.95 ||
        pitchRatio < 0.62 ||
        pitchRatio > 1.64;

      const rawEyesShifted =
        Math.abs(gazeLeft - 0.5) > 0.24 ||
        Math.abs(gazeRight - 0.5) > 0.24 ||
        Math.abs(gazeLeft - baseline.gazeLeft) > 0.3 ||
        Math.abs(gazeRight - baseline.gazeRight) > 0.3;

      headDriftFramesRef.current = rawHeadTurned ? headDriftFramesRef.current + 1 : 0;
      eyeDriftFramesRef.current = rawEyesShifted ? eyeDriftFramesRef.current + 1 : 0;

      const headTurned = headDriftFramesRef.current >= 3;
      const eyesShifted = eyeDriftFramesRef.current >= 4;

      const hasMultipleFaces = landmarksArray.length > 1;
      let nextPresence = "Face locked";
      let nextFraming = "Excellent framing. Keep looking at the exam screen.";
      let nextScore = 100;

      if (hasMultipleFaces) {
        nextPresence = "Multiple faces";
        nextFraming = "Only one candidate should remain inside the camera frame.";
        nextScore = 25;
        triggerWarning(
          "multipleFace",
          "Multiple persons detected in front of camera.",
          6500
        );
      } else if (tooFar) {
        nextPresence = "Move closer";
        nextFraming = "Bring your face slightly closer for stronger AI visibility.";
        nextScore = 60;
      } else if (!insideGuide) {
        nextPresence = "Re-aligning";
        nextFraming = "Move your face back inside the guide lines.";
        nextScore = 72;
      } else if (headTurned) {
        nextPresence = "Head movement";
        nextFraming = "Return your face to the center and hold steady.";
        nextScore = 46;
        triggerWarning("head", "Head moved away from the expected exam posture.");
      } else if (eyesShifted) {
        nextPresence = "Eye drift";
        nextFraming = "Please keep your eyes focused on the exam area.";
        nextScore = 52;
        triggerWarning("eye", "Eyes moved away from the screen focus area.");
      } else if (rawHeadTurned || rawEyesShifted) {
        nextPresence = "Hold steady";
        nextFraming = "Small movement noticed. Keep your face and eyes centered.";
        nextScore = 78;
      }

      baselineRef.current = {
        x: baseline.x * 0.9 + centerX * 0.1,
        y: baseline.y * 0.9 + centerY * 0.1,
        width: baseline.width * 0.92 + box.width * 0.08,
        height: baseline.height * 0.92 + box.height * 0.08,
        gazeLeft: baseline.gazeLeft * 0.84 + gazeLeft * 0.16,
        gazeRight: baseline.gazeRight * 0.84 + gazeRight * 0.16,
      };

      const videoWidth = videoRef.current?.videoWidth || 1;
      const videoHeight = videoRef.current?.videoHeight || 1;
      const pixelBox = {
        x: box.x * videoWidth,
        y: box.y * videoHeight,
        width: box.width * videoWidth,
        height: box.height * videoHeight,
      };

      lastRenderBoxRef.current = pixelBox;
      setPresenceLabel(nextPresence);
      setFramingLabel(nextFraming);
      emitTelemetry({
        faceVisible: true,
        multipleFaces: hasMultipleFaces,
        faceStatus: nextPresence,
        framingStatus: nextFraming,
        trackingScore: updateTrackingScore(nextScore),
        detectionMode: "mediapipe",
      });

      renderGuide(pixelBox, nextPresence);
    },
    [compact, emitTelemetry, renderGuide, triggerWarning, updateTrackingScore]
  );

  const startFaceTracking = useCallback(async () => {
    await import("@mediapipe/face_mesh");
    const FaceMeshClass = window.FaceMesh;

    if (!FaceMeshClass) {
      throw new Error("MediaPipe FaceMesh could not be initialized.");
    }

    const faceMesh = new FaceMeshClass({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 2,
      refineLandmarks: true,
      minDetectionConfidence: compact ? 0.34 : 0.4,
      minTrackingConfidence: compact ? 0.34 : 0.4,
    });

    faceMesh.onResults(handleTrackingResults);
    faceMeshRef.current = faceMesh;

    const processFrame = async () => {
      const videoElement = videoRef.current;

      if (!videoElement || videoElement.readyState < 2) {
        animationFrameRef.current = window.requestAnimationFrame(processFrame);
        return;
      }

      if (processingRef.current) {
        animationFrameRef.current = window.requestAnimationFrame(processFrame);
        return;
      }

      processingRef.current = true;

      try {
        await faceMesh.send({ image: videoElement });

        if (missingFramesRef.current >= 2) {
          await applyFallbackDetection();
        }
      } catch (error) {
        console.error("Face mesh tracking error:", error);
      } finally {
        processingRef.current = false;
        animationFrameRef.current = window.requestAnimationFrame(processFrame);
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(processFrame);
  }, [applyFallbackDetection, compact, handleTrackingResults]);

  const startAudioDetection = useCallback(async (inputStream) => {
    const stream = inputStream || audioStreamRef.current || streamRef.current;

    if (!stream) {
      emitTelemetry({ microphoneReady: false, audioStatus: "Microphone unavailable" });
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      emitTelemetry({ microphoneReady: false, audioStatus: "Unsupported" });
      return;
    }

    try {
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        await audioContext.resume().catch(() => {});
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.86;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.fftSize);
      let calibrationSamples = 0;
      let baselineNoise = 0;

      emitTelemetry({
        microphoneReady: true,
        audioLevel: 0,
        audioStatus: "Calibrating room",
      });

      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = window.setInterval(() => {
        analyser.getByteTimeDomainData(dataArray);

        const rms = Math.sqrt(
          dataArray.reduce((sum, value) => {
            const centered = (value - 128) / 128;
            return sum + centered * centered;
          }, 0) / dataArray.length
        );

        if (calibrationSamples < 8) {
          baselineNoise = baselineNoise ? baselineNoise * 0.82 + rms * 0.18 : rms;
          calibrationSamples += 1;
          setAudioLevel(0);
          setAudioState("Calibrating room");
          emitTelemetry({
            microphoneReady: true,
            audioLevel: 0,
            audioStatus: "Calibrating room",
          });
          return;
        }

        baselineNoise = baselineNoise
          ? baselineNoise * 0.92 + Math.min(rms, baselineNoise * 1.3) * 0.08
          : rms;

        const effectiveFloor = Math.max(baselineNoise, 0.015);
        const normalizedLevel = clamp(
          Math.round((rms / Math.max(effectiveFloor * 4.6, 0.08)) * 100)
        );
        const noisy = rms > effectiveFloor * 2.7 && normalizedLevel > 38;
        const nextAudioState = noisy
          ? "Noise spike"
          : normalizedLevel > 24
          ? "Room active"
          : "Quiet";

        setAudioLevel(normalizedLevel);
        setAudioState(nextAudioState);
        emitTelemetry({
          microphoneReady: true,
          audioLevel: normalizedLevel,
          audioStatus: nextAudioState,
        });

        if (noisy) {
          triggerWarning(
            "sound",
            "Talking or strong background noise detected.",
            6500,
            false
          );
        }
      }, compact ? 2400 : 1800);
    } catch (error) {
      console.error("Audio monitoring error:", error);
      emitTelemetry({ microphoneReady: false, audioStatus: "Microphone blocked" });
    }
  }, [compact, emitTelemetry, triggerWarning]);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      try {
        setCameraState("Requesting camera");
        emitTelemetry({ cameraReady: false, cameraState: "Requesting camera" });

        const videoConstraints = {
          facingMode: "user",
          width: { ideal: compact ? 960 : 1280 },
          height: { ideal: compact ? 720 : 960 },
          frameRate: { ideal: compact ? 24 : 30 },
        };

        let nextVideoStream = videoStream || null;
        let nextAudioStream = audioStream || null;

        if (!nextVideoStream) {
          try {
            const combinedStream = await navigator.mediaDevices.getUserMedia({
              video: videoConstraints,
              audio: true,
            });
            nextVideoStream = combinedStream;
            nextAudioStream = nextAudioStream || combinedStream;
          } catch (combinedError) {
            console.error("Combined media request fallback:", combinedError);
            nextVideoStream = await navigator.mediaDevices.getUserMedia({
              video: videoConstraints,
              audio: false,
            });

            if (!nextAudioStream) {
              try {
                nextAudioStream = await navigator.mediaDevices.getUserMedia({
                  video: false,
                  audio: true,
                });
              } catch (audioError) {
                console.error("Audio-only request failed:", audioError);
              }
            }
          }
        }

        if (!active) {
          nextVideoStream?.getTracks().forEach((track) => track.stop());
          if (nextAudioStream && nextAudioStream !== nextVideoStream) {
            nextAudioStream.getTracks().forEach((track) => track.stop());
          }
          return;
        }

        streamRef.current = nextVideoStream;
        audioStreamRef.current = nextAudioStream;

        if (videoRef.current) {
          videoRef.current.srcObject = nextVideoStream;
          await videoRef.current.play();
        }

        baselineRef.current = null;
        missingFramesRef.current = 0;
        lastFaceSeenAtRef.current = 0;
        headDriftFramesRef.current = 0;
        eyeDriftFramesRef.current = 0;
        evidenceCooldownRef.current = {};
        updateTrackingScore(0);
        setCameraState("Camera live");
        emitTelemetry({ cameraReady: true, cameraState: "Camera live" });

        await loadFallbackModels();
        await startFaceTracking();
        await startAudioDetection(nextAudioStream);
      } catch (error) {
        console.error("Camera error:", error);
        setCameraState("Camera blocked");
        emitTelemetry({
          cameraReady: false,
          microphoneReady: false,
          cameraState: "Camera blocked",
        });
        addWarning("focus", "Camera or microphone access is blocked.");
      }
    };

    boot();

    const ownedCanvas = canvasRef.current;

    return () => {
      active = false;
      const canvas = ownedCanvas;
      window.cancelAnimationFrame(animationFrameRef.current);
      clearInterval(soundIntervalRef.current);

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      if (audioContextRef.current?.close) {
        audioContextRef.current.close().catch(() => {});
      }

      if (faceMeshRef.current?.close) {
        try {
          faceMeshRef.current.close();
        } catch (error) {
          console.error("Face mesh close error:", error);
        }
      }

      if (streamRef.current) {
        if (!videoStream) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      }

      if (audioStreamRef.current && audioStreamRef.current !== streamRef.current) {
        if (!audioStream) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
        }
      }

      if (canvas) {
        const context = canvas.getContext("2d");
        context?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [
    addWarning,
    compact,
    emitTelemetry,
    loadFallbackModels,
    startAudioDetection,
    startFaceTracking,
    updateTrackingScore,
    videoStream,
    audioStream,
  ]);

  const tone = getPresenceTone(presenceLabel);

  return (
    <div
      style={{
        borderRadius: compact ? "24px" : "28px",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(8, 15, 35, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)",
        border: "1px solid rgba(148, 163, 184, 0.16)",
        boxShadow: "0 28px 54px rgba(15, 23, 42, 0.2)",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: compact ? "16px 16px 12px" : "18px 18px 14px",
          color: "#e2e8f0",
          fontSize: "12px",
          flexWrap: compact ? "wrap" : "nowrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Proctor Lens
          </div>
          <div style={{ color: "rgba(226,232,240,0.7)" }}>
            {cameraState} | {trackingMode}
          </div>
        </div>

        <div
          style={{
            padding: "7px 12px",
            borderRadius: "999px",
            background: tone.background,
            color: tone.color,
            fontWeight: 800,
          }}
        >
          {presenceLabel}
        </div>
      </div>

      <div
        style={{
          padding: compact ? "0 16px 16px" : "0 18px 18px",
          display: "grid",
          gap: "14px",
        }}
      >
        <div style={{ position: "relative" }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%",
              aspectRatio: compact ? "3 / 4" : "4 / 3",
              objectFit: "cover",
              display: "block",
              background:
                "radial-gradient(circle at top, rgba(30, 41, 59, 0.85), rgba(2, 6, 23, 1))",
              borderRadius: compact ? "18px" : "22px",
              border: "1px solid rgba(255,255,255,0.08)",
              filter: "brightness(1.06) contrast(1.04)",
              transform: "scaleX(-1)",
            }}
          />

          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              transform: "scaleX(-1)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              padding: "8px 10px",
              borderRadius: "14px",
              background: "rgba(15, 23, 42, 0.72)",
              color: "#e2e8f0",
              fontSize: "12px",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Face lock
            <div style={{ fontWeight: 700, marginTop: "2px" }}>{presenceLabel}</div>
          </div>

          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              padding: "8px 10px",
              borderRadius: "14px",
              background: "rgba(15, 23, 42, 0.72)",
              color: "#e2e8f0",
              fontSize: "12px",
              textAlign: "right",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Room audio
            <div style={{ fontWeight: 700, marginTop: "2px" }}>
              {audioLevel}% | {audioState}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "12px",
              right: "12px",
              bottom: "12px",
              padding: "10px 12px",
              borderRadius: "16px",
              background: "rgba(15, 23, 42, 0.76)",
              color: "#e2e8f0",
              fontSize: compact ? "12px" : "13px",
              lineHeight: 1.5,
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {framingLabel}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: compact ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))",
            gap: "10px",
            color: "#e2e8f0",
          }}
        >
          <div
            style={{
              padding: compact ? "11px 12px" : "13px 14px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: "11px", color: "rgba(226,232,240,0.65)" }}>Face status</div>
            <div style={{ fontSize: compact ? "13px" : "14px", fontWeight: 700 }}>
              {presenceLabel}
            </div>
          </div>

          <div
            style={{
              padding: compact ? "11px 12px" : "13px 14px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: "11px", color: "rgba(226,232,240,0.65)" }}>
              Tracking score
            </div>
            <div style={{ fontSize: compact ? "13px" : "14px", fontWeight: 700 }}>
              {trackingScore}%
            </div>
          </div>

          <div
            style={{
              padding: compact ? "11px 12px" : "13px 14px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.06)",
              gridColumn: compact ? "1 / -1" : "auto",
            }}
          >
            <div style={{ fontSize: "11px", color: "rgba(226,232,240,0.65)" }}>
              Voice guidance
            </div>
            <div style={{ fontSize: compact ? "13px" : "14px", fontWeight: 700 }}>
              Enabled for face, eye, and posture corrections
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proctoring;
