import { useState } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FaQrcode, FaCheckCircle } from "react-icons/fa";

const BarcodeScannerTest: React.FC = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBarcodes, setScannedBarcodes] = useState<string[]>([]);

  const handleBarcodeScan = (barcode: string) => {
    console.log("Scanned barcode:", barcode);
    setScannedBarcodes((prev) => [barcode, ...prev.slice(0, 9)]); // Keep last 10 scans
  };

  const clearHistory = () => {
    setScannedBarcodes([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-brand-primary p-3 rounded-lg">
                <FaQrcode className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Barcode Scanner Test
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Public testing page - No login required
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors flex items-center gap-2 font-medium shadow-md"
            >
              <FaQrcode className="w-5 h-5" />
              <span className="hidden sm:inline">Open Scanner</span>
              <span className="sm:hidden">Scan</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            How to Test
          </h2>
          <ul className="space-y-2 text-blue-800 text-sm md:text-base">
            <li className="flex items-start gap-2">
              <FaCheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Physical Scanner:</strong> Connect a USB barcode scanner
                and scan directly. The scanner will automatically detect barcode
                input.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Camera Scanner:</strong> Click "Open Scanner" and allow
                camera access. Point your camera at a barcode/QR code to scan.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Manual Input:</strong> Use the manual input field in the
                scanner modal to test with custom barcode values.
              </span>
            </li>
          </ul>
        </div>

        {/* Scanned Barcodes History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Scanned Barcodes History
            </h2>
            {scannedBarcodes.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
              >
                Clear History
              </button>
            )}
          </div>

          {scannedBarcodes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaQrcode className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No barcodes scanned yet</p>
              <p className="text-sm mt-2">
                Open the scanner and scan a barcode to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scannedBarcodes.map((barcode, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-brand-primary transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm md:text-base text-gray-800 break-all">
                        {barcode}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Scanned {index === 0 ? "just now" : `${index} scan${index === 1 ? "" : "s"} ago`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <FaCheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test QR Codes Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Test QR Codes / Barcodes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">
                Generate Test QR Code:
              </h3>
              <p className="text-sm text-gray-600">
                You can use online QR code generators to create test codes. Try
                scanning: <code className="bg-gray-100 px-2 py-1 rounded">TEST123456</code>
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">
                Common Test Barcodes:
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• EAN-13: 1234567890128</li>
                <li>• UPC-A: 012345678905</li>
                <li>• Code 128: TEST-123</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>
            This is a public test page. All scanned data is stored locally and
            cleared on page refresh.
          </p>
        </div>
      </div>

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ErrorBoundary
              onError={(error, errorInfo) => {
                console.error("BarcodeScanner error:", error, errorInfo);
              }}
              fallback={
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                      Scanner Error
                    </h3>
                    <p className="text-sm text-red-700 mb-4">
                      The barcode scanner encountered an error. Please try again
                      or use the manual input option.
                    </p>
                    <button
                      onClick={() => setIsScannerOpen(false)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              }
            >
              <BarcodeScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleBarcodeScan}
                title="Test Barcode Scanner"
              />
            </ErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScannerTest;

