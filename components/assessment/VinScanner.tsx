
import React, { useEffect, useRef, useState } from 'react';
import Spinner from '../ui/Spinner';

interface VinScannerProps {
  onScanSuccess: (vin: string) => void;
  onClose: () => void;
}

const VinScanner: React.FC<VinScannerProps> = ({ onScanSuccess, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let barcodeDetector: any;

    const startScan = async () => {
      if (!('BarcodeDetector' in window)) {
        setError('Barcode scanning is not supported by this browser.');
        setIsLoading(false);
        return;
      }

      try {
        // VINs are typically Code 39, but we can support others.
        const formats = await (window as any).BarcodeDetector.getSupportedFormats();
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ['code_39', 'code_128', 'ean_13'] });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsLoading(false);
          scanFrame();
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please check permissions and try again.');
        setIsLoading(false);
      }
    };

    const scanFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2 || !barcodeDetector) return;
    
        try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
                const vin = barcodes[0].rawValue;
                // Basic validation for VIN length
                if (vin.length > 10 && vin.length < 20) {
                     onScanSuccess(vin);
                } else {
                     requestAnimationFrame(scanFrame);
                }
            } else {
                requestAnimationFrame(scanFrame);
            }
        } catch (err) {
            console.error('Error during barcode detection:', err);
            requestAnimationFrame(scanFrame); // Keep trying
        }
    };

    startScan();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-lg aspect-video rounded-lg overflow-hidden shadow-2xl border-4 border-secondary">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
            <Spinner />
            <p className="mt-2 text-lg">Starting camera...</p>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[90%] h-[30%] border-4 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
        </div>
      </div>
      <div className="text-center text-white mt-4 max-w-lg">
        {error ? (
          <p className="text-red-400 font-semibold">{error}</p>
        ) : (
          <p className="text-lg">Position the vehicle's VIN barcode inside the rectangle.</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="mt-6 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold py-2 px-6 rounded-lg"
      >
        Cancel
      </button>
    </div>
  );
};

export default VinScanner;
