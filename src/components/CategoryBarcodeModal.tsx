import React, { useRef, useState, useEffect } from "react";
import JsBarcode from "jsbarcode";
import html2canvas from "html2canvas";
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
    const { isWebView, sendPrintSignal } = useWebViewPrint();

    useEffect(() => {
        if (barcode) {
            JsBarcode("#category-barcode-svg", barcode, {
                format: "CODE128",
                lineColor: "#000",
                width: 2,
                height: 100,
                displayValue: true,
                fontSize: 16,
                margin: 10,
            });
        }
    }, [barcode]);

    const handleDownload = async () => {
        if (barcodeRef.current) {
            const canvas = await html2canvas(barcodeRef.current);
            const link = document.createElement("a");
            link.download = `category_barcode_${barcode}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        }
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
                    <div
                        ref={barcodeRef}
                        className="bg-white p-6 border-2 border-dashed border-gray-200 rounded-xl"
                        style={{ minWidth: "300px" }}
                    >
                        <div className="text-center mb-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                {shopName}
                            </p>
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                                {categoryName}
                            </h3>
                        </div>
                        <div className="flex justify-center">
                            <svg id="category-barcode-svg"></svg>
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
