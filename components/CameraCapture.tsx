import React, { useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface Props {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<Props> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      setError('Could not access camera.');
      console.error(err);
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            onLoadedMetadata={() => {
                if(videoRef.current) videoRef.current.play();
            }}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="bg-black p-6 flex justify-between items-center pb-10">
        <button onClick={onCancel} className="text-white px-4 py-2">
          Cancel
        </button>
        <button
          onClick={capturePhoto}
          className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:bg-white/50 transition"
        >
          <div className="w-12 h-12 bg-white rounded-full"></div>
        </button>
        <button onClick={startCamera} className="text-white px-4 py-2">
           <RefreshCw size={24}/>
        </button>
      </div>
    </div>
  );
};
