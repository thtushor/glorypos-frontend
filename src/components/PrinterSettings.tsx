import React, { useState, useEffect } from 'react';

const PrinterSettings: React.FC = () => {
    const [printerInterface, setPrinterInterface] = useState('tcp://192.168.1.100');
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('printerInterface');
        if (saved) {
            setPrinterInterface(saved);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('printerInterface', printerInterface);
        alert('Printer settings saved!');
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setIsConnected(null);

        try {
            const response = await fetch('http://localhost:3000/api/thermal-print/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ printerInterface })
            });

            const result = await response.json();
            setIsConnected(result.connected);

            if (result.connected) {
                alert('Printer connected successfully!');
            } else {
                alert(`Connection failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setIsConnected(false);
            alert(`Connection test failed: ${error.message}`);
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Thermal Printer Settings</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Printer Interface
                    </label>
                    <input
                        type="text"
                        value={printerInterface}
                        onChange={(e) => setPrinterInterface(e.target.value)}
                        placeholder="tcp://192.168.1.100 or printer:/dev/usb/lp0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                        Examples: <br />
                        • Network: <code className="bg-gray-100 px-2 py-1 rounded">tcp://192.168.1.100</code><br />
                        • USB (Windows): <code className="bg-gray-100 px-2 py-1 rounded">printer:auto</code><br />
                        • USB (Linux): <code className="bg-gray-100 px-2 py-1 rounded">printer:/dev/usb/lp0</code>
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleTestConnection}
                        disabled={testing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                        {testing ? 'Testing...' : 'Test Connection'}
                    </button>

                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        Save Settings
                    </button>
                </div>

                {isConnected !== null && (
                    <div className={`p-4 rounded-lg ${isConnected ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {isConnected ? '✓ Printer is connected' : '✗ Printer is not connected'}
                    </div>
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Connect your thermal printer to the network or USB</li>
                    <li>Find the printer's IP address (for network printers)</li>
                    <li>Enter the printer interface above</li>
                    <li>Test the connection to verify</li>
                    <li>Save the settings</li>
                </ol>
            </div>
        </div>
    );
};

export default PrinterSettings;
