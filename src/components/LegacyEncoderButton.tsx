import { useState } from 'react';
import EscPosEncoder from 'esc-pos-encoder';

const LegacyEncoderButton = () => {
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

            const encoder = new EscPosEncoder();

            // Helper constants
            const solidLine = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'; // 48 chars
            const dashedLine = '------------------------------------------------'; // 48 chars

            // Exact replica logic
            const result = encoder
                .initialize()

                // Header
                .align('center')
                .bold(true)
                .width(2).height(2).text('FG STORE 01').width(1).height(1).text('\n')
                .bold(false)
                .text('Patong\n')
                .text('Tel: +66637475569\n')
                .bold(true).text(solidLine).text('\n').bold(false)

                // Invoice Title
                .bold(true).width(2).height(2).text('INVOICE').text('\n').width(1).height(1).bold(false)
                .text('Invoice #: INV-00000005\n')
                .text('Date: 2/5/2026, 11:27:12 PM\n')
                .text('\n')

                // Customer Info (Left Align)
                .align('left')
                .bold(true).text('Guests: ').bold(false).text('1\n')
                .bold(true).text('Customer: ').bold(false).text('Walk-in Customer\n')
                .bold(true).text('Phone: ').bold(false).text('N/A\n')
                .align('center').bold(true).text(solidLine).text('\n').bold(false).align('left')

                // Items Header
                .bold(true)
                .text('QTY   ITEM                            TOTAL\n')
                .bold(false)
                .text(solidLine + '\n')

                // Item 1
                .text('1     AUDEMARS PIGUET (AP)        ฿3,000.00\n')
                .text('      ROYAL OAK,\n')
                .text('      CHRONOGRAPH, FULL\n')
                .text('      YELLOW GOLD, BLUE FACE\n')
                .text('      GOLD - NORMAL\n')

                .align('center').bold(true).text(solidLine).text('\n').bold(false).align('left')
                .text('\n')

                // Totals
                .text('Subtotal:                      ฿3,000.00\n')
                .text('Tax (0.00%):                       ฿0.00\n')
                .align('center').bold(true).text(solidLine).text('\n').bold(false).align('left')

                // Grand Total
                .bold(true)
                .width(1).height(1).text('GRAND TOTAL:               ')
                .width(2).height(1).text('฿3,000.00')
                .width(1).height(1).text('\n')
                .bold(false)
                .align('center').bold(true).text(solidLine).text('\n').bold(false).align('left')
                .text('\n')

                // Payment
                .text('Payment Method:                     CASH\n')
                .text('Payment Status:                completed\n')
                .bold(true).text('Paid Amount:                   ฿3,000.00\n').bold(false)
                .align('center').text(dashedLine + '\n')

                // Footer
                .bold(true).text('Thank you for your business!\n').bold(false)
                .text('fgstore01@gmail.com\n')
                .text('Tax ID: 123456\n')
                .text('\n\n\n')
                .cut()
                .encode();

            await device.transferOut(1, result);
            await device.releaseInterface(0);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Legacy Print failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <button
                onClick={handlePrint}
                disabled={loading}
                className="w-full py-4 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
                {loading ? 'Printing...' : 'Test Legacy (Exact Match)'}
            </button>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default LegacyEncoderButton;
