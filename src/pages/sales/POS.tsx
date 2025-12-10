import { useState, useMemo, useEffect, useCallback } from "react";

import { formatCurrency, successToast } from "@/utils/utils";
import Modal from "@/components/Modal";

import { ProductVariant, Product } from "@/types/ProductType";
import { toast } from "react-toastify";

import { Color } from "@/types/categoryType";

import ProductImageSlider from "@/components/shared/ProductImageSlider";
import MobileCartToggleButton from "@/components/shared/MobileCartToggleButton";
import ShoppingCart from "@/components/shared/ShoppingCart";
import CartProductSection from "@/components/shared/CartProductSection";
import { CartItem } from "@/types/CartItemType";
// import UserIcon from "@/components/icons/UserIcon";

// Product interface is now imported from types

interface CartAdjustments {
  tax: {
    type: "fixed" | "percentage";
    value?: number;
  };
  discount: {
    type: "fixed" | "percentage";
    value?: number;
  };
  priceAdjustments: { [key: string]: number };
  salesPriceAdjustments: { [key: string]: number }; // Per-item sales price adjustments
  discountAdjustments: {
    [key: string]: { type: "percentage" | "amount"; value: number };
  }; // Per-item discount adjustments
}

// Add this component for variant selection modal
interface VariantSelectionModalProps {
  product: Product;
  onSelect: (variant: ProductVariant) => void;
  onClose: () => void;
}

const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  product,
  onSelect,
  onClose,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  // Group variants by color for better organization
  const variantGroups = useMemo(() => {
    const groups: Record<
      number,
      {
        color: Color;
        variants: ProductVariant[];
      }
    > = {};

    product.ProductVariants?.forEach((variant) => {
      if (!groups[variant.ColorId]) {
        groups[variant.ColorId] = {
          color: variant.Color,
          variants: [],
        };
      }
      groups[variant.ColorId].variants.push({
        ...variant,
        status: variant.status as "active" | "inactive",
      });
    });
    return groups;
  }, [product.ProductVariants]);

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="flex gap-6">
        <div className="w-1/3">
          <ProductImageSlider
            images={
              selectedVariant?.images && selectedVariant.images.length > 0
                ? selectedVariant.images
                : selectedVariant?.imageUrl
                ? [selectedVariant.imageUrl]
                : product?.images && product.images.length > 0
                ? product.images
                : product.productImage
                ? [product.productImage]
                : []
            }
            variant="with-thumbnails"
            showDots={true}
            autoplay={true}
            autoplaySpeed={4000}
            pauseOnHover={true}
            pauseOnFocus={true}
            draggable={true}
            fade={true}
            className="rounded-lg shadow-md"
            aspectRatio="aspect-square"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-800">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Choose your variant</p>
          {selectedVariant && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Selected:</span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: selectedVariant.Color?.code }}
                  />
                  <span className="font-medium">
                    {selectedVariant.Color?.name} / {selectedVariant.Size?.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">SKU:</span>
                  <span className="font-medium">{selectedVariant.sku}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Stock:</span>
                  <span className="font-medium">
                    {selectedVariant.quantity}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Variants Grid */}
      <div className="space-y-6">
        {Object.entries(variantGroups).map(([colorId, group]) => (
          <div key={colorId} className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full border"
                style={{ backgroundColor: group.color.code }}
              />
              <h4 className="font-medium text-gray-700">{group.color.name}</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {group.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedVariant(variant);
                    // window.open(variant.imageUrl, "_blank", "noopener,noreferrer");
                  }}
                  disabled={variant.quantity === 0}
                  className={`relative group rounded-lg overflow-hidden transition-all ${
                    variant.quantity === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="aspect-square relative">
                    <ProductImageSlider
                      images={
                        variant?.images && variant.images.length > 0
                          ? variant.images
                          : variant?.imageUrl
                          ? [variant.imageUrl]
                          : []
                      }
                      // variant="with-thumbnails"
                      showDots={true}
                      autoplay={true}
                      autoplaySpeed={4000}
                      disaleOnClick
                      pauseOnHover={true}
                      pauseOnFocus={true}
                      draggable={true}
                      fade={true}
                      className="rounded-lg shadow-md"
                      aspectRatio="aspect-square"
                      imageClassName={`transition-transform duration-300 ${
                        selectedVariant?.id === variant.id
                          ? "scale-110"
                          : "group-hover:scale-105"
                      }`}
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${
                        selectedVariant?.id === variant.id
                          ? "bg-black/40"
                          : "bg-black/0 group-hover:bg-black/20"
                      }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg transform transition-all duration-300 ${
                          selectedVariant?.id === variant.id
                            ? "scale-100 opacity-100"
                            : "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {variant.Size?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <span className="px-2 py-1 text-xs font-medium bg-white/90 rounded-full shadow">
                      Stock: {variant.quantity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          disabled={!selectedVariant}
          onClick={() => selectedVariant && onSelect(selectedVariant)}
          className="px-6 py-2 text-white bg-brand-primary rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {selectedVariant ? "Add to Cart" : "Select a Variant"}
        </button>
      </div>
    </div>
  );
};

// Currency formatting helpers

const POS: React.FC = () => {
  // Pagination state

  // Filter states for API

  const [sku, setSku] = useState("");
  const [shopId, setShopId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all"
  );
  const [selectedBrand, setSelectedBrand] = useState<number | "all">("all");
  const [selectedUnit, setSelectedUnit] = useState<number | "all">("all");
  const [selectedGender, setSelectedGender] = useState<
    "men" | "women" | "others" | "all"
  >("all");
  const [modelNo, setModelNo] = useState("");
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({
    min: undefined,
    max: undefined,
  });

  const [adjustments, setAdjustments] = useState<CartAdjustments>({
    tax: { type: "percentage", value: 0 },
    discount: { type: "percentage", value: 0 },
    priceAdjustments: {},
    salesPriceAdjustments: {},
    discountAdjustments: {},
  });

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [showMobileCart, setShowMobileCart] = useState(false);

  const [selectedVariants, setSelectedVariants] = useState<
    Record<number, number>
  >({});
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

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

  const handleAddToCart = (product: Product) => {
    if (product.ProductVariants?.length > 0) {
      setVariantProduct(product);
    } else {
      addToCart({
        ...product,
        cartItemId: `${product.id}-default`,
        imageUrl: product.productImage,
        quantity: 1,
        sku: "", // Added missing 'sku' property
        unit: product,
      });
    }
  };

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

  // Add this helper function
  const getTotalStock = (product: Product) => {
    if (product.ProductVariants?.length > 0) {
      return product.ProductVariants.reduce(
        (total, variant) => total + variant.quantity,
        0
      );
    }
    return product.stock;
  };

  return (
    <div className=" flex flex-col lg:flex-row gap-6 relative">
      {/* Products Section */}

      <CartProductSection
        setCart={setCart}
        showMobileCart={showMobileCart}
        cart={cart}
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

      <MobileCartToggleButton
        onClick={() => setShowMobileCart(true)}
        open={showMobileCart}
        cartItemsCount={cartItemsCount}
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
};

export default POS;
