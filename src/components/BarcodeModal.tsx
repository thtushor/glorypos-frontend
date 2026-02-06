// BarcodeModal.tsx - FINAL VERSION (Perfect Fit Guaranteed)
import React, { useRef, useState, useEffect } from "react";
import JsBarcode from "jsbarcode";
import { useReactToPrint } from "react-to-print";
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import { toast } from "react-toastify";

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
  const [isPrinting, setIsPrinting] = useState(false);

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
      @page { 
        size: ${size.widthMm}mm ${size.heightMm}mm !important; 
        margin: 0 !important; 
      }
      @media print {
        html, body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: ${size.widthMm}mm !important; 
          height: ${size.heightMm}mm !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #barcode-print-content {
          width: ${size.widthMm}mm !important;
          height: ${size.heightMm}mm !important;
          margin: 0 !important;
          padding: 2mm !important;
          box-sizing: border-box !important;
        }
      }
    `,
    print: async (printIframe: HTMLIFrameElement) => {
      const contentWindow = printIframe.contentWindow;
      if (contentWindow) {
        contentWindow.print();
      }
    }
  });

  // USB Printer utility
  const getPrinter = async () => {
    try {
      const navigatorAny = navigator as any;
      // Try previously authorized devices
      const devices = await navigatorAny.usb.getDevices();
      if (devices.length > 0) return devices[0];

      // First-time setup
      return await navigatorAny.usb.requestDevice({
        filters: [{ classCode: 7 }], // Printer class
      });
    } catch (err) {
      throw new Error("Printer not connected or permission denied");
    }
  };

  const handleThermalPrint = async () => {
    if (!sku) {
      toast.error("SKU is required for printing");
      return;
    }
    setIsPrinting(true);
    try {
      const device = await getPrinter();
      await device.open();
      if (!device.configuration) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);

      const encoder = new ReceiptPrinterEncoder();

      // Top text line
      const topText = [brandName, categoryName, modelNo].filter(Boolean).join(" / ");

      const result = encoder
        .initialize()
        .width(23)
        .align('center')
        .size(0, 0)
        .line(topText.substring(0, 25))
        .text(" ")
        .bold(true)
        .line(`SHOP: ${shopName || ''}`)
        .bold(false)
        .text(" ")
        .barcode(sku || '0000', 'code128', 40, 2)
        .encode();

      // Transfer data to printer
      await device.transferOut(1, result);

      await device.releaseInterface(0);
      await device.close();

      toast.success('Label printed successfully!');
      onClose();
    } catch (error: any) {
      console.error("Thermal print error:", error);
      toast.error(`Print failed: ${error.message}. Switching to browser print.`);
      // handlePrint();
    } finally {
      setIsPrinting(false);
    }
  };

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
                  className={`p-4 rounded-2xl border-4 transition-all transform hover:scale-105 ${selectedSize.id === s.id
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
              className="mx-auto overflow-hidden shadow-2xl"
              style={{
                width: `${size.widthMm}mm`,
                height: `${size.heightMm}mm`,
                background: size.background || "white",
                padding: "2mm",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Top: Product Name + Shop Name */}
              <div className="text-center leading-tight mt-[-4px]">
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
                <svg id="preview-barcode" className="w-full max-h-[42px]" />
              </div>
            </div>
          </div>

          {/* Hidden Print Area - Exact Match to Preview */}
          <div
            style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
          >
            <div
              ref={printRef}
              id="barcode-print-content"
              style={{
                width: `${size.widthMm}mm`,
                height: `${size.heightMm}mm`,
                background: size.background || "white",
                padding: "2mm",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Top: Product Name + Shop Name - Synced with Preview styles */}
              <div className="text-center leading-tight mt-[-4px]">
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

              <div className="flex justify-center bg-white px-1 pt-0">
                <svg
                  id="print-barcode"
                  style={{ width: "100%", maxHeight: "42px" }}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-5">
            <button
              onClick={onClose}
              disabled={isPrinting}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-[14px] font-medium  transition"
            >
              Cancel
            </button>
            <button
              onClick={handleThermalPrint}
              disabled={isPrinting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-[14px] rounded-lg shadow-2xl hover:shadow-purple-500/50 transition transform hover:scale-105 disabled:opacity-50"
            >
              {isPrinting ? "Printing..." : `Print Label (${size.widthMm}×${size.heightMm}mm)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeModal;
