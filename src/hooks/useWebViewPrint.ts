import { useCallback, useEffect, useState } from "react";

// Add typescript definition for ReactNativeWebView
declare global {
    interface Window {
        ReactNativeWebView?: {
            postMessage: (message: string) => void;
        };
    }
}

type PrintType = "KOT" | "INVOICE" | "BARCODE" | "BARCODE_LABEL";

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

    return { isWebView, sendPrintSignal };
};
