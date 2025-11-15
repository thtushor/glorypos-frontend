import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, CameraDevice } from "html5-qrcode";
import { FaTimes, FaCamera } from "react-icons/fa";
import Spinner from "./Spinner";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  title = "Scan Barcode",
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Physical barcode scanner detection
  const barcodeBufferRef = useRef<string>("");
  const barcodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize cameras
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setAvailableCameras([]);
      setCameraId(null);
      
      Html5Qrcode.getCameras()
        .then((cameras) => {
          if (cameras && cameras.length > 0) {
            setAvailableCameras(cameras);
            setCameraId(cameras[0].id);
            setError(null);
          } else {
            setError("No cameras found. Please connect a camera or use manual input.");
          }
        })
        .catch((err) => {
          console.error("Camera access error:", err);
          const errorMessage =
            err.message?.includes("Permission") || err.message?.includes("permission")
              ? "Camera permission denied. Please allow camera access in your browser settings."
              : err.message?.includes("NotFoundError") || err.message?.includes("not found")
              ? "No camera found. Please connect a camera or use manual input."
              : `Failed to access cameras: ${err.message || "Unknown error"}`;
          setError(errorMessage);
        });
    }

    return () => {
      // Cleanup on unmount or when isOpen changes
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scanner
          .stop()
          .catch(() => {
            // Ignore errors
          })
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [isOpen]);

  // Physical barcode scanner handler (keyboard input)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Clear timeout on new input
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }

      // Handle Enter key (barcode scanner typically sends Enter after barcode)
      if (e.key === "Enter" && barcodeBufferRef.current.trim().length > 0) {
        e.preventDefault();
        const scannedBarcode = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = "";
        
        if (scannedBarcode.length > 0) {
          onScan(scannedBarcode);
          // Optionally close scanner after successful scan
          // onClose();
        }
        return;
      }

      // Handle regular character input
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        barcodeBufferRef.current += e.key;

        // Set timeout to clear buffer if no input for 100ms
        // (barcode scanners input quickly, so this detects if it's a scanner)
        barcodeTimeoutRef.current = setTimeout(() => {
          // If buffer has reasonable length, treat it as a scanned barcode
          if (barcodeBufferRef.current.trim().length >= 4) {
            onScan(barcodeBufferRef.current.trim());
            barcodeBufferRef.current = "";
          } else {
            // Clear short buffers (likely user typing)
            barcodeBufferRef.current = "";
          }
        }, 100);
      }

      // Handle Escape key
      if (e.key === "Escape") {
        barcodeBufferRef.current = "";
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, [isOpen, onScan]);

  const startScanning = async () => {
    if (!cameraId) {
      setError("No camera selected");
      return;
    }

    // Ensure container exists
    const container = document.getElementById("barcode-scanner-container");
    if (!container) {
      setError("Scanner container not found. Please try again.");
      return;
    }

    // Clean up any existing scanner instance first
    if (scannerRef.current) {
      try {
        await stopScanning(true); // Skip clear to avoid DOM issues
      } catch (err) {
        // Ignore cleanup errors
        scannerRef.current = null;
      }
    }

    try {
      setIsScanning(true);
      setError(null);

      // Wait a bit to ensure container is fully ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Double-check container still exists
      const containerCheck = document.getElementById("barcode-scanner-container");
      if (!containerCheck) {
        throw new Error("Container disappeared during initialization");
      }

      // Create new scanner instance with error handling
      let html5QrCode: Html5Qrcode;
      try {
        html5QrCode = new Html5Qrcode("barcode-scanner-container");
        scannerRef.current = html5QrCode;
      } catch (initError: any) {
        throw new Error(
          `Failed to initialize scanner: ${initError.message || "Unknown error"}`
        );
      }

      // Start scanning with proper error handling
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Successfully scanned
          try {
            onScan(decodedText);
            stopScanning(false).catch(() => {
              // Ignore stop errors
            });
          } catch (err) {
            console.error("Error handling scan result:", err);
            setError("Error processing scan result. Please try again.");
          }
        },
        () => {
          // Ignore scanning errors (they're frequent during scanning)
        }
      );
    } catch (err: any) {
      console.error("Scanner start error:", err);
      setError(
        err.message || "Failed to start camera. Please check permissions and try again."
      );
      setIsScanning(false);
      
      // Clean up failed scanner instance
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop().catch(() => {});
        } catch {
          // Ignore
        }
        scannerRef.current = null;
      }
    }
  };

  const stopScanning = async (skipClear = false) => {
    if (scannerRef.current) {
      try {
        const scanner = scannerRef.current;
        
        // Stop the scanner
        try {
          await scanner.stop();
        } catch (stopErr) {
          // Ignore stop errors - scanner might already be stopped
        }
        
        // Only clear if explicitly requested and container exists
        // Don't clear when component is unmounting to avoid DOM errors
        if (!skipClear) {
          const container = document.getElementById("barcode-scanner-container");
          if (container && container.parentNode && document.body.contains(container)) {
            try {
              await scanner.clear();
            } catch (clearErr) {
              // Ignore clear errors - container might already be cleaned up
            }
          }
        }
      } catch (err) {
        // Ignore all cleanup errors
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    } else {
      setIsScanning(false);
    }
  };

  const handleCameraChange = async (newCameraId: string) => {
    try {
      await stopScanning(true);
      setCameraId(newCameraId);
      // Reset scanning state after camera change
      setIsScanning(false);
    } catch (err) {
      console.error("Error changing camera:", err);
      setError("Failed to change camera. Please try again.");
    }
  };

  // Auto-start scanning when camera is selected and modal is open
  useEffect(() => {
    if (isOpen && cameraId && !isScanning && !scannerRef.current) {
      // Longer delay to ensure container is fully mounted and ready
      const timeoutId = setTimeout(() => {
        // Double check container exists and modal is still open
        const container = document.getElementById("barcode-scanner-container");
        if (container && isOpen && container.offsetParent !== null) {
          // Container is visible and ready
          startScanning().catch((err) => {
            console.error("Auto-start failed:", err);
            setError("Failed to auto-start scanner. Click 'Start Camera Scanner' to try manually.");
          });
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cameraId, isScanning]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      // Stop scanning when modal closes - skip clear to avoid DOM errors
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scanner.stop().catch(() => {
          // Ignore errors
        }).finally(() => {
          scannerRef.current = null;
          setIsScanning(false);
        });
      } else {
        setIsScanning(false);
      }
      setError(null);
      barcodeBufferRef.current = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FaTimes className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Physical Scanner:</strong> Point your barcode scanner and scan. The scanner will automatically detect the barcode.
        </p>
        <p className="text-sm text-blue-800 mt-2">
          <strong>Camera Scanner:</strong> Allow camera access and point at a barcode to scan.
        </p>
      </div>

      {/* Camera Selection */}
      {availableCameras.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Camera
          </label>
          <select
            value={cameraId || ""}
            onChange={(e) => handleCameraChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            disabled={isScanning}
          >
            {availableCameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner Container */}
      <div className="relative">
        <div
          id="barcode-scanner-container"
          ref={scannerContainerRef}
          className={`w-full bg-black rounded-lg overflow-hidden ${
            isScanning ? "min-h-[300px]" : "min-h-[200px] flex items-center justify-center"
          }`}
        >
          {!isScanning && !error && (
            <div className="text-center text-white p-8">
              <FaCamera className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm opacity-75">Camera scanner ready</p>
              {cameraId && (
                <button
                  onClick={startScanning}
                  className="mt-4 px-4 py-2 bg-white text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Start Camera Scanner
                </button>
              )}
            </div>
          )}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <Spinner color="#ffffff" size="40px" />
                <p className="mt-2 text-sm">Scanning...</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
            {cameraId && (
              <button
                onClick={startScanning}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Manual Input Option */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or Enter Barcode Manually
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter barcode/SKU"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                const value = e.currentTarget.value.trim();
                if (value) {
                  onScan(value);
                  e.currentTarget.value = "";
                }
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = (e.target as HTMLButtonElement)
                .previousElementSibling as HTMLInputElement;
              if (input?.value.trim()) {
                onScan(input.value.trim());
                input.value = "";
              }
            }}
            className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Close
        </button>
        {isScanning && (
          <button
            onClick={() => stopScanning(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
