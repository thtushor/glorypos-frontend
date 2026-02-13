import { useState, useEffect, useCallback } from "react";

import { toast } from "react-toastify";
import MobileCartToggleButton from "@/components/shared/MobileCartToggleButton";
import ShoppingCart from "@/components/shared/ShoppingCart";
import CartProductSection from "@/components/shared/CartProductSection";
import { CartItem } from "@/types/cartItemType";
// import UserIcon from "@/components/icons/UserIcon";

// Product interface is now imported from types

interface CartAdjustments {
  tax: {
    type: "fixed" | "percentage";
    value?: number | string;
  };
  discount: {
    type: "fixed" | "percentage";
    value?: number | string;
  };
  priceAdjustments: { [key: string]: number };
  salesPriceAdjustments: { [key: string]: number }; // Per-item sales price adjustments
  discountAdjustments: {
    [key: string]: { type: "percentage" | "amount"; value: number };
  }; // Per-item discount adjustments
}

// Currency formatting helpers

const POS: React.FC = () => {
  // Pagination state

  // Filter states for API

  const [sku, setSku] = useState("");

  const [adjustments, setAdjustments] = useState<CartAdjustments>({
    tax: { type: "percentage", value: 0 },
    discount: { type: "percentage", value: 0 },
    priceAdjustments: {},
    salesPriceAdjustments: {},
    discountAdjustments: {},
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  const [showMobileCart, setShowMobileCart] = useState(false);

  // const queryClient = useQueryClient();

  // Handle barcode scan
  const handleBarcodeScan = useCallback((barcode: string) => {
    if (barcode && barcode.trim()) {
      // setSearchKey(barcode.trim());
      setSku(barcode.trim());

      // Optionally close scanner after scan
      toast.success(`Searching for: ${barcode.trim()}`);
    }
  }, []);

  // Global physical barcode scanner detection (works even when modal is closed)
  useEffect(() => {
    let barcodeBuffer = "";
    let barcodeTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastKeyTime = Date.now();

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        (target as HTMLElement).isContentEditable
      ) {
        // Check if Enter is pressed in input (could be scanner)
        if (e.key === "Enter" && target.tagName === "INPUT") {
          const input = target as HTMLInputElement;
          if (input.value.trim().length > 0) {
            // Might be a scanner, but let the input handle it normally
            return;
          }
        }
        return;
      }

      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTime;

      // Clear buffer if too much time passed (user typing, not scanner)
      if (timeSinceLastKey > 150) {
        barcodeBuffer = "";
      }

      lastKeyTime = currentTime;

      // Handle Enter key (physical scanners send Enter after barcode)
      if (e.key === "Enter") {
        if (barcodeBuffer.trim().length > 0) {
          e.preventDefault();
          e.stopPropagation();
          const scannedBarcode = barcodeBuffer.trim();
          barcodeBuffer = "";

          if (scannedBarcode.length >= 3) {
            // Valid barcode scanned
            handleBarcodeScan(scannedBarcode);
          }
        }
        if (barcodeTimeout) {
          clearTimeout(barcodeTimeout);
          barcodeTimeout = null;
        }
        return;
      }

      // Handle regular character input (not modifier keys)
      if (
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.shiftKey &&
        e.code !== "Space"
      ) {
        barcodeBuffer += e.key;

        // Clear timeout
        if (barcodeTimeout) {
          clearTimeout(barcodeTimeout);
        }

        // Set timeout to detect slow typing (not a scanner)
        barcodeTimeout = setTimeout(() => {
          barcodeBuffer = "";
        }, 200);
      }

      // Handle Escape to clear buffer
      if (e.key === "Escape") {
        barcodeBuffer = "";
        if (barcodeTimeout) {
          clearTimeout(barcodeTimeout);
          barcodeTimeout = null;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress, true);
    return () => {
      window.removeEventListener("keydown", handleKeyPress, true);
      if (barcodeTimeout) {
        clearTimeout(barcodeTimeout);
      }
    };
  }, [handleBarcodeScan]);

  // Cart items count
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className=" flex flex-col lg:flex-row gap-6 relative">
      {/* Products Section */}

      <CartProductSection
        setCart={setCart}
        showMobileCart={showMobileCart}
        cart={cart}
        sku={sku}
        setSku={setSku}
        setAdjustments={setAdjustments}
        adjustments={adjustments}
      />
      {/* Cart Section - Desktop - Sticky */}
      {/* <div className="lg:sticky lg:top-0 lg:h-[calc(100vh-6rem)] xl:max-w-[450px] overflow-y-auto"> */}
      <ShoppingCart
        showMobileCart={showMobileCart}
        cart={cart}
        setCart={setCart}
        adjustments={adjustments}
        setAdjustments={setAdjustments}
        onClose={() => {
          setShowMobileCart(false);
        }}
        handleBarcodeScan={handleBarcodeScan}
      />
      {/* </div> */}

      <MobileCartToggleButton
        onClick={() => setShowMobileCart(true)}
        open={showMobileCart}
        cartItemsCount={cartItemsCount}
      />
    </div>
  );
};

export default POS;
