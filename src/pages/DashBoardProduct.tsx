import Modal from "@/components/Modal";
import CartProductSection from "@/components/shared/CartProductSection";
import ShoppingCart, {
  CartAdjustments,
} from "@/components/shared/ShoppingCart";
import { VariantSelectionModal } from "@/components/shared/VariantSelectionModal";
import { CartItem } from "@/types/cartItemType";
import { Product, ProductVariant } from "@/types/ProductType";
import { formatCurrency, successToast } from "@/utils/utils";
import { set } from "lodash";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

function DashBoardProduct() {
  const [sku, setSku] = useState("");

  const [adjustments, setAdjustments] = useState<CartAdjustments>({
    tax: { type: "percentage", value: 0 },
    discount: { type: "percentage", value: 0 },
    priceAdjustments: {},
    salesPriceAdjustments: {},
    discountAdjustments: {},
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

  // 🔥 NEW — tab navigation state
  const [activeTab, setActiveTab] = useState<"products" | "cart">("products");

  const handleBarcodeScan = useCallback((barcode: string) => {
    if (barcode && barcode.trim()) {
      setSku(barcode.trim());
      setActiveTab("products"); // switch to products tab on scan
      toast.success(`Searching for: ${barcode.trim()}`);
    }
  }, []);

  // Add to cart logic
  const addToCart = (product: CartItem) => {
    const existingItem = cart.find(
      (item) => item.cartItemId === product.cartItemId
    );

    if (existingItem) {
      if (
        existingItem.quantity >=
        (product.selectedVariant?.quantity || product.stock)
      ) {
        successToast("Stock limit reached", "warn");
        return;
      }

      setCart(
        cart.map((item) =>
          item.cartItemId === product.cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);

      // Add discount adjustments
      if (product.discountType && Number(product.discountAmount || 0) > 0) {
        setAdjustments((prev) => ({
          ...prev,
          discountAdjustments: {
            ...prev.discountAdjustments,
            [product.id]: {
              type:
                (product.discountType as "percentage" | "amount") ||
                "percentage",
              value: formatCurrency(Number(product.discountAmount || 0)),
            },
          },
        }));
      }

      // Add sales price adjustment
      if (product.salesPrice && Number(product.salesPrice) > 0) {
        setAdjustments((prev) => ({
          ...prev,
          salesPriceAdjustments: {
            ...prev.salesPriceAdjustments,
            [product.id]: formatCurrency(Number(product.salesPrice)),
          },
        }));
      }
    }
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Variant selection handler
  const handleVariantSelect = (variant: ProductVariant) => {
    if (!variantProduct) return;

    addToCart({
      ...variantProduct,
      unit: variantProduct.Unit,
      selectedVariant: variant as any,
      cartItemId: `${variantProduct.id}-${variant.id}`,
      imageUrl: variant.imageUrl,
      quantity: 1,
      sku: variant.sku,
    });

    setVariantProduct(null);
    setActiveTab("cart"); // auto-open cart after selecting variant
  };

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
          onClose={() => setActiveTab("products")} // switch back to product tab
        />
      )}

      {/* Variant Selection Modal */}
      <Modal
        isOpen={!!variantProduct}
        onClose={() => setVariantProduct(null)}
        title="Select Variant"
        className="max-w-lg"
      >
        {variantProduct && (
          <VariantSelectionModal
            product={variantProduct}
            onSelect={handleVariantSelect}
            onClose={() => setVariantProduct(null)}
          />
        )}
      </Modal>

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
