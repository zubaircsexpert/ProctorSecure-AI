import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const Proctoring = ({ addWarning }) => {

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const soundIntervalRef = useRef(null);
  const audioContextRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);

  const initialNose = useRef(null);

  const lastWarning = useRef({
    head: 0,
    eye: 0,
    sound: 0,
    face: 0,
    multi: 0
  });

  // ==============================
  // LOAD AI MODELS
  // ==============================

  useEffect(() => {

    const loadModels = async () => {

      const MODEL_URL = "/models";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      ]);

      console.log("AI Models Loaded");

      setModelsLoaded(true);

    };

    loadModels();

  }, []);

  // ==============================
  // START CAMERA
  // ==============================

  useEffect(() => {

    if (!modelsLoaded) return;

    const startCamera = async () => {

      try {

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        streamRef.current = stream;

        videoRef.current.srcObject = stream;

        videoRef.current.play();

        startDetection();
        startAudioDetection();

      } catch (err) {

        console.error("Camera Error:", err);

        addWarning("camera", "Camera access blocked!");

      }

    };

    startCamera();

    return () => {

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      clearInterval(detectionIntervalRef.current);
      clearInterval(soundIntervalRef.current);

    };

  }, [modelsLoaded]);

  // ==============================
  // ORIGINAL DETECTION (AS IT IS)
  // ==============================

  const startDetection = () => {

    detectionIntervalRef.current = setInterval(async () => {

      if (!videoRef.current) return;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections.length === 0) {

        const now = Date.now();

        if (now - lastWarning.current.face > 3000) {
          addWarning("eye", "Face not detected!");
          lastWarning.current.face = now;
        }

        return;
      }

      if (detections.length > 1) {

        const now = Date.now();

        if (now - lastWarning.current.multi > 3000) {
          addWarning("face", "Multiple persons detected!");
          lastWarning.current.multi = now;
        }
      }

      const detection = detections[0];
      const landmarks = detection.landmarks;
      const nose = landmarks.getNose()[3];

      if (!initialNose.current) {
        initialNose.current = { x: nose.x, y: nose.y };
      }

      const moveX = Math.abs(nose.x - initialNose.current.x);
      const moveY = Math.abs(nose.y - initialNose.current.y);

      if (moveX > 25 || moveY > 25) {

        const now = Date.now();

        if (now - lastWarning.current.head > 3000) {
          addWarning("head", "Head moved away from screen!");
          lastWarning.current.head = now;
        }
      }

    }, 800);

  };

  // ==============================
  // SMART DETECTION (FIXED POSITION)
  // ==============================

  const startSmartDetection = () => {

    detectionIntervalRef.current = setInterval(async () => {

      if (!videoRef.current) return;

      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 160 })
        )
        .withFaceLandmarks();

      if (detections.length === 0) {
        triggerWarning("face", "Face not detected!");
        return;
      }

      const landmarks = detections[0].landmarks;
      const nose = landmarks.getNose();
      const jaw = landmarks.getJawOutline();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      const leftEyeCenter = (leftEye[0].x + leftEye[3].x) / 2;
      const rightEyeCenter = (rightEye[0].x + rightEye[3].x) / 2;
      const noseTipX = nose[3].x;

      const faceWidth = Math.abs(jaw[16].x - jaw[0].x);
      const eyeOffset = Math.abs((leftEyeCenter + rightEyeCenter) / 2 - noseTipX);

      if (eyeOffset > faceWidth * 0.12) {
        triggerWarning("eye", "Looking away from screen!");
      }

      const distLeft = Math.abs(nose[3].x - jaw[0].x);
      const distRight = Math.abs(jaw[16].x - nose[3].x);
      const yawRatio = distLeft / distRight;

      if (yawRatio < 0.5 || yawRatio > 2.0) {
        triggerWarning("head", "Head turned too far left or right!");
      }

      const eyeLevelY = (leftEye[0].y + rightEye[0].y) / 2;
      const verticalDiff = nose[3].y - eyeLevelY;

      if (verticalDiff < 25 || verticalDiff > 65) {
        triggerWarning("head", "Looking up or down!");
      }

    }, 600);

  };

  // ==============================
  // WARNING HELPER
  // ==============================

  const triggerWarning = (type, message) => {

    const now = Date.now();

    if (now - lastWarning.current[type] > 4000) {
      addWarning(type, message);
      lastWarning.current[type] = now;
    }

  };

  // ==============================
  // SOUND DETECTION
  // ==============================

  const startAudioDetection = async () => {

    const stream = streamRef.current;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);

    microphone.connect(analyser);

    analyser.fftSize = 256;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    soundIntervalRef.current = setInterval(() => {

      analyser.getByteFrequencyData(dataArray);

      const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;

      if (volume > 60) {

        const now = Date.now();

        if (now - lastWarning.current.sound > 4000) {
          addWarning("sound", "Talking or background noise detected!");
          lastWarning.current.sound = now;
        }

      }

    }, 1500);

  };

  // ==============================
  // UI
  // ==============================

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "300px",
        height: "200px",
        borderRadius: "10px",
        border: "2px solid #333",
        zIndex: 999
      }}
    />
  );

};

export default Proctoring;