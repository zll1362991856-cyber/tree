import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Activity, Loader2 } from 'lucide-react';

interface GestureControllerProps {
  onMotion: (x: number, y: number, intensity: number) => void;
  enabled: boolean;
  onToggle: () => void;
}

const GestureController: React.FC<GestureControllerProps> = ({ onMotion, enabled, onToggle }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Refs for animation loop stability
  const requestRef = useRef<number>(0);
  const onMotionRef = useRef(onMotion);
  const enabledRef = useRef(enabled);
  const prevFrameData = useRef<Uint8ClampedArray | null>(null);

  // Update refs when props change
  useEffect(() => {
    onMotionRef.current = onMotion;
    enabledRef.current = enabled;
  }, [onMotion, enabled]);

  const detectMotion = useCallback(() => {
    if (!enabledRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Ensure video is ready and has dimensions
    if (video.readyState !== 4 || video.videoWidth === 0) {
        requestRef.current = requestAnimationFrame(detectMotion);
        return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Low resolution for performance and consistency
    const width = 64; 
    const height = 48;

    if (canvas.width !== width) {
        canvas.width = width;
        canvas.height = height;
    }

    // Draw video frame - scaling it down here handles any input resolution
    ctx.drawImage(video, 0, 0, width, height);

    const frameData = ctx.getImageData(0, 0, width, height);
    const data = frameData.data;
    const length = data.length;

    let totalX = 0;
    let totalY = 0;
    let totalMass = 0;

    // Motion detection logic
    if (prevFrameData.current) {
      const prev = prevFrameData.current;
      const threshold = 30; 

      for (let i = 0; i < length; i += 4) {
        const diff = Math.abs(data[i] - prev[i]) + Math.abs(data[i+1] - prev[i+1]) + Math.abs(data[i+2] - prev[i+2]);
        
        if (diff > threshold) {
           const index = i / 4;
           const x = index % width;
           const y = Math.floor(index / width);

           // Mirror X
           const mirroredX = width - 1 - x;

           totalX += mirroredX;
           totalY += y;
           totalMass++;
        }
      }
    }

    prevFrameData.current = data; 

    // Trigger callback if motion detected
    if (totalMass > 15) { 
        const centerX = totalX / totalMass;
        const centerY = totalY / totalMass;
        
        // Normalize to -1 to 1 (NDC)
        const normX = (centerX / width) * 2 - 1;
        const normY = -(centerY / height) * 2 + 1; 
        
        onMotionRef.current(normX, normY, totalMass);
    }

    requestRef.current = requestAnimationFrame(detectMotion);
  }, []);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      if (!enabled) {
          // Stop loop if disabled
          cancelAnimationFrame(requestRef.current);
          return;
      }

      setLoading(true);
      setError(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("您的浏览器不支持摄像头访问或未在安全上下文(HTTPS)中");
        }

        let stream: MediaStream;

        try {
            // Attempt 1: Try front camera without strict resolution
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: "user"
                } 
            });
        } catch (err) {
            console.warn("Specific camera request failed, trying fallback...", err);
            // Attempt 2: Fallback to any available video source
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: true 
            });
        }

        if (!enabledRef.current) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }

        currentStream = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready to play
          try {
              await videoRef.current.play();
              detectMotion(); // Start loop
          } catch (e) {
              console.error("Video play error", e);
          }
        }
        setLoading(false);

      } catch (err) {
        console.error("Camera access error:", err);
        setLoading(false);
        setError("无法访问摄像头，请检查权限或设备兼容性");
      }
    };

    if (enabled) {
        startCamera();
    } else {
        // Cleanup if disabled via prop
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setLoading(false);
    }

    return () => {
      cancelAnimationFrame(requestRef.current);
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [enabled, detectMotion]);

  return (
    <div className={`fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2 transition-all duration-500 transform ${enabled ? 'opacity-100 translate-y-0' : 'opacity-90 translate-y-0'}`}>
       
       {/* Feedback Viewport */}
       <div className={`relative overflow-hidden rounded-xl border border-white/20 bg-black/50 backdrop-blur-sm transition-all duration-500 ease-spring ${enabled ? 'w-40 h-32 scale-100 opacity-100' : 'w-0 h-0 scale-90 opacity-0'}`}>
         
         {loading && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                 <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
             </div>
         )}

         {error ? (
             <div className="flex items-center justify-center w-full h-full text-red-300 text-xs p-2 text-center bg-red-900/20">
                 {error}
             </div>
         ) : (
             <>
                <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover transform -scale-x-100 opacity-60" 
                    muted 
                    playsInline
                    autoPlay
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Activity className={`text-green-400/50 w-8 h-8 ${loading ? 'opacity-0' : 'opacity-100 animate-pulse'}`} />
                </div>
                <div className="absolute top-1 left-2 text-[10px] text-green-400/80 font-mono">
                    REC :: {loading ? 'INIT' : 'ACTIVE'}
                </div>
             </>
         )}
       </div>

       {/* Toggle Button */}
       <button 
         onClick={onToggle}
         className={`
            flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm
            transition-all duration-300 shadow-lg border backdrop-blur-md
            active:scale-95
            ${enabled 
                ? 'bg-green-500/20 border-green-400/50 text-green-300 hover:bg-green-500/30' 
                : 'bg-white/10 border-white/10 text-white/60 hover:bg-white/20 hover:text-white'}
         `}
       >
         {enabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
         <span>{enabled ? '关闭手势' : '开启摄像头互动'}</span>
       </button>
    </div>
  );
};

export default GestureController;