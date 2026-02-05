import { useState } from 'react';
import AXIOS from '../api/network/Axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '@/api/api';

const EscPosTestButton = ({ className = "" }: { className?: string }) => {
    const [loading, setLoading] = useState(false);

    const handlePrint = async () => {
        setLoading(true);
        try {
            // We assume the server is listening at /api/escpos/test
            // The AXIOS base URL typically points to /api or root.
            // Based on Axios.ts: baseURL is BASE_URL. 
            // If BASE_URL is 'http://localhost:3000/api', then we need '/escpos/test'.
            // If BASE_URL is 'http://localhost:3000', then we need '/api/escpos/test'.
            // Usually in this project it seems like '/api' is part of the request path if using 'requestHandler' but checks `app.use('/api'...)`. 
            // The routes are mounted at `/api/escpos`.
            const response: any = await AXIOS.post(`${BASE_URL}/escpos/test`, { printerType: 'usb' });

            if (response && (response.success || response.message)) {
                toast.success(response.message || "Print sent!");
            }
        } catch (error: any) {
            console.error("EscPos print error:", error);
            // Error handling is partly done by Axios interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePrint}
            disabled={loading}
            className={`py-1.5 px-3 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${className}`}
        >
            {loading ? 'Server Print...' : 'EscPos Test'}
        </button>
    );
};

export default EscPosTestButton;
