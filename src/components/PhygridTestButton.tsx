import { useState } from 'react';
import { ThermalPrinter } from '@phygrid/thermal-printer';
// import { PeripheralInstance } from '@phygrid/hub-client';

const PhygridTestButton = () => {
    const [loading, setLoading] = useState(false);

    const handlePrint = async () => {
        setLoading(true);
        try {
            // NOTE: For actual printing, you need to connect to the Phygrid Hub and get a real PeripheralInstance.
            // This mock allows the code to run and generate the commands for testing purposes.
            const peripheralInstance = {
                emit: async (event: string, data: any) => {
                    console.log('🖨️ Mock Printer Emit:', event, data);
                    return Promise.resolve();
                },
                on: (event: string, cb: Function) => { },
                off: (event: string, cb: Function) => { },
            } as any;

            const printer = new ThermalPrinter(peripheralInstance);

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
                .addText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { align: 'center', bold: true }) // Separator
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
                .addText('Guests: 1', { align: 'left' })
                .addText('\n')
                .addText('Customer: Walk-in Customer', { align: 'left' })
                .addText('\n')
                .addText('Phone: N/A', { align: 'left' })
                .addText('\n')
                .addText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { align: 'center', bold: true })
                .addText('\n');

            // Items Header
            printer
                .addText('QTY   ITEM                  TOTAL', { bold: true })
                .addText('\n')
                .addText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { align: 'center' })
                .addText('\n');

            // Item 1
            printer
                .addText('1     AUDEMARS PIGUET (AP)  ฿3,000.00', { align: 'left' })
                .addText('\n')
                .addText('      ROYAL OAK, CHRONOGRAPH', { align: 'left' })
                .addText('\n')
                .addText('      FULL YELLOW GOLD, BLUE', { align: 'left' })
                .addText('\n')
                .addText('      FACE GOLD - NORMAL', { align: 'left' })
                .addText('\n')
                .addText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { align: 'center' })
                .addText('\n');

            // Totals
            printer
                .addText('Subtotal:                 ฿3,000.00', { align: 'left' })
                .addText('\n')
                .addText('Tax (0.00%):                  ฿0.00', { align: 'left' })
                .addText('\n')
                .addText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { align: 'center' })
                .addText('\n');

            // Grand Total
            printer
                .addText('GRAND TOTAL:          ฿3,000.00', {
                    align: 'left',
                    size: { width: 1, height: 2 }, // Slightly larger
                    bold: true
                })
                .addText('\n')
                .addText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', { align: 'center' })
                .addText('\n');

            // Payment Info
            printer
                .addText('Payment Method:                CASH', { align: 'left' })
                .addText('\n')
                .addText('Payment Status:           completed', { align: 'left' })
                .addText('\n')
                .addText('Paid Amount:              ฿3,000.00', { align: 'left', bold: true })
                .addText('\n')
                .addText('--------------------------------', { align: 'center' }) // Dashed
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
            alert('Test print sent!');

        } catch (error: any) {
            console.error('Phygrid print error:', error);
            alert(`Print failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 w-full">
            <button
                onClick={handlePrint}
                disabled={loading}
                className="w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
                {loading ? 'Printing...' : 'Test Phygrid Invoice'}
            </button>
        </div>
    );
};

export default PhygridTestButton;
