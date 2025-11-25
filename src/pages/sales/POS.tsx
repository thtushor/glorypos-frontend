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
import { successToast } from "@/utils/utils";
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
// import UserIcon from "@/components/icons/UserIcon";

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
                  className={`relative group rounded-lg overflow-hidden transition-all ${
                    variant.quantity === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="aspect-square">
                    <img
                      src={variant.imageUrl}
                      alt={`${variant.Color?.name} / ${variant.Size?.name}`}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        selectedVariant?.id === variant.id
                          ? "scale-110"
                          : "group-hover:scale-105"
                      }`}
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
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
  const [selectedStaffId, setSelectedStaffId] = useState<
    number | "self-sell" | null
  >(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffSearchKey, setStaffSearchKey] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [partialPayment, setPartialPayment] = useState<PartialPayment>({
    cashAmount: 0,
    cardAmount: 0,
    walletAmount: 0,
  });
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
      status: "active",
    };

    if (searchKey) params.searchKey = searchKey;
    if (shopId) params.shopId = shopId;
    if (selectedCategory !== "all") params.categoryId = selectedCategory;
    if (selectedBrand !== "all") params.brandId = selectedBrand;
    if (selectedUnit !== "all") params.unitId = selectedUnit;

    // Add price range filters
    if (
      priceRange.min !== undefined &&
      priceRange.min !== null &&
      priceRange.min > 0
    ) {
      params.minPrice = priceRange.min;
    }
    if (
      priceRange.max !== undefined &&
      priceRange.max !== null &&
      priceRange.max > 0
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activeStaffs =
    staffData?.users?.filter((staff: any) => staff.status === "active") || [];

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
        (staff: any) =>
          staff.role?.toLowerCase() === staffRoleFilter.toLowerCase()
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
      setSku(barcode.trim());
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

  // Calculate totals with proper decimal handling
  const subtotal = useMemo(() => {
    const sum = cart.reduce((sum, item) => {
      const adjustedPrice = adjustments.priceAdjustments[item.id] || item.price;
      return sum + adjustedPrice * item.quantity;
    }, 0);
    return Math.round(sum * 100) / 100; // Round to 2 decimal places
  }, [cart, adjustments.priceAdjustments]);

  const calculateTax = () => {
    if (adjustments.tax.type === "percentage") {
      const tax = (subtotal * adjustments.tax.value) / 100;
      return Math.round(tax * 100) / 100; // Round to 2 decimal places
    }
    return Math.round(adjustments.tax.value * 100) / 100; // Round to 2 decimal places
  };

  const calculateDiscount = () => {
    if (adjustments.discount.type === "percentage") {
      const discount = (subtotal * adjustments.discount.value) / 100;
      return Math.round(discount * 100) / 100; // Round to 2 decimal places
    }
    return Math.round(adjustments.discount.value * 100) / 100; // Round to 2 decimal places
  };

  const taxAmount = calculateTax();
  const discountAmount = calculateDiscount();
  const total = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100; // Round to 2 decimal places
  // Cart items count
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate payment totals with proper decimal handling
  const paymentTotal = useMemo(() => {
    const sum =
      partialPayment.cashAmount +
      partialPayment.cardAmount +
      partialPayment.walletAmount;
    return Math.round(sum * 100) / 100; // Round to 2 decimal places
  }, [partialPayment]);

  const paymentRemaining = useMemo(() => {
    const remaining = total - paymentTotal;
    return Math.round(Math.max(0, remaining) * 100) / 100; // Round to 2 decimal places
  }, [total, paymentTotal]);

  const isPaymentComplete = useMemo(() => {
    return Math.abs(paymentTotal - total) < 0.01; // Allow small floating point differences
  }, [paymentTotal, total]);

  const isPaymentOver = useMemo(() => {
    return paymentTotal > total + 0.01; // Add small buffer for floating point comparison
  }, [paymentTotal, total]);

  // Add this mutation
  const createOrderMutation = useMutation({
    mutationFn: async (cartItems: CartItem[]) => {
      const orderTotal = subtotal - calculateDiscount() + calculateTax();
      const isMixed =
        (partialPayment.cashAmount > 0 &&
          (partialPayment.cardAmount > 0 || partialPayment.walletAmount > 0)) ||
        (partialPayment.cardAmount > 0 && partialPayment.walletAmount > 0);

      const paymentMethod = isMixed
        ? "mixed"
        : partialPayment.cashAmount > 0
        ? "cash"
        : partialPayment.cardAmount > 0
        ? "card"
        : "mobile_banking";

      const orderData: any = {
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
        paymentMethod: paymentMethod,
        orderStatus: "completed",
        tax: calculateTax(),
        discount: calculateDiscount(),
        subtotal: subtotal,
        total: orderTotal,
        ...(selectedStaffId === "self-sell"
          ? { stuffId: undefined }
          : selectedStaffId
          ? { stuffId: selectedStaffId }
          : {}),
      };

      // Add partial payment amounts if mixed payment
      if (
        isMixed ||
        partialPayment.cashAmount > 0 ||
        partialPayment.cardAmount > 0 ||
        partialPayment.walletAmount > 0
      ) {
        orderData.cashAmount = partialPayment.cashAmount || 0;
        orderData.cardAmount = partialPayment.cardAmount || 0;
        orderData.walletAmount = partialPayment.walletAmount || 0;
      }

      const response = await AXIOS.post(ORDERS_URL, orderData);
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentOrder(data);
      setShowInvoice(true);
      setShowPaymentModal(false);
      setCart([]);
      setSelectedStaffId(null); // Reset staff selection after order
      setPartialPayment({
        cashAmount: 0,
        cardAmount: 0,
        walletAmount: 0,
      });
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
  const handlePaymentClick = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    // Show staff selection modal if no staff is selected
    if (selectedStaffId === null) {
      setShowStaffModal(true);
      return;
    }
    // Reset payment amounts and open payment modal
    setPartialPayment({
      cashAmount: 0,
      cardAmount: 0,
      walletAmount: 0,
    });
    setShowPaymentModal(true);
  };

  const handleProcessPayment = () => {
    if (!isPaymentComplete) {
      toast.error(
        `Payment incomplete. Remaining: ${money.format(paymentRemaining)}`
      );
      return;
    }
    if (isPaymentOver) {
      toast.error(
        `Payment exceeds total. Overpayment: $${(paymentTotal - total).toFixed(
          2
        )}`
      );
      return;
    }
    createOrderMutation.mutate(cart);
  };

  const handleQuickPayment = (method: "cash" | "card" | "mobile_banking") => {
    setPartialPayment({
      cashAmount: method === "cash" ? total : 0,
      cardAmount: method === "card" ? total : 0,
      walletAmount: method === "mobile_banking" ? total : 0,
    });
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

  // Currency formatting helpers
  const formatCurrency = (value: number | string): number => {
    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
    return Math.round(numValue * 100) / 100; // Round to 2 decimal places
  };

  const parseCurrencyInput = (value: string): number => {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, "");
    // Handle multiple decimal points
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return parseFloat(parts[0] + "." + parts.slice(1).join("")) || 0;
    }
    const numValue = parseFloat(cleaned) || 0;
    // Round to 2 decimal places
    return Math.round(numValue * 100) / 100;
  };

  // Helper to extract numeric value from formatted currency string for input fields
  const getNumericValue = (value: number | string): string => {
    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
    return numValue.toFixed(2);
  };

  const updateItemPrice = (itemId: string, newPrice: number) => {
    const formattedPrice = formatCurrency(newPrice);
    setAdjustments((prev) => ({
      ...prev,
      priceAdjustments: {
        ...prev.priceAdjustments,
        [itemId]: formattedPrice,
      },
    }));
  };

  const updateTax = (newTax: number) => {
    const formattedTax = formatCurrency(newTax);
    setAdjustments((prev) => ({
      ...prev,
      tax: {
        type: prev.tax.type,
        value:
          prev.tax.type === "percentage"
            ? Math.max(0, Math.min(100, formattedTax))
            : Math.max(0, formattedTax),
      },
    }));
  };

  const updateDiscount = (newDiscount: number) => {
    const formattedDiscount = formatCurrency(newDiscount);
    setAdjustments((prev) => ({
      ...prev,
      discount: {
        type: prev.discount.type,
        value:
          prev.discount.type === "percentage"
            ? Math.max(0, Math.min(100, formattedDiscount))
            : Math.max(0, formattedDiscount),
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
                        setPriceRange({
                          ...priceRange,
                          min: Number(e.target.value) || 0,
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
                          max: Number(e.target.value) || 0,
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
      <div
        className={` bg-white rounded-lg shadow flex flex-col xl:flex ${
          showMobileCart ? "flex" : "hidden"
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
                      <span className="text-xs sm:text-sm text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={
                          adjustments.priceAdjustments[item.id]
                            ? getNumericValue(
                                adjustments.priceAdjustments[item.id]
                              )
                            : getNumericValue(item.price)
                        }
                        onChange={(e) => {
                          const parsed = parseCurrencyInput(e.target.value);
                          updateItemPrice(item.id?.toString() || "", parsed);
                        }}
                        onBlur={(e) => {
                          const parsed = parseCurrencyInput(e.target.value);
                          updateItemPrice(
                            item.id?.toString() || "",
                            formatCurrency(parsed)
                          );
                        }}
                        className="w-20 sm:w-24 px-2 py-1.5 sm:py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                      <span className="text-xs sm:text-sm text-gray-500">
                        × {item.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => updateQuantity(item?.cartItemId, -1)}
                      className="p-2 sm:p-1 active:bg-gray-200 hover:bg-gray-200 rounded touch-manipulation"
                      aria-label="Decrease quantity"
                    >
                      <FaMinus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                    </button>
                    <span className="w-8 sm:w-8 text-center text-sm sm:text-base font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item?.cartItemId, 1)}
                      className="p-2 sm:p-1 active:bg-gray-200 hover:bg-gray-200 rounded touch-manipulation"
                      aria-label="Increase quantity"
                    >
                      <FaPlus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 sm:p-1 text-red-500 active:bg-red-50 hover:bg-red-50 rounded touch-manipulation"
                      aria-label="Remove item"
                    >
                      <FaTrash className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
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
            <div className="flex justify-between text-xs sm:text-sm items-center">
              <span>Subtotal</span>
              <span className="font-medium">{money.format(subtotal)}</span>
            </div>

            {/* Tax Input */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 flex-1">
                <span>Tax</span>
                <div className="flex items-center flex-1 sm:flex-initial">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step={
                      adjustments.tax.type === "percentage" ? "0.01" : "0.01"
                    }
                    max={
                      adjustments.tax.type === "percentage" ? "100" : undefined
                    }
                    value={getNumericValue(adjustments.tax.value)}
                    onChange={(e) => {
                      const parsed = parseCurrencyInput(e.target.value);
                      updateTax(parsed);
                    }}
                    onBlur={(e) => {
                      const parsed = parseCurrencyInput(e.target.value);
                      updateTax(parsed);
                    }}
                    className="w-full sm:w-20 px-2 py-1.5 sm:py-1 text-sm border rounded-l focus:outline-none focus:ring-1 focus:ring-brand-primary"
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
                    className="text-sm border-y border-r rounded-r bg-gray-50 px-2 py-1.5 sm:py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="fixed">$</option>
                    <option value="percentage">%</option>
                  </select>
                </div>
              </div>
              <span className="font-medium sm:ml-auto">
                {money.format(taxAmount)}
              </span>
            </div>

            {/* Discount Input */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 flex-1">
                <span>Discount</span>
                <div className="flex items-center flex-1 sm:flex-initial">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step={
                      adjustments.discount.type === "percentage"
                        ? "0.01"
                        : "0.01"
                    }
                    max={
                      adjustments.discount.type === "percentage"
                        ? "100"
                        : undefined
                    }
                    value={getNumericValue(adjustments.discount.value)}
                    onChange={(e) => {
                      const parsed = parseCurrencyInput(e.target.value);
                      updateDiscount(parsed);
                    }}
                    onBlur={(e) => {
                      const parsed = parseCurrencyInput(e.target.value);
                      updateDiscount(parsed);
                    }}
                    className="w-full sm:w-20 px-2 py-1.5 sm:py-1 text-sm border rounded-l focus:outline-none focus:ring-1 focus:ring-brand-primary"
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
                    className="text-sm border-y border-r rounded-r bg-gray-50 px-2 py-1.5 sm:py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="fixed">$</option>
                    <option value="percentage">%</option>
                  </select>
                </div>
              </div>
              <span className="font-medium sm:ml-auto">
                -{money.format(discountAmount)}
              </span>
            </div>

            {/* Total */}
            <div className="flex justify-between font-semibold text-base sm:text-lg pt-2 border-t">
              <span>Total</span>
              <span>{money.format(total)}</span>
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
                    <span className="font-medium text-gray-900">Self Sell</span>
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

          {/* Payment Button */}
          <button
            onClick={handlePaymentClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 sm:py-3 bg-brand-primary text-white rounded-md active:bg-brand-hover hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors mb-4 text-base sm:text-sm touch-manipulation"
            disabled={
              createOrderMutation.isPending ||
              selectedStaffId === null ||
              cart.length === 0
            }
          >
            {createOrderMutation?.isPending ? (
              <>
                <Spinner size="16px" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FaCreditCard />
                <span>Process Payment</span>
              </>
            )}
          </button>

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
                  The barcode scanner encountered an error. Please try again or
                  use the manual input option.
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
        className={`xl:hidden fixed bottom-4 right-4 bg-brand-primary text-white p-4 rounded-full shadow-lg ${
          showMobileCart ? "hidden" : "flex"
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
        title="Select Staff"
        className="!max-w-[90vw]"
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
                  <span className="font-semibold text-gray-900">Self Sell</span>
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
              <span className="bg-white px-4 text-gray-500">
                OR SELECT STAFF
              </span>
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
              <p className="text-gray-500 font-medium">
                No active staff available
              </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5  pr-2">
              {filteredStaffs.map((staff: any) => (
                <button
                  key={staff.id}
                  onClick={() => handleStaffSelect(staff.id)}
                  className={`relative text-left p-3 border-2 rounded-lg transition-all hover:shadow-md hover:scale-[1.02] ${
                    selectedStaffId === staff.id
                      ? "border-brand-primary bg-brand-primary/10 shadow-md ring-2 ring-brand-primary/20"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  {selectedStaffId === staff.id && (
                    <div className="absolute top-1.5 right-1.5">
                      <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center shadow-sm">
                        <FaCheckCircle className="text-white text-[10px]" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5 pr-5">
                    {/* Header: Name and ID */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold flex items-center gap-2 text-sm text-gray-900 truncate mb-0.5">
                          <FaUserGear /> Employee: {staff.fullName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
                          {/* ID Chip */}
                          <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full">
                            ID: {staff.id}
                          </span>

                          {/* Phone Chip */}
                          {staff.phone && (
                            <span className="text-[10px] text-gray-700 bg-gray-100 px-2 py-1 rounded-full truncate">
                              {staff.phone}
                            </span>
                          )}

                          {/* Email Chip */}
                          {staff.email && (
                            <span className="text-[10px] text-gray-700 bg-gray-100 px-2 py-1 rounded-full truncate">
                              {staff.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shop Info */}
                    <div className="pt-1 border-t border-gray-100">
                      <p className="text-xs font-medium text-blue-700 truncate mb-0.5">
                        Shop: {staff.parent?.businessName || "N/A"}
                      </p>
                      {staff.parent?.id && (
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          Shop #{staff.parent.id}
                        </span>
                      )}
                    </div>

                    {/* Role Badge */}
                    {staff.role && (
                      <div className="pt-1">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 rounded-full capitalize">
                          {staff.role}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPartialPayment({
            cashAmount: 0,
            cardAmount: 0,
            walletAmount: 0,
          });
        }}
        title="Process Payment"
        className="max-w-2xl w-full mx-2 sm:mx-4"
      >
        <div className="space-y-4 sm:space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto px-1">
          {/* Order Total Display */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-hover text-white rounded-lg p-4 sm:p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm opacity-90 mb-1">
                  Total Amount
                </p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {money.format(total)}
                </p>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="text-xs sm:text-sm opacity-90 mb-1">
                  Payment Status
                </p>
                <div className="flex items-center gap-2">
                  {isPaymentComplete ? (
                    <>
                      <FaCheckCircle className="text-xl sm:text-2xl" />
                      <span className="text-base sm:text-lg font-semibold">
                        Complete
                      </span>
                    </>
                  ) : isPaymentOver ? (
                    <>
                      <FaExclamationCircle className="text-xl sm:text-2xl text-yellow-300" />
                      <span className="text-base sm:text-lg font-semibold">
                        Overpaid
                      </span>
                    </>
                  ) : (
                    <>
                      <FaExclamationCircle className="text-xl sm:text-2xl opacity-75" />
                      <span className="text-base sm:text-lg font-semibold">
                        Pending
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Amount Summary */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div
                className={`p-2 sm:p-3 rounded-lg transition-all ${
                  partialPayment.cashAmount > 0
                    ? "bg-green-100 border-2 border-green-400 shadow-sm"
                    : "bg-transparent"
                }`}
              >
                <p
                  className={`text-xs mb-1 ${
                    partialPayment.cashAmount > 0
                      ? "text-green-700 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  Cash
                  {partialPayment.cashAmount > 0 && (
                    <span className="ml-1 text-green-600">✓</span>
                  )}
                </p>
                <p
                  className={`text-base sm:text-lg font-semibold ${
                    partialPayment.cashAmount > 0
                      ? "text-green-700"
                      : "text-gray-900"
                  }`}
                >
                  {money.format(partialPayment.cashAmount)}
                </p>
              </div>
              <div
                className={`p-2 sm:p-3 rounded-lg transition-all ${
                  partialPayment.cardAmount > 0
                    ? "bg-blue-100 border-2 border-blue-400 shadow-sm"
                    : "bg-transparent"
                }`}
              >
                <p
                  className={`text-xs mb-1 ${
                    partialPayment.cardAmount > 0
                      ? "text-blue-700 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  Card
                  {partialPayment.cardAmount > 0 && (
                    <span className="ml-1 text-blue-600">✓</span>
                  )}
                </p>
                <p
                  className={`text-base sm:text-lg font-semibold ${
                    partialPayment.cardAmount > 0
                      ? "text-blue-700"
                      : "text-gray-900"
                  }`}
                >
                  {money.format(partialPayment.cardAmount)}
                </p>
              </div>
              <div
                className={`p-2 sm:p-3 rounded-lg transition-all ${
                  partialPayment.walletAmount > 0
                    ? "bg-purple-100 border-2 border-purple-400 shadow-sm"
                    : "bg-transparent"
                }`}
              >
                <p
                  className={`text-xs mb-1 ${
                    partialPayment.walletAmount > 0
                      ? "text-purple-700 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  Wallet
                  {partialPayment.walletAmount > 0 && (
                    <span className="ml-1 text-purple-600">✓</span>
                  )}
                </p>
                <p
                  className={`text-base sm:text-lg font-semibold ${
                    partialPayment.walletAmount > 0
                      ? "text-purple-700"
                      : "text-gray-900"
                  }`}
                >
                  {money.format(partialPayment.walletAmount)}
                </p>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base font-medium text-gray-700">
                  Total Paid:
                </span>
                <span
                  className={`text-lg sm:text-xl font-bold ${
                    isPaymentComplete
                      ? "text-green-600"
                      : isPaymentOver
                      ? "text-yellow-600"
                      : "text-gray-900"
                  }`}
                >
                  {money.format(paymentTotal)}
                </span>
              </div>
              {!isPaymentComplete && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Remaining:
                  </span>
                  <span
                    className={`text-base sm:text-lg font-semibold ${
                      isPaymentOver ? "text-yellow-600" : "text-red-600"
                    }`}
                  >
                    {isPaymentOver
                      ? `+${money.format(Math.abs(paymentRemaining))}`
                      : money.format(paymentRemaining)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Payment Buttons */}
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Quick Payment (Full Amount)
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => handleQuickPayment("cash")}
                className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all touch-manipulation ${
                  partialPayment.cashAmount > 0 &&
                  partialPayment.cardAmount === 0 &&
                  partialPayment.walletAmount === 0
                    ? "bg-green-100 border-green-400 shadow-md"
                    : "bg-green-50 border-green-200 active:bg-green-100 hover:bg-green-100 hover:border-green-300"
                }`}
              >
                <FaMoneyBill
                  className={`text-xl sm:text-2xl ${
                    partialPayment.cashAmount > 0 &&
                    partialPayment.cardAmount === 0 &&
                    partialPayment.walletAmount === 0
                      ? "text-green-700"
                      : "text-green-600"
                  }`}
                />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    partialPayment.cashAmount > 0 &&
                    partialPayment.cardAmount === 0 &&
                    partialPayment.walletAmount === 0
                      ? "text-green-800"
                      : "text-green-700"
                  }`}
                >
                  Cash
                  {partialPayment.cashAmount > 0 &&
                    partialPayment.cardAmount === 0 &&
                    partialPayment.walletAmount === 0 && (
                      <span className="ml-1">✓</span>
                    )}
                </span>
              </button>
              <button
                onClick={() => handleQuickPayment("card")}
                className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all touch-manipulation ${
                  partialPayment.cardAmount > 0 &&
                  partialPayment.cashAmount === 0 &&
                  partialPayment.walletAmount === 0
                    ? "bg-blue-100 border-blue-400 shadow-md"
                    : "bg-blue-50 border-blue-200 active:bg-blue-100 hover:bg-blue-100 hover:border-blue-300"
                }`}
              >
                <FaCreditCard
                  className={`text-xl sm:text-2xl ${
                    partialPayment.cardAmount > 0 &&
                    partialPayment.cashAmount === 0 &&
                    partialPayment.walletAmount === 0
                      ? "text-blue-700"
                      : "text-blue-600"
                  }`}
                />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    partialPayment.cardAmount > 0 &&
                    partialPayment.cashAmount === 0 &&
                    partialPayment.walletAmount === 0
                      ? "text-blue-800"
                      : "text-blue-700"
                  }`}
                >
                  Card
                  {partialPayment.cardAmount > 0 &&
                    partialPayment.cashAmount === 0 &&
                    partialPayment.walletAmount === 0 && (
                      <span className="ml-1">✓</span>
                    )}
                </span>
              </button>
              <button
                onClick={() => handleQuickPayment("mobile_banking")}
                className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all touch-manipulation ${
                  partialPayment.walletAmount > 0 &&
                  partialPayment.cashAmount === 0 &&
                  partialPayment.cardAmount === 0
                    ? "bg-purple-100 border-purple-400 shadow-md"
                    : "bg-purple-50 border-purple-200 active:bg-purple-100 hover:bg-purple-100 hover:border-purple-300"
                }`}
              >
                <FaWallet
                  className={`text-xl sm:text-2xl ${
                    partialPayment.walletAmount > 0 &&
                    partialPayment.cashAmount === 0 &&
                    partialPayment.cardAmount === 0
                      ? "text-purple-700"
                      : "text-purple-600"
                  }`}
                />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    partialPayment.walletAmount > 0 &&
                    partialPayment.cashAmount === 0 &&
                    partialPayment.cardAmount === 0
                      ? "text-purple-800"
                      : "text-purple-700"
                  }`}
                >
                  Wallet
                  {partialPayment.walletAmount > 0 &&
                    partialPayment.cashAmount === 0 &&
                    partialPayment.cardAmount === 0 && (
                      <span className="ml-1">✓</span>
                    )}
                </span>
              </button>
            </div>
          </div>

          {/* Manual Payment Inputs */}
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm font-medium text-gray-700">
              Manual Payment Entry
            </p>

            {/* Cash Payment */}
            <div
              className={`space-y-2 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                partialPayment.cashAmount > 0
                  ? "bg-green-50 border-green-300"
                  : "bg-transparent border-transparent"
              }`}
            >
              <label
                className={`flex items-center gap-2 text-xs sm:text-sm font-medium ${
                  partialPayment.cashAmount > 0
                    ? "text-green-700"
                    : "text-gray-700"
                }`}
              >
                <FaMoneyBill
                  className={`text-sm sm:text-base ${
                    partialPayment.cashAmount > 0
                      ? "text-green-600"
                      : "text-green-500"
                  }`}
                />
                Cash Amount
                {partialPayment.cashAmount > 0 && (
                  <span className="ml-auto text-green-600 font-bold">
                    ✓ Selected
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={
                    partialPayment.cashAmount > 0
                      ? getNumericValue(partialPayment.cashAmount)
                      : ""
                  }
                  onChange={(e) => {
                    const parsed = parseCurrencyInput(e.target.value);
                    setPartialPayment((prev) => ({
                      ...prev,
                      cashAmount: parsed,
                    }));
                  }}
                  onBlur={(e) => {
                    const parsed = parseCurrencyInput(e.target.value);
                    const formatted = formatCurrency(parsed);
                    setPartialPayment((prev) => ({
                      ...prev,
                      cashAmount: formatted,
                    }));
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 sm:pl-10 pr-20 sm:pr-24 py-3 sm:py-3.5 text-base sm:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
                <button
                  onClick={() => {
                    const remaining = Math.max(
                      0,
                      total - paymentTotal + partialPayment.cashAmount
                    );
                    const formatted = formatCurrency(remaining);
                    setPartialPayment((prev) => ({
                      ...prev,
                      cashAmount: formatted,
                    }));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-green-600 bg-green-50 rounded-md active:bg-green-100 hover:bg-green-100 transition-colors touch-manipulation whitespace-nowrap"
                >
                  Fill
                </button>
              </div>
            </div>

            {/* Card Payment */}
            <div
              className={`space-y-2 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                partialPayment.cardAmount > 0
                  ? "bg-blue-50 border-blue-300"
                  : "bg-transparent border-transparent"
              }`}
            >
              <label
                className={`flex items-center gap-2 text-xs sm:text-sm font-medium ${
                  partialPayment.cardAmount > 0
                    ? "text-blue-700"
                    : "text-gray-700"
                }`}
              >
                <FaCreditCard
                  className={`text-sm sm:text-base ${
                    partialPayment.cardAmount > 0
                      ? "text-blue-600"
                      : "text-blue-500"
                  }`}
                />
                Card Amount
                {partialPayment.cardAmount > 0 && (
                  <span className="ml-auto text-blue-600 font-bold">
                    ✓ Selected
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={
                    partialPayment.cardAmount > 0
                      ? getNumericValue(partialPayment.cardAmount)
                      : ""
                  }
                  onChange={(e) => {
                    const parsed = parseCurrencyInput(e.target.value);
                    setPartialPayment((prev) => ({
                      ...prev,
                      cardAmount: parsed,
                    }));
                  }}
                  onBlur={(e) => {
                    const parsed = parseCurrencyInput(e.target.value);
                    const formatted = formatCurrency(parsed);
                    setPartialPayment((prev) => ({
                      ...prev,
                      cardAmount: formatted,
                    }));
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 sm:pl-10 pr-20 sm:pr-24 py-3 sm:py-3.5 text-base sm:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <button
                  onClick={() => {
                    const remaining = Math.max(
                      0,
                      total - paymentTotal + partialPayment.cardAmount
                    );
                    const formatted = formatCurrency(remaining);
                    setPartialPayment((prev) => ({
                      ...prev,
                      cardAmount: formatted,
                    }));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-md active:bg-blue-100 hover:bg-blue-100 transition-colors touch-manipulation whitespace-nowrap"
                >
                  Fill
                </button>
              </div>
            </div>

            {/* Wallet Payment */}
            <div
              className={`space-y-2 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                partialPayment.walletAmount > 0
                  ? "bg-purple-50 border-purple-300"
                  : "bg-transparent border-transparent"
              }`}
            >
              <label
                className={`flex items-center gap-2 text-xs sm:text-sm font-medium ${
                  partialPayment.walletAmount > 0
                    ? "text-purple-700"
                    : "text-gray-700"
                }`}
              >
                <FaWallet
                  className={`text-sm sm:text-base ${
                    partialPayment.walletAmount > 0
                      ? "text-purple-600"
                      : "text-purple-500"
                  }`}
                />
                <span className="hidden sm:inline">
                  Wallet/Mobile Banking Amount
                </span>
                <span className="sm:hidden">Wallet Amount</span>
                {partialPayment.walletAmount > 0 && (
                  <span className="ml-auto text-purple-600 font-bold">
                    ✓ Selected
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={
                    partialPayment.walletAmount > 0
                      ? getNumericValue(partialPayment.walletAmount)
                      : ""
                  }
                  onChange={(e) => {
                    const parsed = parseCurrencyInput(e.target.value);
                    setPartialPayment((prev) => ({
                      ...prev,
                      walletAmount: parsed,
                    }));
                  }}
                  onBlur={(e) => {
                    const parsed = parseCurrencyInput(e.target.value);
                    const formatted = formatCurrency(parsed);
                    setPartialPayment((prev) => ({
                      ...prev,
                      walletAmount: formatted,
                    }));
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 sm:pl-10 pr-20 sm:pr-24 py-3 sm:py-3.5 text-base sm:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
                <button
                  onClick={() => {
                    const remaining = Math.max(
                      0,
                      total - paymentTotal + partialPayment.walletAmount
                    );
                    const formatted = formatCurrency(remaining);
                    setPartialPayment((prev) => ({
                      ...prev,
                      walletAmount: formatted,
                    }));
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-md active:bg-purple-100 hover:bg-purple-100 transition-colors touch-manipulation whitespace-nowrap"
                >
                  Fill
                </button>
              </div>
            </div>
          </div>

          {/* Clear All Button */}
          {(partialPayment.cashAmount > 0 ||
            partialPayment.cardAmount > 0 ||
            partialPayment.walletAmount > 0) && (
            <button
              onClick={() => {
                setPartialPayment({
                  cashAmount: 0,
                  cardAmount: 0,
                  walletAmount: 0,
                });
              }}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2 sm:pb-0">
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setPartialPayment({
                  cashAmount: 0,
                  cardAmount: 0,
                  walletAmount: 0,
                });
              }}
              className="flex-1 px-4 py-3.5 sm:py-3 text-gray-700 bg-gray-100 rounded-lg active:bg-gray-200 hover:bg-gray-200 transition-colors font-medium text-base sm:text-sm touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={!isPaymentComplete || createOrderMutation.isPending}
              className={`flex-1 px-4 py-3.5 sm:py-3 text-white rounded-lg font-medium transition-all text-base sm:text-sm touch-manipulation ${
                isPaymentComplete
                  ? "bg-brand-primary active:bg-brand-hover hover:bg-brand-hover shadow-lg active:shadow-xl hover:shadow-xl"
                  : "bg-gray-400 cursor-not-allowed"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {createOrderMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="16px" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <FaCheckCircle />
                  <span>Complete Payment</span>
                </div>
              )}
            </button>
          </div>

          {/* Validation Messages */}
          {!isPaymentComplete && paymentTotal > 0 && (
            <div
              className={`p-3 rounded-lg ${
                isPaymentOver
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-2">
                <FaExclamationCircle
                  className={`mt-0.5 ${
                    isPaymentOver ? "text-yellow-600" : "text-red-600"
                  }`}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isPaymentOver ? "text-yellow-800" : "text-red-800"
                    }`}
                  >
                    {isPaymentOver
                      ? `Payment exceeds total by ${money.format(
                          paymentTotal - total
                        )}. Please adjust amounts.`
                      : `Payment incomplete. Please add ${money.format(
                          paymentRemaining
                        )} more to complete the payment.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default POS;
