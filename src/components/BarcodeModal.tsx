// BarcodeModal.tsx - FINAL VERSION (Perfect Fit Guaranteed)
import React, { useRef, useState, useEffect } from "react";
import JsBarcode from "jsbarcode";
import { useReactToPrint } from "react-to-print";

interface LabelSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  barcodeWidthMm: number;
  barcodeHeight: number;
  topFontSize: string;
  shopFontSize: string;
  background?: string;
}

const LABEL_SIZES: LabelSize[] = [
  {
    id: "craft",
    name: "Craft (Brown)",
    widthMm: 35,
    heightMm: 18,
    barcodeWidthMm: 31,
    barcodeHeight: 38,
    topFontSize: "5.8pt",
    shopFontSize: "6.8pt",
    background: "#d4a574",
  },
  {
    id: "White",
    name: "White (Brown)",
    widthMm: 35,
    heightMm: 18,
    barcodeWidthMm: 31,
    barcodeHeight: 38,
    topFontSize: "5.8pt",
    shopFontSize: "6.8pt",
    background: "#fff",
  },
];

interface BarcodeModalProps {
  sku?: string;
  name?: string;
  price?: number;
  categoryName?: string;
  brandName?: string;
  modelNo?: string;
  shopName?: string;
  onClose: () => void;
}

const BarcodeModal: React.FC<BarcodeModalProps> = ({
  sku,
  name,
  categoryName,
  brandName,
  modelNo,
  shopName,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedSize, setSelectedSize] = useState<LabelSize>(LABEL_SIZES[0]); // default Craft

  const size = selectedSize;

  useEffect(() => {
    const generateBarcode = (elementId: string) => {
      const svg = document.getElementById(elementId);
      if (svg && sku) {
        JsBarcode(svg, sku, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: size.barcodeHeight,
          displayValue: true,
          fontSize: 10,
          margin: 0,
          fontOptions: "bold",
          flat: true,
        });
      }
    };

    generateBarcode("preview-barcode");
    generateBarcode("print-barcode");
  }, [sku, selectedSize]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page { size: ${size.widthMm}mm ${size.heightMm}mm; margin: 0 !important; }
      @media print {
        html, body { margin: 0; padding: 0; width: ${size.widthMm}mm; height: ${size.heightMm}mm; }
      }
    `,
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-screen overflow-y-auto">
        <div className="p-5 pb-10">
          <h2 className="text-lg md:text-3xl font-bold text-center md:mb-5 text-gray-800">
            Print Barcode Label
          </h2>

          {/* Size Selector */}
          <div className="mb-5 mt-2">
            <h3 className="text-[14px] md:text-lg font-semibold mb-2 text-center">
              Select Label Size
            </h3>
            <div className="grid grid-cols-2 gap-4 md:gap-8 md:max-w-lg mx-auto">
              {LABEL_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSize(s)}
                  className={`p-4 rounded-2xl border-4 transition-all transform hover:scale-105 ${
                    selectedSize.id === s.id
                      ? "border-purple-600 bg-purple-50 shadow-2xl ring-4 ring-purple-200"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="font-bold text-[12px] md:text-base">
                    {s.name}
                  </div>
                  <div className="text-gray-600 text-[10px] md:text-sm">
                    {s.widthMm} × {s.heightMm} mm
                  </div>
                  {s.background && (
                    <div
                      className="mt-2 md:mt-4 w-full h-10 md:h-12 rounded-md border md:border-2 border-dashed border-blue-500"
                      style={{ background: s.background }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview - PERFECT FIT */}
          <div className="bg-gray-50 rounded-xl p-5 border border-black/20">
            <p className="text-center font-bold text-gray-700 text-lg uppercase">
              Live Preview
            </p>
            <div
              className="mx-auto  overflow-hidden shadow-2xl"
              style={{
                width: `${size.widthMm}mm`,
                height: `${size.heightMm}mm`,
                background: size.background || "white",
                padding: "1.6mm",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                paddingTop:"1.2mm", 
              }}

            >
              {/* Top: Product Name + Shop Name */}
              <div className="text-center leading-tight  mt-[-4px]">
                <div
                  className="font-medium truncate uppercase text-[8px] text-black"
                  title={name}
                >
                  {[brandName, categoryName, modelNo]
                    .filter(Boolean)
                    .join(" / ")}
                </div>
                <div
                  className="font-black mt-[-1px] mb-[2px] uppercase tracking-wider truncate text-[8px]"
                  style={{ color: "#000" }}
                >
                  SHOP: {shopName}
                </div>
              </div>

              {/* Barcode */}
              <div className="flex justify-center bg-white px-1 pt-0">
                <svg
                  id="preview-barcode"
                  className="w-full max-h-[42px]"
                />
              </div>
            </div>
          </div>

          {/* Hidden Print Area - Exact Match */}
          <div
            style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
          >
            <div
              ref={printRef} 
              style={{
                width: `${size.widthMm}mm`,
                height: `${size.heightMm}mm`,
                background: size.background || "white",
                padding: "1.6mm",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                paddingTop:"1.2mm", 
              }}
            >
              {/* Top: Product Name + Shop Name */}
              <div className="text-center leading-tight">
                <div
                  className="font-medium truncate uppercase text-[6px] text-black"
                  title={name}
                >
                  {[brandName, categoryName, modelNo]
                    .filter(Boolean)
                    .join(" / ")}
                </div>
                <div
                  className="font-black mt-[1px] mb-[2px] uppercase tracking-wider truncate text-[6px]"
                  style={{ color: "#000" }}
                >
                  SHOP: {shopName}
                </div>
              </div>

              <div className="flex justify-center -mt-1">
                <svg
                  id="print-barcode"
                  style={{ width: `${size.barcodeWidthMm}mm` }}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-[14px] font-medium  transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-[14px] rounded-lg shadow-2xl hover:shadow-purple-500/50 transition transform hover:scale-105"
            >
              Print Label ({size.widthMm}×{size.heightMm}mm)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeModal;
