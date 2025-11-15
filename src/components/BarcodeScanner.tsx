import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, CameraDevice } from "html5-qrcode";
import { FaTimes, FaCamera, FaSyncAlt } from "react-icons/fa";
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
  const [cameraMode, setCameraMode] = useState<"deviceId" | "facingMode">("deviceId");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const isUnmountingRef = useRef<boolean>(false);
  const isSwitchingCameraRef = useRef<boolean>(false);

  // Physical barcode scanner detection
  const barcodeBufferRef = useRef<string>("");
  const barcodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize cameras
  useEffect(() => {
    if (isOpen) {
      isUnmountingRef.current = false;
      isSwitchingCameraRef.current = false;
      setError(null);
      setAvailableCameras([]);
      setCameraId(null);
      setIsScanning(false);

      // Get cameras as per documentation
      Html5Qrcode.getCameras()
        .then((cameras) => {
          if (isUnmountingRef.current) return;

          if (cameras && cameras.length > 0) {
            setAvailableCameras(cameras);
            
            // Try to detect if mobile device (has front and back camera)
            const hasFrontCamera = cameras.some(cam => 
              cam.label?.toLowerCase().includes('front') || 
              cam.label?.toLowerCase().includes('user') ||
              cam.id.includes('front')
            );
            const hasBackCamera = cameras.some(cam => 
              cam.label?.toLowerCase().includes('back') || 
              cam.label?.toLowerCase().includes('environment') ||
              cam.id.includes('back')
            );
            
            // If mobile-like device, prefer facingMode; otherwise use device ID
            if (hasFrontCamera && hasBackCamera) {
              setCameraMode("facingMode");
              setFacingMode("environment"); // Default to back camera
            } else {
              setCameraMode("deviceId");
              setCameraId(cameras[0].id);
            }
            
            setError(null);
          } else {
            setError("No cameras found. Please connect a camera or use manual input.");
          }
        })
        .catch((err) => {
          if (isUnmountingRef.current) return;

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
      // Mark as unmounting to prevent any async operations
      isUnmountingRef.current = true;
      isSwitchingCameraRef.current = false;

      // Stop scanner if active - don't await in cleanup (React doesn't support it)
      // stopScannerInternal always resolves, so it's safe to fire-and-forget
      stopScannerInternal().catch(() => {
        // Ignore errors in cleanup
      });
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

  // Internal stop function - doesn't update state, just stops the scanner
  // As per documentation: stop() returns a Promise
  // Note: the class is stateful and stop() should be called to properly tear down
  const stopScannerInternal = (): Promise<void> => {
    console.log({current:scannerRef.current})
    if (!scannerRef.current) {
      return Promise.resolve();
    }

    // Save reference before clearing
    const scanner = scannerRef.current;
    scannerRef.current = null; // Clear ref immediately to prevent double calls

    // As per documentation: stop() returns Promise for stopping the video feed
    return scanner.stop()
      .then((_ignore) => {
        // QR Code scanning is stopped.
        // Promise resolved successfully
        onClose();
      })
      .catch((err: any) => {
        // Stop failed, handle it.
        // Ignore expected errors - scanner might already be stopped
        const errorMessage = err?.message || err?.toString() || String(err || "");
        const isExpectedError = 
          !errorMessage ||
          errorMessage.includes("not running") ||
          errorMessage.includes("stopped") ||
          errorMessage.includes("No QR code scanning in progress") ||
          errorMessage.includes("already stopped") ||
          errorMessage.includes("Scanner is not running");
        
        // Only log unexpected errors
        if (!isExpectedError) {
          console.warn("Error stopping scanner:", err);
        }
        // Always resolve - don't throw, even on error
        // The scanner ref is cleared, so state is consistent
      });
  };

  const stopScanning = async (): Promise<void> => {
    // If no scanner instance, just update state
    if (!scannerRef.current) {
      setIsScanning(false);
      setError(null);
      return;
    }

    try {
      // Stop scanner as per documentation
      // stop() returns Promise and should be called to tear down properly
      // Note: stopScannerInternal always resolves (never rejects)
      await stopScannerInternal();
      // Clear error on successful stop
      setError(null);
    } catch (err) {
      // stopScannerInternal never rejects, but catch just in case
      console.warn("Unexpected error in stopScanning:", err);
    } finally {
      // Always update state after stopping attempt
      // Only update if not unmounting (unmounting has its own cleanup)
      if (!isUnmountingRef.current) {
        setIsScanning(false);
      }
    }
  };

  const startScanning = async (
    targetCameraId?: string | null,
    targetMode?: "deviceId" | "facingMode",
    targetFacingMode?: "user" | "environment"
  ): Promise<void> => {
    if (isUnmountingRef.current || isSwitchingCameraRef.current) {
      return;
    }

    const useMode = targetMode || cameraMode;
    const activeCameraId = targetCameraId || cameraId;
    const activeFacingMode = targetFacingMode || facingMode;

    // Validate camera selection
    if (useMode === "deviceId" && !activeCameraId) {
      setError("No camera selected");
      return;
    }

    if (useMode === "facingMode" && !activeFacingMode) {
      setError("No camera facing mode selected");
      return;
    }

    // Ensure container exists
    const container = document.getElementById("barcode-scanner-container");
    if (!container || isUnmountingRef.current) {
      setError("Scanner container not found. Please try again.");
      return;
    }

    // Stop any existing scanner instance first - CRITICAL for camera switching
    if (scannerRef.current) {
      try {
        await stopScannerInternal();
        // Wait a bit for camera to fully release (especially important for mobile)
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        console.warn("Error stopping previous scanner:", err);
        scannerRef.current = null;
      }
    }

    if (isUnmountingRef.current || isSwitchingCameraRef.current) {
      setIsScanning(false);
      return;
    }

    try {
      setIsScanning(true);
      setError(null);

      // Wait a bit to ensure container is fully ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (isUnmountingRef.current || isSwitchingCameraRef.current) {
        setIsScanning(false);
        return;
      }

      // Double-check container still exists and is in DOM
      const containerCheck = document.getElementById("barcode-scanner-container");
      if (!containerCheck || !document.body.contains(containerCheck)) {
        throw new Error("Container disappeared during initialization");
      }

      // Create new scanner instance as per documentation
      const html5QrCode = new Html5Qrcode("barcode-scanner-container");
      scannerRef.current = html5QrCode;

      if (isUnmountingRef.current || isSwitchingCameraRef.current) {
        html5QrCode.stop().catch(() => {});
        scannerRef.current = null;
        setIsScanning(false);
        return;
      }

      // Prepare camera config as per documentation
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      };

      // Determine camera constraint based on mode
      let cameraConstraint: string | { facingMode: string } | { deviceId: { exact: string } };
      
      if (useMode === "facingMode") {
        // Use facingMode for mobile devices as per documentation
        cameraConstraint = { facingMode: activeFacingMode };
      } else {
        // Use deviceId with exact constraint as per documentation
        cameraConstraint = { deviceId: { exact: activeCameraId! } };
      }

      // Start scanning as per documentation pattern
      await html5QrCode.start(
        cameraConstraint,
        config,
        (decodedText, _decodedResult) => {
          // Successfully scanned - as per documentation
          if (isUnmountingRef.current || isSwitchingCameraRef.current) return;

          try {
            onScan(decodedText);
            // Don't auto-stop after scan - let user continue
          } catch (err) {
            if (!isUnmountingRef.current && !isSwitchingCameraRef.current) {
              console.error("Error handling scan result:", err);
              setError("Error processing scan result. Please try again.");
            }
          }
        },
        (_errorMessage) => {
          // Parse error, ignore it - as per documentation
          // Scanning errors are frequent and can be ignored
        }
      );
    } catch (err: any) {
      if (isUnmountingRef.current || isSwitchingCameraRef.current) {
        setIsScanning(false);
        return;
      }

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

  const handleCameraChange = async (newCameraId: string) => {
    if (isSwitchingCameraRef.current || isUnmountingRef.current) {
      return; // Prevent concurrent camera switches
    }

    if (newCameraId === cameraId && cameraMode === "deviceId") {
      return; // Same camera, no need to switch
    }

    try {
      isSwitchingCameraRef.current = true;
      setError(null);

      // Stop current scanner completely using Promise as per documentation
      await stopScanning().then(() => {
        // QR Code scanning is stopped.
      }).catch((err) => {
        // Stop failed, handle it.
        console.warn("Stop error during camera change:", err);
      });

      // Wait for scanner to fully stop (important for mobile devices)
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (isUnmountingRef.current) {
        isSwitchingCameraRef.current = false;
        return;
      }

      // Update camera mode and ID
      setCameraMode("deviceId");
      setCameraId(newCameraId);

      // Wait a bit more for state to settle
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Start scanning with new camera
      if (!isUnmountingRef.current && !isSwitchingCameraRef.current) {
        await startScanning(newCameraId, "deviceId");
      }
    } catch (err) {
      console.error("Error changing camera:", err);
      if (!isUnmountingRef.current) {
        setError("Failed to change camera. Please try again.");
      }
    } finally {
      isSwitchingCameraRef.current = false;
    }
  };

  // Handle facing mode change (for mobile devices)
  const handleFacingModeChange = async (newFacingMode: "user" | "environment") => {
    if (isSwitchingCameraRef.current || isUnmountingRef.current) {
      return;
    }

    if (newFacingMode === facingMode && cameraMode === "facingMode") {
      return; // Same facing mode, no need to switch
    }

    try {
      isSwitchingCameraRef.current = true;
      setError(null);

      // Stop current scanner completely using Promise as per documentation
      await stopScanning().then(() => {
        // QR Code scanning is stopped.
      }).catch((err) => {
        console.warn("Stop error during facing mode change:", err);
      });

      // Wait for scanner to fully stop (important for mobile devices)
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (isUnmountingRef.current) {
        isSwitchingCameraRef.current = false;
        return;
      }

      // Update facing mode
      setCameraMode("facingMode");
      setFacingMode(newFacingMode);

      // Wait a bit more for state to settle
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Start scanning with new facing mode
      if (!isUnmountingRef.current && !isSwitchingCameraRef.current) {
        await startScanning(null, "facingMode", newFacingMode);
      }
    } catch (err) {
      console.error("Error changing facing mode:", err);
      if (!isUnmountingRef.current) {
        setError("Failed to change camera. Please try again.");
      }
    } finally {
      isSwitchingCameraRef.current = false;
    }
  };

  // Toggle between front and back camera (useful for mobile devices)
  const toggleCamera = () => {
    // If using facingMode, toggle between user and environment
    if (cameraMode === "facingMode") {
      const newFacingMode = facingMode === "user" ? "environment" : "user";
      handleFacingModeChange(newFacingMode);
      return;
    }

    // Otherwise, toggle between device IDs
    if (availableCameras.length < 2) {
      setError("Only one camera available");
      return;
    }

    // Find current camera index
    const currentIndex = availableCameras.findIndex(
      (cam) => cam.id === cameraId
    );

    // Get next camera (wrap around if at the end)
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];

    handleCameraChange(nextCamera.id);
  };

  // Auto-start scanning when camera is selected and modal is open
  useEffect(() => {
    if (
      isOpen &&
      (cameraMode === "deviceId" ? cameraId : facingMode) &&
      !isScanning &&
      !scannerRef.current &&
      !isSwitchingCameraRef.current &&
      !isUnmountingRef.current
    ) {
      // Delay to ensure container is fully mounted and ready
      const timeoutId = setTimeout(() => {
        if (isUnmountingRef.current || isSwitchingCameraRef.current) {
          return;
        }

        // Double check container exists and modal is still open
        const container = document.getElementById("barcode-scanner-container");
        if (container && isOpen && container.offsetParent !== null) {
          // Container is visible and ready
          startScanning(
            cameraMode === "deviceId" ? cameraId : null,
            cameraMode,
            cameraMode === "facingMode" ? facingMode : undefined
          ).catch((err) => {
            if (!isUnmountingRef.current) {
              console.error("Auto-start failed:", err);
              setError(
                "Failed to auto-start scanner. Click 'Start Camera Scanner' to try manually."
              );
            }
          });
        }
      }, 600);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cameraId, facingMode, cameraMode, isScanning]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      // Mark as unmounting to prevent async operations
      isUnmountingRef.current = true;
      isSwitchingCameraRef.current = false;

      // Stop scanning when modal closes
      stopScannerInternal().finally(() => {
        setIsScanning(false);
        setError(null);
        barcodeBufferRef.current = "";
      });
    } else {
      // Reset flags when opening
      isUnmountingRef.current = false;
      isSwitchingCameraRef.current = false;
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
      {availableCameras.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Camera
            </label>
            {availableCameras.length > 1 && (
              <button
                onClick={toggleCamera}
                disabled={isScanning || isSwitchingCameraRef.current}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Switch Camera (Front/Back)"
              >
                <FaSyncAlt className="w-4 h-4" />
                <span>Switch</span>
              </button>
            )}
          </div>
          {cameraMode === "facingMode" ? (
            // Mobile mode - use facingMode selector
            <select
              value={facingMode}
              onChange={(e) => handleFacingModeChange(e.target.value as "user" | "environment")}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              disabled={isScanning || isSwitchingCameraRef.current}
            >
              <option value="environment">Back Camera</option>
              <option value="user">Front Camera</option>
            </select>
          ) : availableCameras.length > 1 ? (
            // Desktop mode - use device ID selector
            <select
              value={cameraId || ""}
              onChange={(e) => handleCameraChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              disabled={isScanning || isSwitchingCameraRef.current}
            >
              {availableCameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || 
                    (camera.label?.toLowerCase().includes('front') || camera.id.includes('front')
                      ? 'Front Camera'
                      : camera.label?.toLowerCase().includes('back') || camera.id.includes('back')
                      ? 'Back Camera'
                      : `Camera ${camera.id.slice(0, 8)}`)}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600">
              {availableCameras[0]?.label || 'Default Camera'}
            </div>
          )}
          {isSwitchingCameraRef.current && (
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <FaSyncAlt className="w-3 h-3 animate-spin" />
              Switching camera...
            </p>
          )}
        </div>
      )}

      {/* Scanner Container */}
      <div className="relative">
        <div
          id="barcode-scanner-container"
          ref={scannerContainerRef}
          className={`w-full bg-black rounded-lg overflow-hidden ${
            isScanning || isSwitchingCameraRef.current
              ? "min-h-[300px]"
              : "min-h-[200px] flex items-center justify-center"
          }`}
        >
          {!isScanning && !error && !isSwitchingCameraRef.current && (
            <div className="text-center text-white p-8">
              <FaCamera className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm opacity-75">Camera scanner ready</p>
              {cameraId && (
                <button
                  onClick={() => startScanning()}
                  className="mt-4 px-4 py-2 bg-white text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
                  disabled={isSwitchingCameraRef.current}
                >
                  Start Camera Scanner
                </button>
              )}
            </div>
          )}
          {(isScanning || isSwitchingCameraRef.current) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <Spinner color="#ffffff" size="40px" />
                <p className="mt-2 text-sm">
                  {isSwitchingCameraRef.current ? "Switching camera..." : "Scanning..."}
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
            {cameraId && !isSwitchingCameraRef.current && (
              <button
                onClick={() => startScanning()}
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
        {isScanning && !isSwitchingCameraRef.current && (
          <button
            onClick={() => stopScanning()}
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
