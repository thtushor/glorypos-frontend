import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const BrowserPrintButton = () => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: 'Exact_Invoice_Match',
    });

    return (
        <div className="w-full flex flex-col items-center">
            {/* Hidden printable content */}
            <div style={{ display: 'none' }}>
                <div ref={componentRef} style={{
                    width: '80mm',
                    padding: '20px 10px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: '#000',
                    lineHeight: '1.4'
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0' }}>FG STORE 01</h1>
                        <div style={{ fontSize: '12px' }}>Patong</div>
                        <div style={{ fontSize: '12px' }}>Tel: +66637475569</div>
                    </div>

                    <div style={{ borderBottom: '2px solid black', margin: '10px 0' }}></div>

                    {/* Title */}
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' }}>INVOICE</h2>
                        <div style={{ marginBottom: '2px' }}>Invoice #: INV-00000005</div>
                        <div>Date: 2/5/2026, 11:27:12 PM</div>
                    </div>

                    {/* Customer Info */}
                    <div style={{ marginBottom: '10px' }}>
                        <div><strong>Guests:</strong> 1</div>
                        <div><strong>Customer:</strong> Walk-in Customer</div>
                        <div><strong>Phone:</strong> N/A</div>
                    </div>

                    <div style={{ borderBottom: '2px solid black', margin: '10px 0' }}></div>

                    {/* Table Header */}
                    <div style={{ display: 'flex', fontWeight: 'bold', marginBottom: '5px', borderBottom: '1px solid black', paddingBottom: '5px' }}>
                        <div style={{ width: '15%', textAlign: 'left' }}>QTY</div>
                        <div style={{ width: '55%', textAlign: 'left' }}>ITEM</div>
                        <div style={{ width: '30%', textAlign: 'right' }}>TOTAL</div>
                    </div>

                    {/* Items */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ width: '15%', textAlign: 'left' }}>1</div>
                            <div style={{ width: '55%', textAlign: 'left' }}>
                                <div>AUDEMARS PIGUET (AP)</div>
                                <div>ROYAL OAK,</div>
                                <div>CHRONOGRAPH, FULL</div>
                                <div>YELLOW GOLD, BLUE FACE</div>
                                <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>GOLD - NORMAL</div>
                            </div>
                            <div style={{ width: '30%', textAlign: 'right' }}>฿3,000.00</div>
                        </div>
                    </div>

                    <div style={{ borderBottom: '2px solid black', margin: '10px 0' }}></div>

                    {/* Totals */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Subtotal:</span>
                        <span>฿3,000.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span>Tax (0.00%):</span>
                        <span>฿0.00</span>
                    </div>

                    <div style={{ borderBottom: '2px solid black', margin: '10px 0' }}></div>

                    {/* Grand Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>GRAND TOTAL:</span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>฿3,000.00</span>
                    </div>

                    <div style={{ borderBottom: '2px solid black', margin: '10px 0' }}></div>

                    {/* Payment Info */}
                    <div style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Payment Method:</span>
                        <span>CASH</span>
                    </div>
                    <div style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Payment Status:</span>
                        <span>completed</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Paid Amount:</span>
                        <span style={{ color: '#00A859' }}>฿3,000.00</span>
                    </div>

                    {/* Footer Dashed Line */}
                    <div style={{ borderBottom: '1px dashed black', margin: '15px 0' }}></div>

                    {/* Footer Text */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Thank you for your business!</div>
                        <div style={{ color: '#666', marginBottom: '5px' }}>fgstore01@gmail.com</div>
                        <div style={{ color: '#666' }}>Tax ID: 123456</div>
                    </div>
                </div>
            </div>

            <button
                onClick={() => handlePrint()}
                className="w-full h-full py-4 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
                Test Browser Print (HTML)
            </button>
        </div>
    );
};

export default BrowserPrintButton;
