import Modal from "@/components/Modal";
import CartProductSection from "@/components/shared/CartProductSection";
import ShoppingCart, {
  CartAdjustments,
} from "@/components/shared/ShoppingCart";
import { VariantSelectionModal } from "@/components/shared/VariantSelectionModal";
import { CartItem } from "@/types/cartItemType";
import { Product, ProductVariant } from "@/types/ProductType";
import { formatCurrency, successToast } from "@/utils/utils";
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

  const [showMobileCart, setShowMobileCart] = useState(false);

  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

  const handleBarcodeScan = useCallback((barcode: string) => {
    if (barcode && barcode.trim()) {
      // setSearchKey(barcode.trim());
      setSku(barcode.trim());

      // Optionally close scanner after scan
      toast.success(`Searching for: ${barcode.trim()}`);
    }
  }, []);

  // Cart operations
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

      // Initialize discount adjustment if product has discount
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

      // Initialize sales price adjustment if product has salesPrice
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

  // Cart items count
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add variant selection handler
  const handleVariantSelect = (variant: ProductVariant) => {
    if (!variantProduct) return;

    addToCart({
      ...variantProduct,
      unit: variantProduct.Unit,
      selectedVariant: variant as any,
      cartItemId: `${variantProduct.id}-${variant.id}`,
      imageUrl: variant.imageUrl,
      quantity: 1,
      sku: variant.sku, // Added missing 'sku' property
    });
    setVariantProduct(null);
  };

  return (
    <div>
      {/* Product selections sections */}
      <CartProductSection
        setCart={setCart}
        showMobileCart={showMobileCart}
        cart={cart}
        sku={sku}
        setSku={setSku}
        setAdjustments={setAdjustments}
        adjustments={adjustments}
      />
      {/* Cart Section - Desktop */}

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
    </div>
  );
}

export default DashBoardProduct;
