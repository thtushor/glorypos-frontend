import { useCallback, useEffect, useState } from "react";

// Add typescript definition for ReactNativeWebView
declare global {
    interface Window {
        ReactNativeWebView?: {
            postMessage: (message: string) => void;
        };
    }
}

type PrintType = "KOT" | "INVOICE" | "BARCODE" | "BARCODE_LABEL" | "DOWNLOAD_IMAGE";

export const useWebViewPrint = () => {
    const [isWebView, setIsWebView] = useState(false);

    useEffect(() => {
        // Check if running in a WebView with React Native bridge
        setIsWebView(!!window.ReactNativeWebView);
    }, []);

    const sendPrintSignal = useCallback(
        (type: PrintType, data: any) => {
            if (window.ReactNativeWebView) {
                const message = JSON.stringify({
                    type: `PRINT_${type}`,
                    payload: data,
                });
                window.ReactNativeWebView.postMessage(message);
                return true;
            }
            return false;
        },
        []
    );

    const sendDownloadSignal = useCallback(
        (fileName: string, base64Data: string) => {
            if (window.ReactNativeWebView) {
                // Ensure base64 data is clean (remove data:image/png;base64, prefix if present, 
                // though handling it on native side is also fine. Let's send raw base64 or full string.
                // Standardizing on sending the full data URL for now, native side can parse if needed, 
                // or better yet, send just the base64 part if we want to be specific.
                // Let's send the full dataURL and let native handle it.
                const message = JSON.stringify({
                    type: 'DOWNLOAD_IMAGE',
                    payload: { fileName, base64: base64Data },
                });
                window.ReactNativeWebView.postMessage(message);
                return true;
            }
            return false;
        },
        []
    );

    return { isWebView, sendPrintSignal, sendDownloadSignal };
};
