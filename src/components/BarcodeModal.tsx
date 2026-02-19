// BarcodeModal.tsx - FINAL VERSION (Perfect Fit Guaranteed)
import React, { useRef, useState, useEffect } from "react";
import JsBarcode from "jsbarcode";
// import { useReactToPrint } from "react-to-print";
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import { toast } from "react-toastify";
import { FaDownload } from "react-icons/fa";
import { useWebViewPrint } from "../hooks/useWebViewPrint";

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
    id: "white",
    name: "White Label",
    widthMm: 38,
    heightMm: 18,
    barcodeWidthMm: 34,
    barcodeHeight: 38,
    topFontSize: "5.8pt",
    shopFontSize: "6.8pt",
    background: "#fff",
  },
  {
    id: "craft",
    name: "Craft (Brown)",
    widthMm: 38,
    heightMm: 18,
    barcodeWidthMm: 34,
    barcodeHeight: 38,
    topFontSize: "5.8pt",
    shopFontSize: "6.8pt",
    background: "#d4a574",
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
  price,
  categoryName,
  brandName,
  modelNo,
  shopName,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedSize, setSelectedSize] = useState<LabelSize>(LABEL_SIZES[0]);
  const [isPrinting, setIsPrinting] = useState(false);
  const { isWebView, sendPrintSignal } = useWebViewPrint();

  const handleDownload = () => {
    const scale = 10;
    const width = size.widthMm * 3.78 * scale;
    const height = size.heightMm * 3.78 * scale;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = size.background || "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "top";

    const topText = [brandName, categoryName, modelNo].filter(Boolean).join(" / ");

    const fontSize1 = 8 * 1.33 * scale;
    ctx.font = `500 ${fontSize1}px Inter, system-ui, sans-serif`;
    ctx.fillText(topText.toUpperCase(), width / 2, 2 * 3.78 * scale);

    const fontSize2 = 8 * 1.33 * scale;
    ctx.font = `900 ${fontSize2}px Inter, system-ui, sans-serif`;
    ctx.fillText(`SHOP: ${shopName?.toUpperCase() || ''}`, width / 2, 6 * 3.78 * scale);

    const barcodeCanvas = document.createElement("canvas");
    JsBarcode(barcodeCanvas, sku || "", {
      format: "CODE128",
      width: 2 * scale,
      height: 38 * scale,
      displayValue: true,
      fontSize: 10 * scale,
      margin: 0,
      fontOptions: "bold",
    });

    const bWidth = barcodeCanvas.width;
    const bHeight = barcodeCanvas.height;
    const targetBWidth = width * 0.9;
    const targetBHeight = height * 0.5;
    const ratio = Math.min(targetBWidth / bWidth, targetBHeight / bHeight);

    const finalBWidth = bWidth * ratio;
    const finalBHeight = bHeight * ratio;

    ctx.drawImage(
      barcodeCanvas,
      (width - finalBWidth) / 2,
      height - finalBHeight - (2 * 3.78 * scale),
      finalBWidth,
      finalBHeight
    );

    const link = document.createElement("a");
    link.download = `barcode_${sku}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  };

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

  // const handlePrint = useReactToPrint({
  //   contentRef: printRef,
  //   documentTitle: `Label_${sku}`,
  //   pageStyle: `
  //     @page { 
  //       size: ${size.widthMm}mm ${size.heightMm}mm !important; 
  //       margin: 0 !important; 
  //     }
  //     @media print {
  //       html, body { 
  //         margin: 0 !important; 
  //         padding: 0 !important; 
  //         width: ${size.widthMm}mm !important; 
  //         height: ${size.heightMm}mm !important;
  //         -webkit-print-color-adjust: exact !important;
  //         print-color-adjust: exact !important;
  //       }
  //       #barcode-print-content {
  //         width: ${size.widthMm}mm !important;
  //         height: ${size.heightMm}mm !important;
  //         margin: 0 !important;
  //         padding: 2mm !important;
  //         box-sizing: border-box !important;
  //       }
  //     }
  //   `,
  // });

  // Helper for USB Printer
  const getPrinter = async () => {
    try {
      const navigatorAny = navigator as any;
      const devices = await navigatorAny.usb.getDevices();
      if (devices.length > 0) return devices[0];

      return await navigatorAny.usb.requestDevice({
        filters: [{ classCode: 7 }],
      });
    } catch (err) {
      throw new Error("Printer not connected or permission denied");
    }
  };

  // Solution 1: TSPL for dedicated Barcode Label Printers (Xprinter, TSC, etc.)
  const handleLabelPrinterPrint = async () => {
    if (!sku) {
      toast.error("SKU is required");
      return;
    }
    setIsPrinting(true);

    if (isWebView) {
      sendPrintSignal("BARCODE_LABEL", {
        sku,
        productName: name || "",
        price,
        brandName,
        categoryName,
        modelNo,
        shopName,
        labelSize: {
          widthMm: size.widthMm,
          heightMm: size.heightMm,
        },
      });
      toast.success("Label print signal sent to app");
      setIsPrinting(false);
      onClose();
      return;
    }

    try {
      const device = await getPrinter();
      await device.open();
      if (!device.configuration) await device.selectConfiguration(1);
      await device.claimInterface(0);

      const topText = [brandName, categoryName, modelNo].filter(Boolean).join(" / ");
      const encoder = new TextEncoder();

      // TSPL Commands for 38x18mm Label
      let commands = `SIZE ${size.widthMm} mm, ${size.heightMm} mm\r\n`;
      commands += `GAP 2 mm, 0\r\n`;
      commands += `DIRECTION 1\r\n`;
      commands += `CLS\r\n`;
      commands += `TEXT 140,15,"0",0,1,1,3,"${topText.substring(0, 25)}"\r\n`; // Centered roughly (140 dots = 17.5mm)
      commands += `TEXT 140,40,"0",0,1,1,3,"SHOP: ${shopName || ''}"\r\n`;
      commands += `BARCODE 40,70,"128",50,1,0,2,2,"${sku}"\r\n`; // X:40, Y:70, Type:128, Height:50, Readable:1
      commands += `PRINT 1\r\n`;

      const result = encoder.encode(commands);
      await device.transferOut(1, result);

      await device.releaseInterface(0);
      await device.close();

      toast.success('Label printed to Label Printer!');
      onClose();
    } catch (error: any) {
      console.error("Label print error:", error);
      toast.error(`Label printer failed: ${error.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  // Solution 2: ESC/POS (Original, for Thermal Receipt Printers in Barcode Mode)
  const handleThermalPrint = async () => {
    if (!sku) {
      toast.error("SKU is required");
      return;
    }

    setIsPrinting(true);

    if (isWebView) {
      sendPrintSignal("BARCODE", {
        sku,
        productName: name || "",
        price: price || 0,
        brandName,
        categoryName,
        modelNo,
        shopName,
      });
      toast.success("Barcode print signal sent to app");
      setIsPrinting(false);
      onClose();
      return;
    }

    try {
      const device = await getPrinter();
      await device.open();
      if (!device.configuration) await device.selectConfiguration(1);
      await device.claimInterface(0);

      const encoder = new ReceiptPrinterEncoder();
      const topText = [brandName, categoryName, modelNo].filter(Boolean).join(" / ");

      const result = encoder
        .initialize()
        .width(8)
        .align('center')
        .line(topText.substring(0, 25))
        .text(" ")
        .bold(true)
        .line(`SHOP: ${shopName || ''}`)
        .bold(false)
        .barcode(sku, 'code128', 40, 2)
        .encode();

      await device.transferOut(1, result);
      await device.releaseInterface(0);
      await device.close();

      toast.success('Label printed (ESC/POS)!');
      onClose();
    } catch (error: any) {
      console.error("Thermal print error:", error);
      toast.error(`Thermal print failed: ${error.message}`);
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
              <div className="text-center leading-none mt-1">
                <div
                  className="font-medium truncate uppercase text-[8px] text-black mb-1"
                  title={name}
                >
                  {[brandName, categoryName, modelNo]
                    .filter(Boolean)
                    .join(" / ")}
                </div>
                <div
                  className="font-black mb-1 uppercase tracking-wider truncate text-[8px]"
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
              <div className="text-center leading-none mt-1">
                <div
                  className="font-medium truncate uppercase text-[8px] text-black mb-1"
                  title={name}
                >
                  {[brandName, categoryName, modelNo]
                    .filter(Boolean)
                    .join(" / ")}
                </div>
                <div
                  className="font-black mb-1 uppercase tracking-wider truncate text-[8px]"
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
          <div className="flex flex-col md:flex-row justify-center gap-3 mt-8">
            <button
              onClick={onClose}
              disabled={isPrinting}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition flex-1 md:flex-none"
            >
              Cancel
            </button>

            <button
              onClick={handleThermalPrint}
              disabled={isPrinting}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-lg transition flex-1 md:flex-none"
            >
              Print (Thermal)
            </button>
            <button
              onClick={handleDownload}
              disabled={isPrinting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition flex items-center justify-center gap-2 flex-1 md:flex-none"
            >
              <FaDownload className="w-4 h-4" />
              PNG
            </button>
            <button
              onClick={handleLabelPrinterPrint}
              disabled={isPrinting}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-xl hover:shadow-purple-500/50 transition transform hover:scale-105 disabled:opacity-50 flex-1 md:flex-none"
            >
              {isPrinting ? "Printing..." : `Label Printer (Direct)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeModal;
