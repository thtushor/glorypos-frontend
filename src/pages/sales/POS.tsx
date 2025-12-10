import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaTrash,
  FaUser,
  FaCreditCard,
  FaMoneyBill,
  FaQrcode,
  FaTimes,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaWallet,
  FaCheckCircle,
  FaExclamationCircle,
  FaUtensils,
} from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import {
  CATEGORY_URL,
  BRANDS_URL,
  UNITS_URL,
  ORDERS_URL,
  SUB_SHOPS_URL,
  CHILD_USERS_URL,
  fetchProducts,
} from "@/api/api";
import Spinner from "@/components/Spinner";
import Invoice from "@/components/Invoice";
import {
  formatCurrency,
  parseCurrencyInput,
  successToast,
} from "@/utils/utils";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import BarcodeScanner from "@/components/BarcodeScanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  ProductVariant,
  ProductQueryParams,
  Product,
} from "@/types/ProductType";
import { toast } from "react-toastify";
import { Unit, Brand } from "@/types/categoryType";
import { Color, Category } from "@/types/categoryType";
import { useAuth } from "@/context/AuthContext";
import { FaUserGear } from "react-icons/fa6";
import money from "@/utils/money";
import ProductImageSlider from "@/components/shared/ProductImageSlider";
import { Size } from "recharts/types/util/types";
import MobileCartToggleButton from "@/components/shared/MobileCartToggleButton";
import ShoppingCart from "@/components/shared/ShoppingCart";
// import UserIcon from "@/components/icons/UserIcon";

// Product interface is now imported from types

export interface CartItem extends Product {
  quantity: number;
  unit: Unit;
  selectedVariant?: {
    Category: Category;
    Color: Color;
    Size: Size;
    id: number;
    sku: string;
    quantity: number;
    alertQuantity: number;
    imageUrl: string;
    status: string;
    ProductId: number;
    ColorId: number;
    SizeId: number;
  };
  cartItemId: string;
  imageUrl: string;
  sku: string;
}

interface OrderData {
  id: number;
  date: string;
  customer: {
    name: string;
    phone: string;
  };
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "mobile_banking" | "mixed";
  verificationCode: string;
  expiryDate: string;
}

interface PartialPayment {
  cashAmount: number;
  cardAmount: number;
  walletAmount: number;
}

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
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filter states for API
  const { user } = useAuth();
  const [searchKey, setSearchKey] = useState("");
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

  const queryClient = useQueryClient();

  // Build query parameters
  const queryParams: ProductQueryParams = useMemo(() => {
    const params: ProductQueryParams = {
      page,
      pageSize,
      status: "active",
    };

    if (searchKey) params.searchKey = searchKey;
    if (shopId) params.shopId = shopId;
    if (selectedCategory !== "all") params.categoryId = selectedCategory;
    if (selectedBrand !== "all") params.brandId = selectedBrand;
    if (selectedUnit !== "all") params.unitId = selectedUnit;
    if (selectedGender !== "all") params.gender = selectedGender;
    if (modelNo) params.modelNo = modelNo;

    // Add price range filters
    if (
      priceRange?.min &&
      priceRange?.min !== undefined &&
      priceRange?.min !== null &&
      priceRange?.min > 0
    ) {
      params.minPrice = priceRange?.min;
    }
    if (
      priceRange?.max &&
      priceRange?.max !== undefined &&
      priceRange?.max !== null &&
      priceRange?.max > 0
    ) {
      params.maxPrice = priceRange.max;
    }

    if (sku) {
      params.sku = sku;
    }

    return params;
  }, [
    page,
    pageSize,
    searchKey,
    sku,
    shopId,
    selectedCategory,
    selectedBrand,
    selectedUnit,
    selectedGender,
    modelNo,
    priceRange,
  ]);

  // Products query with pagination
  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", "pos", queryParams],
    queryFn: () => fetchProducts(queryParams),
  });

  const products = productsResponse?.products || [];
  const pagination = productsResponse?.pagination || {
    page: 1,
    pageSize: 20,
    totalPages: 0,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Fetch Categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<
    Category[]
  >({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await AXIOS.get(CATEGORY_URL);
      return response.data;
    },
  });

  // Fetch Brands
  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await AXIOS.get(BRANDS_URL);
      return response.data;
    },
  });

  // Fetch Units
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await AXIOS.get(UNITS_URL);
      return response.data;
    },
  });

  // Fetch Shops
  const { data: shopData, isLoading: isLoadingShops } = useQuery({
    queryKey: ["sub-shops-for-filter"],
    queryFn: async () => {
      const response = await AXIOS.get(SUB_SHOPS_URL, {
        params: {
          page: 1,
          pageSize: 10000,
        },
      });
      return response.data;
    },
  });

  const shops = shopData?.users || [];

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setPage(1);
  };

  // Handle barcode scan
  const handleBarcodeScan = useCallback((barcode: string) => {
    if (barcode && barcode.trim()) {
      // setSearchKey(barcode.trim());
      setSku(barcode.trim());
      setPage(1); // Reset to page 1
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
      <div
        className={`flex-1 flex flex-col  bg-white rounded-lg shadow overflow-hidden ${
          showMobileCart ? "hidden xl:flex" : "flex"
        }`}
      >
        {/* Search and Filters */}
        <div className="border-b bg-white">
          {/* Search Bar - Always Visible */}
          <div>
            <div className="p-3 md:p-4 border-b bg-gray-50">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchKey}
                  onChange={(e) => {
                    setSearchKey(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white"
                />
              </div>

              {sku && (
                <div className="inline-flex mt-4 items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full border border-gray-300">
                  <span>
                    <strong>Scanned:</strong> {sku}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSku("");
                    }}
                    className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Filters Section */}
          <div className="bg-white">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b"
            >
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-600" />
                <span className="font-medium text-gray-700">Filters</span>
                {(selectedCategory !== "all" ||
                  selectedBrand !== "all" ||
                  selectedUnit !== "all" ||
                  selectedGender !== "all" ||
                  modelNo !== "" ||
                  shopId !== "" ||
                  (priceRange?.min && priceRange?.min > 0) ||
                  (priceRange?.max && priceRange?.max > 0)) && (
                  <span className="px-2 py-0.5 bg-brand-primary text-white text-xs rounded-full">
                    Active
                  </span>
                )}
              </div>
              {isFiltersExpanded ? (
                <FaChevronUp className="text-gray-500" />
              ) : (
                <FaChevronDown className="text-gray-500" />
              )}
            </button>

            {/* Expandable Filter Content */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isFiltersExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-4 space-y-4 bg-gray-50">
                {/* Filters Grid - 2 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedCategory(
                          value === "all" ? "all" : Number(value)
                        );
                        handleFilterChange();
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white hover:border-gray-400 transition-colors"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Brand
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedBrand(
                          value === "all" ? "all" : Number(value)
                        );
                        handleFilterChange();
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white hover:border-gray-400 transition-colors"
                    >
                      <option value="all">All Brands</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit Filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Unit
                    </label>
                    <select
                      value={selectedUnit}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedUnit(
                          value === "all" ? "all" : Number(value)
                        );
                        handleFilterChange();
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white hover:border-gray-400 transition-colors"
                    >
                      <option value="all">All Units</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Shop Filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Shop
                    </label>
                    <select
                      value={shopId}
                      onChange={(e) => {
                        setShopId(e.target.value);
                        handleFilterChange();
                      }}
                      disabled={isLoadingShops}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white hover:border-gray-400 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">All Shops</option>
                      {isLoadingShops ? (
                        <option value="" disabled>
                          Loading shops...
                        </option>
                      ) : (
                        [
                          ...(user?.id ? [{ id: user.id, ...user }] : []),
                          ...shops,
                        ]
                          .filter((shop: any) => shop?.id != null)
                          .map((shop: any) => (
                            <option key={shop.id} value={shop.id}>
                              {shop.businessName || shop.fullName}
                            </option>
                          ))
                      )}
                    </select>
                  </div>

                  {/* Gender Filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Gender
                    </label>
                    <select
                      value={selectedGender}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedGender(
                          value === "all"
                            ? "all"
                            : (value as "men" | "women" | "others")
                        );
                        handleFilterChange();
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white hover:border-gray-400 transition-colors"
                    >
                      <option value="all">All Genders</option>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="others">Others</option>
                    </select>
                  </div>

                  {/* Model Number Filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Model Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter model number"
                      value={modelNo}
                      onChange={(e) => {
                        setModelNo(e.target.value);
                        handleFilterChange();
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white hover:border-gray-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Price Range Filter - Separate Row */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Price Range
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min Price"
                      value={priceRange?.min || ""}
                      onChange={(e) => {
                        setPriceRange({
                          ...priceRange,
                          min: Number(e.target.value) || undefined,
                        });
                        handleFilterChange();
                      }}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white hover:border-gray-400 transition-colors"
                    />
                    <span className="text-gray-400 text-sm flex-shrink-0">
                      -
                    </span>
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={priceRange.max || ""}
                      onChange={(e) => {
                        setPriceRange({
                          ...priceRange,
                          max: Number(e.target.value) || undefined,
                        });
                        handleFilterChange();
                      }}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white hover:border-gray-400 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div
          className={`flex-1 p-4 overflow-y-auto ${
            isLoadingProducts || isLoadingCategories || isLoadingShops
              ? "flex items-center justify-center"
              : ""
          }`}
        >
          {isLoadingProducts || isLoadingCategories || isLoadingShops ? (
            <div className="flex justify-center items-center">
              <Spinner color="#32cd32" size="40px" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-all"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square">
                      <img
                        src={
                          selectedVariants[product.id]
                            ? product.ProductVariants.find(
                                (v) => v.id === selectedVariants[product.id]
                              )?.imageUrl
                            : product.ProductVariants?.length > 0
                            ? product.ProductVariants[0]?.imageUrl
                            : product.productImage
                        }
                        alt={product.name}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    </div>

                    {/* Product Card Content */}
                    <div className="p-4">
                      <h3
                        className="font-medium text-gray-900 line-clamp-1 text-ellipsis cursor-pointer"
                        title={product.name}
                      >
                        {product.name}
                      </h3>

                      {/* Price Section with Discount Info */}
                      <div className="mt-2 space-y-1">
                        {product.discountType &&
                        Number(product.discountAmount || 0) > 0 &&
                        Number(product.salesPrice || 0) >
                          Number(product.price || 0) ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Sales Price with Strikethrough */}
                            <span className="text-xs text-gray-400 line-through">
                              {money.format(Number(product.salesPrice || 0))}
                            </span>
                            {/* Discount Badge */}
                            <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded">
                              {product.discountType === "percentage"
                                ? `-${product.discountAmount}%`
                                : `-${money.format(
                                    Number(product.discountAmount || 0)
                                  )}`}
                            </span>
                          </div>
                        ) : null}
                        {/* Final Price - Prominently Displayed */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-brand-primary">
                            {money.format(Number(product.price || 0))}
                          </span>
                        </div>
                      </div>

                      {/* Improved Variant Preview */}
                      {product.ProductVariants?.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-col items-start gap-1.5">
                            <span className="text-xs text-gray-500">
                              Available variants:
                            </span>
                            <div className="flex items-center">
                              {product.ProductVariants.slice(0, 4).map(
                                (variant, index) => (
                                  <div
                                    key={index}
                                    className={`relative -ml-1 first:ml-0 group cursor-pointer transition-transform hover:scale-110 hover:z-10 ${
                                      selectedVariants[product.id] ===
                                      variant.id
                                        ? "z-10 ring-2 rounded-full ring-brand-primary"
                                        : ""
                                    }`}
                                  >
                                    <img
                                      src={variant.imageUrl}
                                      alt={`${variant.Color?.name} ${variant.Size?.name}`}
                                      onClick={() =>
                                        setSelectedVariants({
                                          [product.id]: variant.id,
                                        })
                                      }
                                      className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
                                      {variant.Color?.name} -{" "}
                                      {variant.Size?.name}
                                    </div>
                                    {/* Stock Badge */}
                                    {variant.quantity < 5 && (
                                      <span
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border border-white rounded-full"
                                        title={`Only ${variant.quantity} left`}
                                      />
                                    )}
                                  </div>
                                )
                              )}
                              {product.ProductVariants.length > 4 && (
                                <div className="relative -ml-1 group cursor-pointer">
                                  <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-100">
                                    +{product.ProductVariants.length - 4}
                                  </div>
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                    {product.ProductVariants.length - 4} more
                                    variants
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            getTotalStock(product) > 10
                              ? "bg-green-500"
                              : getTotalStock(product) > 5
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="text-xs text-gray-500">
                          {getTotalStock(product)} in stock
                        </span>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="mt-4 w-full md:font-medium text-[14px] px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    pageSize={pagination.pageSize}
                    hasNextPage={pagination.hasNextPage}
                    hasPreviousPage={pagination.hasPreviousPage}
                    onPageChange={(page) => setPage(page)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
