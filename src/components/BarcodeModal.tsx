import React, { useEffect, useRef } from "react";

interface BarcodeModalProps {
  sku: string;
  name: string;
  price: number;
  onClose: () => void;
}

const BarcodeModal: React.FC<BarcodeModalProps> = ({
  sku,
  name,
  price,
  onClose,
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize barcode after component mounts
    if (barcodeRef.current) {
      (window as any).JsBarcode(barcodeRef.current, sku, {
        format: "CODE128",
        width: 1.5, // Reduced width
        height: 40, // Reduced height
        displayValue: true,
        fontSize: 8, // Smaller font size
        margin: 5, // Reduced margin
        textMargin: 2, // Added smaller text margin
      });
    }
  }, [sku]);

  const handlePrint = () => {
    const printContent = containerRef.current?.innerHTML || "";
    const printWindow = window.open("", "", "height=600,width=800");

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              @page {
                size: 40mm 25mm;  /* Adjusted size for standard barcode labels */
                margin: 0;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                width: 40mm;
                height: 25mm;
              }
              .barcode-container {
                width: 40mm;
                height: 25mm;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 1mm;
              }
              .barcode-wrapper {
                transform: scale(0.9); /* Slightly scale down to ensure fit */
                transform-origin: center center;
              }
              svg {
                display: block;
                width: 35mm !important;
                height: auto !important;
              }
              .product-name {
                font-size: 6pt;
                line-height: 1.2;
                font-family: Arial, sans-serif;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 35mm;
                text-align: center;
              }
              .sku {
                font-size: 6pt;
                color: #666;
                line-height: 1.2;
                font-family: Arial, sans-serif;
              }
              .product-price {
                font-size: 7pt;
                font-weight: bold;
                line-height: 1.2;
                font-family: Arial, sans-serif;
              }
              @media print {
                html, body {
                  width: 40mm;
                  height: 25mm;
                  overflow: hidden;
                }
                .barcode-container {
                  break-inside: avoid;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="barcode-wrapper">
                ${printContent}
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Barcode Preview */}
      <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300">
        <div ref={containerRef} className="w-48 mx-auto space-y-1 text-center">
          <svg ref={barcodeRef} className="w-full"></svg>
          <div className="text-xs font-medium product-name">{name}</div>
          <div className="text-xs text-gray-600 sku">SKU: {sku}</div>
          <div className="text-xs font-bold product-price">
            ${Number(price).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handlePrint}
          className="px-6 py-2 text-white bg-brand-primary rounded-lg hover:bg-brand-hover transition-colors"
        >
          Print Barcode
        </button>
      </div>
    </div>
  );
};

export default BarcodeModal;
