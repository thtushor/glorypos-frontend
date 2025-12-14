import CartProductSection from "@/components/shared/CartProductSection";
import ShoppingCart, {
  CartAdjustments,
} from "@/components/shared/ShoppingCart";

import { CartItem } from "@/types/cartItemType";

import { useCallback, useState } from "react";
import { toast } from "react-toastify";

function DashBoardProduct({
  initialBarcodeOpen = false,
}: {
  initialBarcodeOpen?: boolean;
}) {
  const [sku, setSku] = useState("");

  const [adjustments, setAdjustments] = useState<CartAdjustments>({
    tax: { type: "percentage", value: 0 },
    discount: { type: "percentage", value: 0 },
    priceAdjustments: {},
    salesPriceAdjustments: {},
    discountAdjustments: {},
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  // 🔥 NEW — tab navigation state
  const [activeTab, setActiveTab] = useState<"products" | "cart">(
    initialBarcodeOpen ? "cart" : "products"
  );

  const [initialBarcodeOpenState, setInitialBarcodeOpenState] =
    useState(initialBarcodeOpen);

  const handleBarcodeScan = useCallback((barcode: string) => {
    if (barcode && barcode.trim()) {
      setSku(barcode.trim());
      setActiveTab("products"); // switch to products tab on scan
      setInitialBarcodeOpenState(false);
      toast.success(`Searching for: ${barcode.trim()}`);
    }
  }, []);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);


  return (
    <div className="">
      {/* 🔥 Top Navigation Tabs */}
      <div className="flex gap-6 mb-4 border-b pb-2">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "products"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>

        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "cart"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("cart")}
        >
          Cart ({cartItemsCount})
        </button>
      </div>

      {/* 🔥 Tab Content Display */}
      {activeTab === "products" && (
        <CartProductSection
          setCart={setCart}
          cart={cart}
          sku={sku}
          setSku={setSku}
          setAdjustments={setAdjustments}
          adjustments={adjustments}
        />
      )}

      {activeTab === "cart" && (
        <ShoppingCart
          cart={cart}
          setCart={setCart}
          adjustments={adjustments}
          setAdjustments={setAdjustments}
          handleBarcodeScan={handleBarcodeScan}
          showMobileCart={true}
          initialBarcodeOpen={initialBarcodeOpenState}
          onCloseBarcodeScanner={() => setInitialBarcodeOpenState(false)}
          // variant="desktop"
          onClose={() => setActiveTab("products")} // switch back to product tab
        />
      )}

    

      {/* Mobile Floating Cart Button */}
      <button
        onClick={() => setActiveTab("cart")}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg md:hidden"
      >
        Cart ({cartItemsCount})
      </button>
    </div>
  );
}

export default DashBoardProduct;
