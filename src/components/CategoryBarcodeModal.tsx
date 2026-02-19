import React, { useRef, useState, useEffect } from "react";
import JsBarcode from "jsbarcode";
import { FaDownload, FaTimes, FaPrint } from "react-icons/fa";
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import { toast } from "react-toastify";
import { useWebViewPrint } from "../hooks/useWebViewPrint";

interface CategoryBarcodeModalProps {
    barcode: string;
    categoryName: string;
    shopName: string;
    onClose: () => void;
}

const CategoryBarcodeModal: React.FC<CategoryBarcodeModalProps> = ({
    barcode,
    categoryName,
    shopName,
    onClose,
}) => {
    const barcodeRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const { isWebView, sendPrintSignal, sendDownloadSignal } = useWebViewPrint();

    useEffect(() => {
        if (barcode) {
            JsBarcode("#category-barcode-svg", barcode, {
                format: "CODE128",
                lineColor: "#000",
                width: 2,
                height: 30, // Reduced from 38 to fit preview
                displayValue: true,
                fontSize: 10,
                margin: 0,
                fontOptions: "bold",
                flat: true,
            });
        }
    }, [barcode]);

    const handleDownload = () => {
        const scale = 10; // High resolution scale
        const width = 38 * 3.78 * scale; // 38mm to px
        const height = 18 * 3.78 * scale; // 18mm to px

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        // 1. Background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // 2. Text Styling
        ctx.textAlign = "center";
        ctx.fillStyle = "#000000";
        ctx.textBaseline = "top";

        // 3. Draw Category Name
        const fontSize1 = 8 * 1.33 * scale;
        ctx.font = `500 ${fontSize1}px Inter, system-ui, sans-serif`;
        ctx.fillText(categoryName.toUpperCase(), width / 2, 2 * 3.78 * scale);

        // 4. Draw Shop Name
        const fontSize2 = 8 * 1.33 * scale;
        ctx.font = `900 ${fontSize2}px Inter, system-ui, sans-serif`;
        ctx.fillText(`SHOP: ${shopName.toUpperCase()}`, width / 2, 6 * 3.78 * scale);

        // 5. Build Barcode Area
        const barcodeCanvas = document.createElement("canvas");
        JsBarcode(barcodeCanvas, barcode, {
            format: "CODE128",
            width: 2 * scale,
            height: 38 * scale,
            displayValue: true,
            fontSize: 10 * scale,
            margin: 0,
            fontOptions: "bold",
        });

        // 6. Draw Barcode onto main canvas
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

        const dataUrl = canvas.toDataURL("image/png", 1.0);

        if (isWebView) {
            sendDownloadSignal(`category_barcode_${barcode}.png`, dataUrl);
            toast.success("Download started on device...");
            return;
        }

        // 7. Trigger Download
        const link = document.createElement("a");
        link.download = `category_barcode_${barcode}.png`;
        link.href = dataUrl;
        link.click();
    };

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

    const handleThermalPrint = async () => {
        if (!barcode) {
            toast.error("Barcode is required");
            return;
        }

        setIsPrinting(true);

        if (isWebView) {
            sendPrintSignal("BARCODE", {
                sku: barcode,
                productName: categoryName,
                shopName,
            });
            toast.success("Print signal sent to app");
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
            const result = encoder
                .initialize()
                .width(8)
                .align('center')
                .line(`CATEGORY: ${categoryName}`)
                .bold(true)
                .line(`SHOP: ${shopName || ''}`)
                .bold(false)
                .barcode(barcode, 'code128', 40, 2)
                .encode();

            await device.transferOut(1, result);
            await device.releaseInterface(0);
            await device.close();

            toast.success('Category printed!');
            onClose();
        } catch (error: any) {
            console.error("Print error:", error);
            toast.error(`Print failed: ${error.message}`);
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Category Barcode</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <div className="bg-gray-50 rounded-xl p-5 border border-black/20 w-full flex justify-center">
                        <div
                            ref={barcodeRef}
                            className="bg-white shadow-2xl overflow-hidden"
                            style={{
                                width: "38mm",
                                height: "18mm",
                                padding: "1.5mm 2mm 1mm",
                                boxSizing: "border-box",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "space-between"
                            }}
                        >
                            <div className="text-center w-full leading-none">
                                <div className="font-medium truncate uppercase text-[9px] text-black mb-1">
                                    {categoryName}
                                </div>
                                <div className="font-black uppercase text-[12px] text-black leading-none">
                                    SHOP: {shopName}
                                </div>
                            </div>

                            <div className="w-full flex-1 flex items-end justify-center bg-white overflow-hidden">
                                <svg id="category-barcode-svg" style={{ width: "100%", height: "auto", maxHeight: "35px" }}></svg>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button
                            onClick={handleDownload}
                            disabled={isPrinting}
                            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            <FaDownload className="w-4 h-4" />
                            <span>PNG</span>
                        </button>
                        <button
                            onClick={handleThermalPrint}
                            disabled={isPrinting}
                            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-brand-primary rounded-xl hover:bg-brand-hover shadow-lg shadow-brand-primary/20 transition-all transform hover:-translate-y-1"
                        >
                            <FaPrint className="w-4 h-4" />
                            <span>{isPrinting ? "Printing..." : "Print"}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="col-span-2 px-4 py-3 text-xs font-medium text-gray-500 hover:text-gray-700 border-t border-gray-100"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryBarcodeModal;
