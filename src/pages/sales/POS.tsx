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
} from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import {
  CATEGORY_URL,
  BRANDS_URL,
  UNITS_URL,
  ORDERS_URL,
  SUB_SHOPS_URL,
  CHILD_USERS_URL,
  fetchProducts
} from "@/api/api";
import Spinner from "@/components/Spinner";
import Invoice from "@/components/Invoice";
import { successToast } from "@/utils/utils";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import BarcodeScanner from "@/components/BarcodeScanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProductVariant, ProductQueryParams, Product } from "@/types/ProductType";
import { toast } from "react-toastify";
import { Unit, Brand } from "@/types/categoryType";
import { Color, Category } from "@/types/categoryType";
import { useAuth } from "@/context/AuthContext";

// Product interface is now imported from types

interface CartItem extends Product {
  quantity: number;
  unit: Unit;
  selectedVariant?: {
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
  paymentMethod: "cash" | "card";
  verificationCode: string;
  expiryDate: string;
}

interface CartAdjustments {
  tax: {
    type: "fixed" | "percentage";
    value: number;
  };
  discount: {
    type: "fixed" | "percentage";
    value: number;
  };
  priceAdjustments: { [key: string]: number };
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
        <div className="w-1/3 aspect-square rounded-lg overflow-hidden">
          <img
            src={selectedVariant?.imageUrl || product.productImage}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-300"
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
                  onClick={() => setSelectedVariant(variant)}
                  disabled={variant.quantity === 0}
                  className={`relative group rounded-lg overflow-hidden transition-all ${variant.quantity === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                    }`}
                >
                  <div className="aspect-square">
                    <img
                      src={variant.imageUrl}
                      alt={`${variant.Color?.name} / ${variant.Size?.name}`}
                      className={`w-full h-full object-cover transition-transform duration-300 ${selectedVariant?.id === variant.id
                        ? "scale-110"
                        : "group-hover:scale-105"
                        }`}
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${selectedVariant?.id === variant.id
                        ? "bg-black/40"
                        : "bg-black/0 group-hover:bg-black/20"
                        }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg transform transition-all duration-300 ${selectedVariant?.id === variant.id
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

const POS: React.FC = () => {
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filter states for API
  const { user } = useAuth();
  const [searchKey, setSearchKey] = useState("");
  const [sku, setSku] = useState("");
  const [shopId, setShopId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [selectedBrand, setSelectedBrand] = useState<number | "all">("all");
  const [selectedUnit, setSelectedUnit] = useState<number | "all">("all");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 1000,
  });
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
  });
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<number, number>
  >({});
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "cash" | "card"
  >("cash");
  const [selectedStaffId, setSelectedStaffId] = useState<number | "self-sell" | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffSearchKey, setStaffSearchKey] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("");
  const [adjustments, setAdjustments] = useState<CartAdjustments>({
    tax: { type: "percentage", value: 0 },
    discount: { type: "percentage", value: 0 },
    priceAdjustments: {},
  });

  const queryClient = useQueryClient();

  // Build query parameters
  const queryParams: ProductQueryParams = useMemo(() => {
    const params: ProductQueryParams = {
      page,
      pageSize,
      status: "active"
    };

    if (searchKey) params.searchKey = searchKey;
    if (shopId) params.shopId = shopId;
    if (selectedCategory !== "all") params.categoryId = selectedCategory;
    if (selectedBrand !== "all") params.brandId = selectedBrand;
    if (selectedUnit !== "all") params.unitId = selectedUnit;


    // Add price range filters
    if (priceRange.min !== undefined && priceRange.min !== null && priceRange.min > 0) {
      params.minPrice = priceRange.min;
    }
    if (priceRange.max !== undefined && priceRange.max !== null && priceRange.max > 0) {
      params.maxPrice = priceRange.max;
    }

    if (sku) {
      params.sku = sku;
    }

    return params;
  }, [page, pageSize, searchKey, sku, shopId, selectedCategory, selectedBrand, selectedUnit, priceRange]);

  // Products query with pagination
  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
  } = useQuery({
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
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
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

  // Fetch Active Staff/Child Users
  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["active-staff"],
    queryFn: async () => {
      const response = await AXIOS.get(CHILD_USERS_URL, {
        params: {
          page: 1,
          pageSize: 10000,
          status: "active",
        },
      });
      return response.data;
    },
  });

  const activeStaffs = staffData?.users?.filter(
    (staff: any) => staff.status === "active"
  ) || [];

  // Filter staffs based on search and role
  const filteredStaffs = useMemo(() => {
    let filtered = activeStaffs;

    // Filter by search key (name, email, phone, business name, ID)
    if (staffSearchKey.trim()) {
      const searchLower = staffSearchKey.trim().toLowerCase();
      filtered = filtered.filter((staff: any) => {
        const name = (staff.fullName || "").toLowerCase();
        const email = (staff.email || "").toLowerCase();
        const phone = (staff.phone || "").toLowerCase();
        const businessName = (staff.parent?.businessName || "").toLowerCase();
        const id = String(staff.id || "").toLowerCase();
        const role = (staff.role || "").toLowerCase();

        return (
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          businessName.includes(searchLower) ||
          id.includes(searchLower) ||
          role.includes(searchLower)
        );
      });
    }

    // Filter by role
    if (staffRoleFilter) {
      filtered = filtered.filter(
        (staff: any) => staff.role?.toLowerCase() === staffRoleFilter.toLowerCase()
      );
    }

    return filtered;
  }, [activeStaffs, staffSearchKey, staffRoleFilter]);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setPage(1);
  };

  // Handle barcode scan
  const handleBarcodeScan = useCallback((barcode: string) => {
    if (barcode && barcode.trim()) {
      // setSearchKey(barcode.trim());
      setSku(barcode.trim())
      setPage(1); // Reset to page 1
      // Optionally close scanner after scan
      setIsBarcodeScannerOpen(false);
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
    }
  };

  const updateQuantity = (cartItemId: string, change: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQuantity = item.quantity + change;
            if (newQuantity > (item.selectedVariant?.quantity || item.stock)) {
              successToast("Cannot add more than available stock", "warn");
              return item;
            }
            return { ...item, quantity: Math.max(0, newQuantity) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const adjustedPrice = adjustments.priceAdjustments[item.id] || item.price;
    return sum + adjustedPrice * item.quantity;
  }, 0);

  const calculateTax = () => {
    if (adjustments.tax.type === "percentage") {
      return (subtotal * adjustments.tax.value) / 100;
    }
    return adjustments.tax.value;
  };

  const calculateDiscount = () => {
    if (adjustments.discount.type === "percentage") {
      return (subtotal * adjustments.discount.value) / 100;
    }
    return adjustments.discount.value;
  };

  const taxAmount = calculateTax();
  const discountAmount = calculateDiscount();
  const total = subtotal - discountAmount + taxAmount;
  // Cart items count
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add this mutation
  const createOrderMutation = useMutation({
    mutationFn: async (cartItems: CartItem[]) => {
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: adjustments.priceAdjustments[item.id] || item.price,
          ...(item.selectedVariant && { variantId: item.selectedVariant.id }),
        })),
        customerName: customerInfo.name || "Walk-in Customer",
        phone: customerInfo.phone || "",
        address: "",
        email: "",
        paymentStatus: "completed",
        paymentMethod: selectedPaymentMethod,
        orderStatus: "completed",
        tax: calculateTax(),
        discount: calculateDiscount(),
        subtotal: subtotal,
        total: subtotal - calculateDiscount() + calculateTax(),
        ...(selectedStaffId === "self-sell" 
          ? { stuffId: undefined } 
          : selectedStaffId 
          ? { stuffId: selectedStaffId } 
          : {}),
      };

      const response = await AXIOS.post(ORDERS_URL, orderData);
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentOrder(data);
      setShowInvoice(true);
      setCart([]);
      setSelectedStaffId(null); // Reset staff selection after order
      setAdjustments({
        tax: { type: "percentage", value: 0 },
        discount: { type: "percentage", value: 0 },
        priceAdjustments: {},
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create order");
    },
  });

  // Add these handlers
  const handlePayment = (method: "cash" | "card") => {
    setSelectedPaymentMethod(method);
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    // Show staff selection modal if no staff is selected
    if (selectedStaffId === null) {
      setShowStaffModal(true);
      return;
    }
    createOrderMutation.mutate(cart);
  };

  const handleStaffSelect = (staffId: number | "self-sell") => {
    setSelectedStaffId(staffId);
    setShowStaffModal(false);
  };

  const handlePrintInvoice = () => {
    const printContent = document.getElementById("invoice-print");
    const originalContent = document.body.innerHTML;

    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Reload to restore React app
    }
  };

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
      selectedVariant: variant,
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

  const updateItemPrice = (itemId: string, newPrice: number) => {
    setAdjustments((prev) => ({
      ...prev,
      priceAdjustments: {
        ...prev.priceAdjustments,
        [itemId]: newPrice,
      },
    }));
  };

  const updateTax = (newTax: number) => {
    setAdjustments((prev) => ({
      ...prev,
      tax: { type: "percentage", value: Math.max(0, Math.min(100, newTax)) },
    }));
  };

  const updateDiscount = (newDiscount: number) => {
    setAdjustments((prev) => ({
      ...prev,
      discount: {
        type: "percentage",
        value: Math.max(0, Math.min(100, newDiscount)),
      },
    }));
  };

  console.log({
    tax: adjustments.tax,
    discount: adjustments.discount,
    priceAdjustments: adjustments.priceAdjustments,
    subtotal: subtotal,
    total: total,
    updateTax,
    updateDiscount,
    updateItemPrice,
  });

  // if (isLoadingProducts || isLoadingCategories) {
  //   return (
  //     <div className="flex justify-center items-center h-[calc(100vh-5rem)]">
  //       <Spinner color="#32cd32" size="40px" />
  //     </div>
  //   );
  // }

  return (
    <div className=" flex flex-col lg:flex-row gap-6 relative">
      {/* Products Section */}
      <div
        className={`flex-1 flex flex-col  bg-white rounded-lg shadow overflow-hidden ${showMobileCart ? "hidden xl:flex" : "flex"
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
                  <span><strong>Scanned:</strong> {sku}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSku("")
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
                  shopId !== "" ||
                  priceRange.min > 0 ||
                  priceRange.max > 0) && (
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
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isFiltersExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
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
                        setSelectedCategory(value === "all" ? "all" : Number(value));
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
                        setSelectedBrand(value === "all" ? "all" : Number(value));
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
                        setSelectedUnit(value === "all" ? "all" : Number(value));
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
                      value={priceRange.min || ""}
                      onChange={(e) => {
                        setPriceRange({ ...priceRange, min: Number(e.target.value) || 0 });
                        handleFilterChange();
                      }}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white hover:border-gray-400 transition-colors"
                    />
                    <span className="text-gray-400 text-sm flex-shrink-0">-</span>
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={priceRange.max || ""}
                      onChange={(e) => {
                        setPriceRange({ ...priceRange, max: Number(e.target.value) || 0 });
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
        <div className={`flex-1 p-4 overflow-y-auto ${isLoadingProducts || isLoadingCategories || isLoadingShops ? "flex items-center justify-center" : ""}`}>
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

                      {/* Price */}
                      <div className="mt-1 text-brand-primary font-medium">
                        ${Number(product.price).toFixed(2)}
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
                                    className={`relative -ml-1 first:ml-0 group cursor-pointer transition-transform hover:scale-110 hover:z-10 ${selectedVariants[product.id] === variant.id
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
                                      {variant.Color?.name} - {variant.Size?.name}
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
                          className={`w-2 h-2 rounded-full ${getTotalStock(product) > 10
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
      <div
        className={` bg-white rounded-lg shadow flex flex-col xl:flex ${showMobileCart ? "flex" : "hidden"
          }`}
      >
        {/* Mobile Cart Header */}
        <div className="xl:hidden flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Shopping Cart</h2>
          <button
            onClick={() => setShowMobileCart(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Info */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <FaUser className="w-5 h-5" />
            <span className="font-medium">Customer Information</span>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Customer Name"
              value={customerInfo.name}
              onChange={(e) =>
                setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={customerInfo.phone}
              onChange={(e) =>
                setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 p-4 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FaShoppingCart className="w-8 h-8 mx-auto mb-2" />
                <p>Cart is empty</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          adjustments.priceAdjustments[item.id] || item.price
                        }
                        onChange={(e) =>
                          updateItemPrice(
                            item.id?.toString() || "",
                            Number(e.target.value)
                          )
                        }
                        className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                      <span className="text-sm text-gray-500">
                        × {item.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item?.cartItemId, -1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <FaMinus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item?.cartItemId, 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <FaPlus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals and Checkout */}
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm items-center">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {/* Tax Input */}
            <div className="flex justify-between text-sm items-center">
              <div className="flex items-center gap-2">
                <span>Tax</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={adjustments.tax.value}
                    onChange={(e) =>
                      setAdjustments((prev) => ({
                        ...prev,
                        tax: {
                          ...prev.tax,
                          value: Math.max(0, Number(e.target.value)),
                        },
                      }))
                    }
                    className="w-20 px-2 py-1 text-sm border rounded-l focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                  <select
                    value={adjustments.tax.type}
                    onChange={(e) =>
                      setAdjustments((prev) => ({
                        ...prev,
                        tax: {
                          ...prev.tax,
                          type: e.target.value as "fixed" | "percentage",
                        },
                      }))
                    }
                    className="text-sm border-y border-r rounded-r bg-gray-50 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="fixed">$</option>
                    <option value="percentage">%</option>
                  </select>
                </div>
              </div>
              <span>${taxAmount.toFixed(2)}</span>
            </div>

            {/* Discount Input */}
            <div className="flex justify-between text-sm items-center">
              <div className="flex items-center gap-2">
                <span>Discount</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={adjustments.discount.value}
                    onChange={(e) =>
                      setAdjustments((prev) => ({
                        ...prev,
                        discount: {
                          ...prev.discount,
                          value: Math.max(0, Number(e.target.value)),
                        },
                      }))
                    }
                    className="w-20 px-2 py-1 text-sm border rounded-l focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                  <select
                    value={adjustments.discount.type}
                    onChange={(e) =>
                      setAdjustments((prev) => ({
                        ...prev,
                        discount: {
                          ...prev.discount,
                          type: e.target.value as "fixed" | "percentage",
                        },
                      }))
                    }
                    className="text-sm border-y border-r rounded-r bg-gray-50 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="fixed">$</option>
                    <option value="percentage">%</option>
                  </select>
                </div>
              </div>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>${(subtotal - discountAmount + taxAmount).toFixed(2)}</span>
            </div>
          </div>

          {/* Staff Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Staff <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => setShowStaffModal(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer hover:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors"
            >
              {selectedStaffId === "self-sell" ? (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      Self Sell
                    </span>
                    <span className="text-xs text-gray-500">
                      Shop selling (No staff assigned)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStaffId(null);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              ) : selectedStaffId ? (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">
                      {
                        activeStaffs.find(
                          (staff: any) => staff.id === selectedStaffId
                        )?.fullName
                      }
                    </span>
                    <span className="text-xs text-gray-500">
                      {
                        activeStaffs.find(
                          (staff: any) => staff.id === selectedStaffId
                        )?.parent?.businessName
                      }{" "}
                      (ID: {selectedStaffId})
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStaffId(null);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-gray-500">
                  <span>Click to select staff or self sell</span>
                  <FaChevronDown className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handlePayment("card")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createOrderMutation.isPending || selectedStaffId === null}
            >
              {createOrderMutation?.isPending ? (
                <Spinner size="16px" />
              ) : (
                <>
                  <FaCreditCard /> <span>Card</span>
                </>
              )}
            </button>
            <button
              onClick={() => handlePayment("cash")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createOrderMutation.isPending || selectedStaffId === null}
            >
              {createOrderMutation?.isPending ? (
                <Spinner size="16px" />
              ) : (
                <>
                  <FaMoneyBill />
                  <span>Cash</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => setIsBarcodeScannerOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
          >
            <FaQrcode className="w-5 h-5" />
            <span>Scan Barcode</span>
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <Modal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        title="Barcode Scanner"
        className="max-w-2xl"
      >
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error("BarcodeScanner error:", error, errorInfo);
          }}
          fallback={
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Scanner Error
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  The barcode scanner encountered an error. Please try again or use the manual input option.
                </p>
                <button
                  onClick={() => setIsBarcodeScannerOpen(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <BarcodeScanner
            isOpen={isBarcodeScannerOpen}
            onClose={() => setIsBarcodeScannerOpen(false)}
            onScan={handleBarcodeScan}
            title="Scan Barcode"
          />
        </ErrorBoundary>
      </Modal>

      {/* Mobile Cart Toggle Button */}
      <button
        onClick={() => setShowMobileCart(true)}
        className={`xl:hidden fixed bottom-4 right-4 bg-brand-primary text-white p-4 rounded-full shadow-lg ${showMobileCart ? "hidden" : "flex"
          } items-center justify-center`}
      >
        <div className="relative">
          <FaShoppingCart className="w-6 h-6" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {cartItemsCount}
            </span>
          )}
        </div>
      </button>

      <Modal
        title="Invoice"
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        className="!max-w-[90vw] lg:!max-w-4xl"
      >
        <Invoice
          orderId={Number(currentOrder?.id || 0)}
          onClose={() => {
            setShowInvoice(false);
            setCart([]);
            setCustomerInfo({ name: "", phone: "" });
          }}
          onPrint={handlePrintInvoice}
        />
      </Modal>

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

      {/* Staff Selection Modal */}
      <Modal
        isOpen={showStaffModal}
        onClose={() => {
          setShowStaffModal(false);
          setStaffSearchKey("");
          setStaffRoleFilter("");
        }}
        title="Select Staff or Self Sell"
        className="max-w-3xl"
      >
        <div className="space-y-4">
          {/* Self Sell Option - Prominent */}
          <button
            onClick={() => handleStaffSelect("self-sell")}
            className={`w-full text-left p-4 border-2 rounded-lg transition-all hover:shadow-md ${
              selectedStaffId === "self-sell"
                ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-gray-900">
                    Self Sell
                  </span>
                  <span className="text-xs text-gray-500 bg-blue-50 px-2 py-0.5 rounded-full">
                    Shop Direct
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  No staff assigned - Shop selling directly
                </div>
              </div>
              {selectedStaffId === "self-sell" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center shadow-sm">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
              )}
            </div>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">OR SELECT STAFF</span>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Search Input */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, business, ID..."
                value={staffSearchKey}
                onChange={(e) => setStaffSearchKey(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                autoFocus
              />
              {staffSearchKey && (
                <button
                  onClick={() => setStaffSearchKey("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <select
              value={staffRoleFilter}
              onChange={(e) => setStaffRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white"
            >
              <option value="">All Roles</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          {/* Results Count */}
          {!isLoadingStaff && activeStaffs.length > 0 && (
            <div className="text-sm text-gray-500">
              Showing {filteredStaffs.length} of {activeStaffs.length} staff
              {(staffSearchKey || staffRoleFilter) && " (filtered)"}
            </div>
          )}

          {/* Staff List */}
          {isLoadingStaff ? (
            <div className="flex justify-center items-center py-12">
              <Spinner color="#32cd32" size="40px" />
            </div>
          ) : activeStaffs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <FaUser className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 font-medium">No active staff available</p>
              <p className="text-sm text-gray-400 mt-1">
                Please add staff members to continue
              </p>
            </div>
          ) : filteredStaffs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <FaSearch className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 font-medium">No staff found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filter criteria
              </p>
              {(staffSearchKey || staffRoleFilter) && (
                <button
                  onClick={() => {
                    setStaffSearchKey("");
                    setStaffRoleFilter("");
                  }}
                  className="mt-4 text-sm text-brand-primary hover:text-brand-hover underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {filteredStaffs.map((staff: any) => (
                <button
                  key={staff.id}
                  onClick={() => handleStaffSelect(staff.id)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                    selectedStaffId === staff.id
                      ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-gray-900 truncate">
                          {staff.fullName}
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          (ID: {staff.id})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="text-gray-500 truncate">
                          {staff.parent?.businessName || "N/A"}
                        </div>
                        {staff.email && (
                          <div className="text-gray-400 truncate hidden md:block">
                            • {staff.email}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {staff.role && (
                          <span className="inline-block px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full capitalize">
                            {staff.role}
                          </span>
                        )}
                        {staff.phone && (
                          <span className="text-xs text-gray-500">
                            {staff.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedStaffId === staff.id && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center shadow-sm">
                          <span className="text-white text-sm font-bold">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default POS;
