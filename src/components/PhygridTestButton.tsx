import { useState } from 'react';
import { ThermalPrinter } from '@phygrid/thermal-printer';

const PhygridTestButton = () => {
    const [loading, setLoading] = useState(false);

    const handlePrint = async () => {
        setLoading(true);
        try {
            const peripheralInstance = {
                emit: async (event: string, data: any) => {
                    console.log('🖨️ Mock Printer Emit:', event, data);
                    return Promise.resolve();
                },
                on: (event: string, cb: Function) => { },
                off: (event: string, cb: Function) => { },
            } as any;

            const printer = new ThermalPrinter(peripheralInstance);

            const solidLine = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'; // 48 chars
            const dashedLine = '------------------------------------------------'; // 48 chars

            // Header
            printer
                .addText('FG STORE 01', {
                    align: 'center',
                    size: { width: 2, height: 2 },
                    bold: true
                })
                .addText('\n')
                .addText('Patong', { align: 'center' })
                .addText('\n')
                .addText('Tel: +66637475569', { align: 'center' })
                .addText('\n')
                .addText(solidLine, { align: 'center', bold: true })
                .addText('\n');

            // Invoice Title
            printer
                .addText('INVOICE', {
                    align: 'center',
                    size: { width: 2, height: 2 },
                    bold: true
                })
                .addText('\n')
                .addText('Invoice #: INV-00000005', { align: 'center' })
                .addText('\n')
                .addText('Date: 2/5/2026, 11:27:12 PM', { align: 'center' })
                .addText('\n');

            // Customer Info
            printer
                .addText('Guests: ', { align: 'left', bold: true })
                .addText('1', { align: 'left' })
                .addText('\n')
                .addText('Customer: ', { align: 'left', bold: true })
                .addText('Walk-in Customer', { align: 'left' })
                .addText('\n')
                .addText('Phone: ', { align: 'left', bold: true })
                .addText('N/A', { align: 'left' })
                .addText('\n')
                .addText(solidLine, { align: 'center', bold: true })
                .addText('\n');

            // Items Header
            printer
                .addText('QTY   ITEM                            TOTAL', { bold: true })
                .addText('\n')
                .addText(solidLine, { align: 'center' })
                .addText('\n');

            // Item 1
            printer
                .addText('1     AUDEMARS PIGUET (AP)        ฿3,000.00', { align: 'left' })
                .addText('\n')
                // Indention: 6 spaces to align with ITEM
                .addText('      ROYAL OAK,', { align: 'left' })
                .addText('\n')
                .addText('      CHRONOGRAPH, FULL', { align: 'left' })
                .addText('\n')
                .addText('      YELLOW GOLD, BLUE FACE', { align: 'left' })
                .addText('\n')
                .addText('      GOLD - NORMAL', { align: 'left' })
                .addText('\n')
                .addText(solidLine, { align: 'center', bold: true })
                .addText('\n');

            // Totals
            // Manual spacing for 48 chars
            printer
                .addText('Subtotal:                      ฿3,000.00', { align: 'left' })
                .addText('\n')
                .addText('Tax (0.00%):                       ฿0.00', { align: 'left' })
                .addText('\n')
                .addText(solidLine, { align: 'center', bold: true })
                .addText('\n');

            // Grand Total
            printer
                // Mix of sizes in one line is tricky in some libs, but Phygrid usually supports chaining
                // If not, we might need separate calls. assuming new line for safety or constructing line manually.
                .addText('GRAND TOTAL:               ', {
                    align: 'left',
                    bold: true,
                    size: { width: 1, height: 1 }
                })
                // Note: Switching size mid-line might force newline on some hardware. 
                // If it breaks, move to separate lines or keep same size.
                // For safety in this test, I will keep on same line but note potential hardware quirk.
                .addText('฿3,000.00', {
                    align: 'right', // align right doesn't work mid-line usually, it applies to whole line
                    size: { width: 2, height: 1 },
                    bold: true
                })
                .addText('\n')
                .addText(solidLine, { align: 'center', bold: true })
                .addText('\n');

            // Payment Info
            printer
                .addText('Payment Method:                     CASH', { align: 'left' })
                .addText('\n')
                .addText('Payment Status:                completed', { align: 'left' })
                .addText('\n')
                .addText('Paid Amount:                   ฿3,000.00', { align: 'left', bold: true })
                .addText('\n')
                .addText(dashedLine, { align: 'center' }) // Dashed
                .addText('\n');

            // Footer
            printer
                .addText('Thank you for your business!', { align: 'center', bold: true })
                .addText('\n')
                .addText('fgstore01@gmail.com', { align: 'center' })
                .addText('\n')
                .addText('Tax ID: 123456', { align: 'center' })
                .addText('\n')
                .addText('\n')
                .addText('\n'); // Feed

            // Print
            await printer.print();
            alert('Test print sent! (Check console for emit)');

        } catch (error: any) {
            console.error('Phygrid print error:', error);
            alert(`Print failed: ${error.message}`);
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
                {loading ? 'Printing...' : 'Test Phygrid (Exact Match)'}
            </button>
        </div>
    );
};

export default PhygridTestButton;
