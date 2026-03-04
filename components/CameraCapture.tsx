import React, { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<Props> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [blurWarning, setBlurWarning] = useState<string>('');

  const stopCurrentStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const startCamera = async () => {
    setError('');
    setBlurWarning('');
    setIsReady(false);
    try {
      stopCurrentStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      setError('Could not access camera.');
      setIsStreaming(false);
      console.error(err);
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCurrentStream();
    };
  }, []);

  const calculateBlurScore = (width: number, height: number): number => {
    const sampleW = 128;
    const sampleH = Math.max(72, Math.round((sampleW / width) * height));
    const temp = document.createElement('canvas');
    temp.width = sampleW;
    temp.height = sampleH;
    const tempCtx = temp.getContext('2d');
    if (!tempCtx) return 100;
    tempCtx.drawImage(canvasRef.current as HTMLCanvasElement, 0, 0, sampleW, sampleH);
    const data = tempCtx.getImageData(0, 0, sampleW, sampleH).data;

    const gray = new Float32Array(sampleW * sampleH);
    for (let i = 0; i < sampleW * sampleH; i += 1) {
      const p = i * 4;
      gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    }

    let sum = 0;
    let sumSq = 0;
    let count = 0;
    for (let y = 1; y < sampleH - 1; y += 1) {
      for (let x = 1; x < sampleW - 1; x += 1) {
        const idx = y * sampleW + x;
        const lap =
          gray[idx - sampleW] +
          gray[idx + sampleW] +
          gray[idx - 1] +
          gray[idx + 1] -
          4 * gray[idx];
        sum += lap;
        sumSq += lap * lap;
        count += 1;
      }
    }

    if (count === 0) return 0;
    const mean = sum / count;
    return Math.max(0, (sumSq / count) - (mean * mean));
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video.videoWidth || !video.videoHeight) {
        setError('Camera not ready yet.');
        return;
      }

      const maxWidth = 1280;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      const outputW = Math.round(video.videoWidth * scale);
      const outputH = Math.round(video.videoHeight * scale);
      canvas.width = outputW;
      canvas.height = outputH;

      const cropRatio = 0.9;
      const srcW = Math.round(video.videoWidth * cropRatio);
      const srcH = Math.round(video.videoHeight * cropRatio);
      const srcX = Math.round((video.videoWidth - srcW) / 2);
      const srcY = Math.round((video.videoHeight - srcH) / 2);

      const context = canvas.getContext('2d');
      if (context) {
        context.filter = 'contrast(1.08) brightness(1.04)';
        context.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, outputW, outputH);
        context.filter = 'none';
        const blurScore = calculateBlurScore(outputW, outputH);
        if (blurScore < 85) {
          setBlurWarning('Image looks blurry. Hold steady and capture again for better accuracy.');
          return;
        }
        setBlurWarning('');
        const imageSrc = canvas.toDataURL('image/jpeg');
        onCapture(imageSrc);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 bg-black">
        {error ? (
          <div className="flex h-full items-center justify-center text-white p-4 text-center">
            {error}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.play();
                  setIsReady(true);
                }
              }}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-[85%] h-[72%] border-2 border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
            </div>
            <div className="absolute top-4 left-4 right-4 text-center text-white text-xs bg-black/40 rounded-xl py-2 px-3">
              Hold steady. Align winner hand and melds inside frame.
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="bg-black p-6 flex justify-between items-center pb-10">
        <button onClick={onCancel} className="text-white px-4 py-2">
          Cancel
        </button>
        <button
          onClick={capturePhoto}
          disabled={!isStreaming || !isReady}
          className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition ${!isStreaming || !isReady ? 'bg-white/10 opacity-50 cursor-not-allowed' : 'bg-white/20 active:bg-white/50'}`}
        >
          <div className="w-12 h-12 bg-white rounded-full"></div>
        </button>
        <button onClick={startCamera} className="text-white px-4 py-2">
           <RefreshCw size={24}/>
        </button>
      </div>
      {blurWarning && (
        <div className="bg-yellow-100 text-yellow-800 text-sm px-4 py-3 text-center border-t border-yellow-200">
          {blurWarning}
        </div>
      )}
    </div>
  );
};
