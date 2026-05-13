"use client";

import React, { useRef, useEffect, useState } from "react";

export interface FaceData {
  box: [number, number, number, number];
  match: { user_id: string; name: string } | null;
  confidence?: number;
}

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  captureIntervalMs?: number | null;
  singleShot?: boolean;
  isLiveMode?: boolean;
  facesData?: FaceData[];
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  captureIntervalMs = null,
  singleShot = false,
  isLiveMode = false,
  facesData = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"loading" | "active" | "stopped">("stopped");
  const [cameraError, setCameraError] = useState<string>("");

  const startCamera = async () => {
    try {
      setCameraStatus("loading");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraStatus("active");
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Failed to access camera.");
      setCameraStatus("stopped");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCameraStatus("stopped");
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || cameraStatus !== "active") return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw rectangles and IDs
    facesData.forEach((face) => {
      const [x, y, w, h] = face.box;
      ctx.strokeStyle = face.match ? "lime" : "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      if (face.match) {
        ctx.fillStyle = "lime";
        ctx.font = "16px Arial";
        ctx.fillText(`${face.match.name} (${face.match.user_id})`, x, y - 5);
      } else {
        ctx.fillStyle = "red";
        ctx.font = "16px Arial";
        ctx.fillText("Unknown", x, y - 5);
      }
    });

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    onCapture(dataUrl);
  };

  useEffect(() => {
    if (singleShot || isLiveMode) startCamera();
    return () => stopCamera();
  }, [singleShot, isLiveMode]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (captureIntervalMs && isLiveMode && cameraStatus === "active") {
      intervalRef.current = setInterval(capture, captureIntervalMs);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [captureIntervalMs, isLiveMode, cameraStatus, facesData]);

  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-slate-900 border-2 border-slate-800 group transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full object-cover ${cameraStatus === "active" ? "block" : "hidden"}`}
        style={{ minHeight: "360px", maxHeight: "360px" }}
      />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-10" />
      
      {/* Scanner Animation Overlay */}
      {cameraStatus === "active" && isLiveMode && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
           <div className="w-full h-1 bg-blue-500 shadow-[0_0_15px_3px_rgba(59,130,246,0.8)] animate-scan opacity-70"></div>
           {/* Corner brackets */}
           <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500/70 rounded-tl-lg transition-all duration-300 group-hover:border-blue-400 group-hover:scale-110 group-hover:-translate-x-1 group-hover:-translate-y-1"></div>
           <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500/70 rounded-tr-lg transition-all duration-300 group-hover:border-blue-400 group-hover:scale-110 group-hover:translate-x-1 group-hover:-translate-y-1"></div>
           <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500/70 rounded-bl-lg transition-all duration-300 group-hover:border-blue-400 group-hover:scale-110 group-hover:-translate-x-1 group-hover:translate-y-1"></div>
           <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500/70 rounded-br-lg transition-all duration-300 group-hover:border-blue-400 group-hover:scale-110 group-hover:translate-x-1 group-hover:translate-y-1"></div>
        </div>
      )}

      {cameraStatus === "loading" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-blue-400 font-medium animate-pulse">Initializing Scanner...</p>
        </div>
      )}

      {cameraStatus === "stopped" && !cameraError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <button
            onClick={startCamera}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Activate Scanner
          </button>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/90 backdrop-blur-md">
          <div className="text-center p-6 bg-slate-800/50 rounded-2xl border border-red-500/30">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-red-400 font-semibold">{cameraError}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors text-sm border border-slate-600">Retry Access</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
