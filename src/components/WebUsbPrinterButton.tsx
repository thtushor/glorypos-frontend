import { useState } from 'react';
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";

const WebUsbPrinterButton = ({ className = "" }: { className?: string }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePrint = async () => {
        setLoading(true);
        setError(null);
        try {
            let device;
            if ((navigator as any).usb) {
                device = await (navigator as any).usb.requestDevice({
                    filters: [{ classCode: 7 }]
                });
            } else {
                throw new Error("WebUSB not supported.");
            }

            await device.open();
            if (!device.configuration) await device.selectConfiguration(1);
            await device.claimInterface(0);

            const encoder = new ReceiptPrinterEncoder({
                language: 'esc-pos',
                width: 48 // 80mm
            });

            /* 
               We need to manually construct columns for best alignment.
               48 cols total.
               QTY (4) | ITEM (32) | TOTAL (12)
            */

            // Helper for dividers
            const solidLine = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
            const dashedLine = '------------------------------------------------';

            const result = encoder
                .initialize()
                // --- Header ---
                .align('center')
                .bold(true).size(2, 2).text('FG STORE 01').size(1, 1).bold(false)
                .newline()
                .text('Patong')
                .newline()
                .text('Tel: +66637475569')
                .newline()
                .bold(true).text(solidLine).bold(false)

                // --- Invoice Details ---
                .newline()
                .bold(true).size(2, 2).text('INVOICE').size(1, 1).bold(false)
                .newline()
                .text('Invoice #: INV-00000005')
                .newline()
                .text('Date: 2/5/2026, 11:27:12 PM')
                .newline()

                // --- Customer Info ---
                .align('left')
                .bold(true).text('Guests: ').bold(false).text('1')
                .newline()
                .bold(true).text('Customer: ').bold(false).text('Walk-in Customer')
                .newline()
                .bold(true).text('Phone: ').bold(false).text('N/A')
                .newline()
                .align('center').bold(true).text(solidLine).bold(false).align('left')

                // --- Items Header ---
                // QTY (3) + 3 spc + ITEM (28) + 2 spc + TOTAL (12)
                .newline()
                .bold(true)
                .text('QTY   ITEM                            TOTAL')
                .bold(false)
                .newline()
                .text(solidLine)
                .newline()

                // --- Item Row ---
                // Manual column layout for complex wrapping matches image
                // Line 1
                .text('1     AUDEMARS PIGUET (AP)        ฿3,000.00')
                .newline()
                // Line 2
                .text('      ROYAL OAK,')
                .newline()
                // Line 3
                .text('      CHRONOGRAPH, FULL')
                .newline()
                // Line 4
                .text('      YELLOW GOLD, BLUE FACE')
                .newline()
                // Variant
                .text('      GOLD - NORMAL')
                .newline()

                .align('center').bold(true).text(solidLine).bold(false).align('left')
                .newline()

                // --- Totals ---
                // Using manual spacing for alignment (Target 48 chars)
                // "Subtotal:" (9) + spaces + "฿3,000.00" (9)
                // 48 - 9 - 9 = 30 spaces
                .text('Subtotal:                      ฿3,000.00')
                .newline()
                .text('Tax (0.00%):                       ฿0.00')
                .newline()
                .align('center').bold(true).text(solidLine).bold(false).align('left')

                // --- Grand Total ---
                .newline()
                .bold(true)
                // "GRAND TOTAL:" (12) + spaces + "฿3,000.00" (9)
                // 48 - 12 - 9 = 27 spaces
                .size(1, 1).text('GRAND TOTAL:               ')
                .size(2, 1).text('฿3,000.00') // Double Height for price
                .size(1, 1) // Reset
                .bold(false)
                .newline()
                .align('center').bold(true).text(solidLine).bold(false).align('left')
                .newline()

                // --- Payment ---
                .text('Payment Method:                     CASH')
                .newline()
                .text('Payment Status:                completed')
                .newline()
                .bold(true).text('Paid Amount:                   ฿3,000.00').bold(false)
                .newline()
                .align('center').text(dashedLine).align('center')
                .newline()

                // --- Footer ---
                .bold(true).text('Thank you for your business!').bold(false)
                .newline()
                .text('fgstore01@gmail.com')
                .newline()
                .text('Tax ID: 123456')
                .newline()
                .newline()
                .newline() // Feed
                .cut()
                .encode();

            await device.transferOut(1, result);
            await device.releaseInterface(0);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Print failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col">
            <button
                onClick={handlePrint}
                disabled={loading}
                className={`py-2 px-3 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${className}`}
            >
                {loading ? 'Printing...' : 'WebUSB Print'}
            </button>
            {error && <span className="text-red-500 text-[10px] mt-1 text-center bg-white px-1">{error}</span>}
        </div>
    );
};

export default WebUsbPrinterButton;
