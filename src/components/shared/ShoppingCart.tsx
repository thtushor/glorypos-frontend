import money from "@/utils/money";
import {
  filterNumericInput,
  formatCurrency,
  getNumericValue,
  parseCurrencyInput,
  successToast,
} from "@/utils/utils";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  FaCheckCircle,
  FaChevronDown,
  FaCreditCard,
  // FaExclamationCircle,
  FaMinus,
  // FaMoneyBill,
  FaPlus,
  FaQrcode,
  FaSearch,
  FaShoppingCart,
  FaTimes,
  FaTrash,
  FaUser,
  // FaUtensils,
  // FaWallet,
} from "react-icons/fa";
import Modal from "../Modal";
import AXIOS from "@/api/network/Axios";
import { CHILD_USERS_URL, ORDERS_URL, DELETE_ORDERS_URL } from "@/api/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Spinner from "../Spinner";
import ErrorBoundary from "../ErrorBoundary";
import BarcodeScanner from "../BarcodeScanner";
import { FaUserGear } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import Invoice from "../Invoice";
import { CartItem } from "@/types/cartItemType";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";
import PaymentModal, { PartialPayment } from "./PaymentModal";

export interface CartAdjustments {
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

function ShoppingCart({
  orderId,
  cart,
  setCart,
  adjustments,
  setAdjustments,
  showMobileCart,
  onClose,
  handleBarcodeScan,
  initialBarcodeOpen = false,
  onCloseBarcodeScanner,
  initialCustomerInfo,
  initialKOTInfo,
  initialPaymentInfo,
  initialStaffId = null,
  enableEnterSubmit = true,
  maxWidth = "xl:max-w-[450px]"
}: {
  cart: CartItem[];
  adjustments: CartAdjustments;
  setAdjustments: React.Dispatch<React.SetStateAction<CartAdjustments>>;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  showMobileCart: boolean;
  onClose: () => void;
  initialBarcodeOpen?: boolean;
  handleBarcodeScan: (value: string) => void;
  variant?: "dynamic" | "mobile" | "desktop";
  onCloseBarcodeScanner?: () => void;
  initialCustomerInfo?: { name: string; phone: string };
  orderId?: number;
  initialKOTInfo?: {
    tableNumber: string,
    specialInstructions: string,
    guestCount: number | string,
  }
  initialPaymentInfo?: PartialPayment;
  initialStaffId?: "self-sell" | number | null;
  enableEnterSubmit?: boolean;
  maxWidth?: string; // Tailwind class for max width (e.g., "xl:max-w-[450px]", "xl:max-w-[600px]", etc.)
}) {
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  // Permission checks
  const canCreateOrder = hasPermission(PERMISSIONS.SALES.CREATE_ORDER);
  const canEditOrder = hasPermission(PERMISSIONS.SALES.EDIT_ORDER);
  const canDeleteOrder = hasPermission(PERMISSIONS.SALES.DELETE_ORDER);

  const [customerInfo, setCustomerInfo] = useState({
    name: initialCustomerInfo?.name || "",
    phone: initialCustomerInfo?.phone || "",
  });

  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] =
    useState(initialBarcodeOpen);

  const queryClient = useQueryClient();

  const [showInvoice, setShowInvoice] = useState(false);

  const [kotData, setKotData] = useState({
    tableNumber: "",
    specialInstructions: "",
    guestCount: 1 as number | string,
  });

  const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null);

  const [partialPayment, setPartialPayment] = useState<PartialPayment>({
    cashAmount: 0,
    cardAmount: 0,
    walletAmount: 0,
  });

  const [selectedStaffId, setSelectedStaffId] = useState<
    number | "self-sell" | null
  >(initialStaffId);

  const [staffSearchKey, setStaffSearchKey] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("");

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  // Get sales price for an item (before discount)
  const getItemSalesPrice = useCallback(
    (item: CartItem): number => {
      return adjustments.salesPriceAdjustments[item.id];
    },
    [adjustments.salesPriceAdjustments]
  );

  // Calculate final price for an item based on sales price and discount
  const calculateItemFinalPrice = useCallback(
    (item: CartItem): number => {
      const salesPrice = getItemSalesPrice(item);

      // Get discount from adjustments or fallback to item's original discount
      const discount =
        adjustments.discountAdjustments[item.id] ||
        (item.discountType && Number(item.discountAmount || 0) > 0
          ? {
            type:
              (item.discountType as "percentage" | "amount") || "percentage",
            value: Number(item.discountAmount || 0),
          }
          : null);

      if (discount && discount.value > 0) {
        if (discount.type === "percentage") {
          const discountAmount = (salesPrice * discount.value) / 100;
          return formatCurrency(salesPrice - discountAmount);
        } else {
          // amount type
          return formatCurrency(salesPrice - discount.value);
        }
      }

      // If no discount, return the sales price
      return salesPrice;
    },
    [getItemSalesPrice, adjustments.discountAdjustments]
  );

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

  // Calculate totals with proper decimal handling
  const subtotal = useMemo(() => {
    const sum = cart.reduce((sum, item) => {
      const finalPrice = calculateItemFinalPrice(item);
      return sum + finalPrice * item.quantity;
    }, 0);
    return Math.round(sum * 100) / 100; // Round to 2 decimal places
  }, [cart, calculateItemFinalPrice]);

  const taxAmount = useMemo(() => {
    if (adjustments.tax.type === "percentage") {
      const tax = (subtotal * (Number(adjustments?.tax?.value || 0))) / 100;
      return Math.round(tax * 100) / 100; // Round to 2 decimal places
    }
    return Math.round((Number(adjustments?.tax?.value || 0)) * 100) / 100; // Round to 2 decimal places
  }, [subtotal, adjustments.tax]);

  const discountAmount = useMemo(() => {
    if (adjustments.discount.type === "percentage") {
      const discount = (subtotal * (Number(adjustments?.discount?.value || 0))) / 100;
      return Math.round(discount * 100) / 100; // Round to 2 decimal places
    }
    return Math.round((Number(adjustments?.discount?.value || 0)) * 100) / 100; // Round to 2 decimal places
  }, [subtotal, adjustments.discount]);

  const total = useMemo(() => {
    return Math.round((subtotal - discountAmount + taxAmount) * 100) / 100; // Round to 2 decimal places
  }, [subtotal, discountAmount, taxAmount]);

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

  const updateTax = (newTax?: number | string) => {
    const formattedTax = newTax
    setAdjustments((prev) => ({
      ...prev,
      tax: {
        type: prev.tax.type,
        value: newTax === "" ? "" :
          prev.tax.type === "percentage"
            ? Math.max(0, Math.min(100, Number(formattedTax) ?? 0))
            : Math.max(0, Number(formattedTax) ?? 0),
      },
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));

    // Clean up adjustments for removed item
    setAdjustments((prev) => {
      const newDiscountAdjustments = { ...prev.discountAdjustments };
      const newSalesPriceAdjustments = { ...prev.salesPriceAdjustments };
      delete newDiscountAdjustments[productId];
      delete newSalesPriceAdjustments[productId];

      return {
        ...prev,
        discountAdjustments: newDiscountAdjustments,
        salesPriceAdjustments: newSalesPriceAdjustments,
      };
    });
  };

  // Update item sales price
  const updateItemSalesPrice = (
    itemId: string | number,
    newSalesPrice: number | string
  ) => {
    const formattedPrice = formatCurrency(newSalesPrice);
    const key = typeof itemId === "string" ? Number(itemId) : itemId;

    console.log({ formattedPrice });
    setAdjustments((prev) => ({
      ...prev,
      salesPriceAdjustments: {
        ...prev.salesPriceAdjustments,
        [key]: newSalesPrice,
      },
    }));
  };

  // Update item discount
  const updateItemDiscount = (
    itemId: string | number,
    discountType: "percentage" | "amount",
    discountValue: number | string
  ) => {
    // const formattedValue = formatCurrency(discountValue);
    const key = typeof itemId === "string" ? Number(itemId) : itemId;
    setAdjustments((prev) => ({
      ...prev,
      discountAdjustments: {
        ...prev.discountAdjustments,
        [key]: {
          type: discountType,
          value: discountValue,
        },
      },
    }));
  };

  type CreateOrderVariables = {
    cartItems: CartItem[];
    kotPaymentStatus?: string;
  };

  // Add this mutation
  const createOrderMutation = useMutation({
    mutationFn: async ({ cartItems, kotPaymentStatus }: CreateOrderVariables) => {
      const orderTotal = total;
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
        tableNumber: kotData.tableNumber,
        guestNumber: kotData?.guestCount,
        orderId: orderId,
        specialNotes: kotData.specialInstructions,
        kotPaymentStatus: kotPaymentStatus,
        items: cartItems.map((item) => {
          // Get sales price (before discount) - this will be the unitPrice
          const salesPrice = getItemSalesPrice(item);

          // Get discount adjustment or use item's default discount
          const discount = adjustments.discountAdjustments[item.id] || {
            type: (item.discountType as "percentage" | "amount") || null,
            value: Number(item.discountAmount || 0),
          };

          return {
            orderItemId: item.orderItemId,
            productId: item.id,
            quantity: item.quantity,
            unitPrice: salesPrice, // Use sales price as unitPrice (before discount)
            discountType: discount?.type || null,
            discountAmount: discount?.value || 0,
            ...(item.selectedVariant && { variantId: item.selectedVariant.id }),
          };
        }),
        customerName: customerInfo.name || "Walk-in Customer",
        phone: customerInfo.phone || "",
        address: "",
        email: "",
        paymentStatus: "completed",
        paymentMethod: paymentMethod,
        orderStatus: "completed",
        tax: taxAmount,
        discount: discountAmount,
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
        salesPriceAdjustments: {},
        discountAdjustments: {},
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || error?.error || "Failed to create order");
    },
  });

  // Delete Order Mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderIdToDelete: number) => {
      const response = await AXIOS.post(`${DELETE_ORDERS_URL}/${orderIdToDelete}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Order deleted successfully");
      setCart([]);
      setAdjustments({
        tax: { type: "percentage", value: 0 },
        discount: { type: "percentage", value: 0 },
        priceAdjustments: {},
        salesPriceAdjustments: {},
        discountAdjustments: {},
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      // Optionally redirect or close modal
      // window.location.href = "/orders"; // Redirect to orders page
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete order");
    },
  });

  const updateDiscount = (newDiscount?: number | string) => {
    const formattedDiscount = newDiscount
    setAdjustments((prev) => ({
      ...prev,
      discount: {
        type: prev.discount.type,
        value: newDiscount === "" ? "" :
          prev.discount.type === "percentage"
            ? Math.max(0, Math.min(100, Number(formattedDiscount) ?? 0))
            : Math.max(0, Number(formattedDiscount) ?? 0),
      },
    }));
  };

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
      cashAmount: cart.length === 0 ? 0 : total,
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
    createOrderMutation.mutate({ cartItems: cart });
  };

  const handleProcessPrintKOT = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Require staff selection similar to payment flow
    if (selectedStaffId === null) {
      setShowStaffModal(true);
      toast.error("Please select staff or self sell before printing KOT");
      return;
    }

    // Create order for KOT with pending KOT payment status
    createOrderMutation.mutate({ cartItems: cart, kotPaymentStatus: "pending" });
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

  const handleDeleteOrder = () => {
    if (!orderId) {
      toast.error("No order ID found");
      return;
    }
    if (window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      deleteOrderMutation.mutate(orderId);
    }
  };


  useEffect(() => {
    if (!initialCustomerInfo) return;
    setCustomerInfo(initialCustomerInfo || { name: "", phone: "" });
  }, [initialCustomerInfo]);

  useEffect(() => {
    if (!initialKOTInfo) return;
    setKotData({
      ...initialKOTInfo,
      guestCount: typeof initialKOTInfo.guestCount === 'string'
        ? parseInt(initialKOTInfo.guestCount) || 1
        : initialKOTInfo.guestCount
    });
  }, [initialKOTInfo])

  useEffect(() => {
    if (!initialPaymentInfo) return;
    setPartialPayment(initialPaymentInfo);
  }, [initialPaymentInfo])


  useEffect(() => {
    if (!initialStaffId) return;
    setSelectedStaffId(initialStaffId);
  }, [initialStaffId])

  // Ref for cart section highlighting
  const cartSectionRef = useRef<HTMLDivElement>(null);

  // Global Enter key handler for cart flow
  useEffect(() => {
    if (!enableEnterSubmit) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Enter is pressed and not in a textarea or input
      if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        const isTextarea = target.tagName === "TEXTAREA";
        const isInput = target.tagName === "INPUT" && (target as HTMLInputElement).type !== "submit";
        const isSelect = target.tagName === "SELECT";
        
        // If focused on textarea, input, or select, allow normal behavior
        if (isTextarea || (isInput && !isSelect)) return;
        
        // Don't trigger if payment modal is handling it
        if (showPaymentModal) return;
        
        // Don't trigger if staff modal is open (let it handle its own Enter)
        if (showStaffModal) return;
        
        // Prevent default to avoid form submission conflicts
        e.preventDefault();

        // Flow 1: Check if cart is empty
        if (cart.length === 0) {
          toast.warn("Please add at least one product to the cart");
          // Highlight the cart section
          if (cartSectionRef.current) {
            cartSectionRef.current.classList.add("ring-4", "ring-yellow-400", "ring-opacity-75");
            setTimeout(() => {
              cartSectionRef.current?.classList.remove("ring-4", "ring-yellow-400", "ring-opacity-75");
            }, 2000);
            // Scroll to cart section
            cartSectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
          return;
        }

        // Flow 2: If cart has items, check staff selection
        if (selectedStaffId === null) {
          // Open staff modal
          setShowStaffModal(true);
          return;
        }

        // Flow 3: If staff is selected, open payment modal
        if (!showPaymentModal) {
          setPartialPayment({
            cashAmount: total,
            cardAmount: 0,
            walletAmount: 0,
          });
          setShowPaymentModal(true);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enableEnterSubmit, cart.length, selectedStaffId, showPaymentModal, showStaffModal, total]);

  // Refs for handlers to avoid stale closures
  const handleProcessPaymentRef = useRef(handleProcessPayment);
  const handleProcessPrintKOTRef = useRef(handleProcessPrintKOT);
  
  useEffect(() => {
    handleProcessPaymentRef.current = handleProcessPayment;
    handleProcessPrintKOTRef.current = handleProcessPrintKOT;
  }, [handleProcessPayment, handleProcessPrintKOT]);

  // Note: PaymentModal now handles its own Enter key logic based on restaurant type and hasNewProduct
  // ShoppingCart's payment modal Enter handler is disabled to avoid conflicts

  return (
    <>

      <div className={`lg:sticky lg:top-0 lg:h-[calc(100vh-6rem)] ${maxWidth} overflow-y-auto pb-10`}>
        <div
          className={` bg-white  rounded-lg shadow flex flex-col xl:flex ${showMobileCart ? "flex" : "hidden"
            }`}
        >
          {/* Mobile Cart Header */}
          <div className="xl:hidden flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-lg">Shopping Cart</h2>
            <button
              onClick={() => onClose()}
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
          <div ref={cartSectionRef} className="flex-1 p-4 overflow-y-auto transition-all duration-300">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FaShoppingCart className="w-8 h-8 mx-auto mb-2" />
                  <p>Cart is empty</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => {
                  // Use the helper function to get sales price (reactive)
                  const salesPrice = getItemSalesPrice(item);
                  const discount = adjustments.discountAdjustments[item.id] || {
                    type:
                      (item.discountType as "percentage" | "amount") ||
                      "percentage",
                    value: Number(item.discountAmount || 0),
                  };
                  const finalPrice = calculateItemFinalPrice(item);

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        {/* <h4 className="font-medium text-sm">{item.name}</h4> */}

                        {/* Product Title + Meta Info */}
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-gray-900 leading-tight">
                            {item?.name}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500">
                            {/* Category */}
                            {item?.selectedVariant?.Category?.name
                              ? item?.selectedVariant?.Category?.name
                              : item?.Category?.name && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-gray-600">
                                    Category:
                                  </span>
                                  {item?.selectedVariant?.Category?.name
                                    ? item?.selectedVariant?.Category?.name
                                    : item?.Category?.name}
                                </span>
                              )}

                            {/* Brand */}
                            {item?.Brand?.name && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium text-gray-600">
                                  Brand:
                                </span>
                                {item.Brand.name}
                              </span>
                            )}

                            {/* Color */}
                            {item?.selectedVariant?.Color?.name
                              ? item?.selectedVariant?.Color?.name
                              : item?.Color?.name && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-gray-600">
                                    Color:
                                  </span>
                                  <span
                                    className="w-3 h-3 rounded-full border"
                                    style={{
                                      backgroundColor: item?.selectedVariant
                                        ?.Color?.code
                                        ? item?.selectedVariant?.Color?.code
                                        : item?.Color?.code,
                                    }}
                                  />
                                  {item?.selectedVariant?.Color?.name
                                    ? item?.selectedVariant?.Color?.name
                                    : item?.Color?.name}
                                </span>
                              )}
                          </div>
                        </div>

                        {/* Sales Price Input */}
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 whitespace-nowrap">
                              Sales Price:
                            </label>
                            <div className="flex items-center gap-1 flex-1">
                              <span className="text-xs text-gray-500">฿</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={!canEditOrder}
                                value={getNumericValue(salesPrice)}
                                onChange={(e) => {
                                  const filtered = filterNumericInput(
                                    e.target.value
                                  );
                                  const parsed = filtered === "" ? "" : filtered;
                                  console.log({ parsed, filtered });
                                  updateItemSalesPrice(
                                    item.id || 0,
                                    parsed as string
                                  );
                                }}
                                onBlur={(e) => {
                                  const filtered = filterNumericInput(
                                    e.target.value
                                  );
                                  const parsed =
                                    filtered === ""
                                      ? 0
                                      : parseCurrencyInput(filtered);
                                  updateItemSalesPrice(
                                    item.id || 0,
                                    formatCurrency(parsed)
                                  );
                                }}
                                className=" w-[100px] min-w-0 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>

                          {/* Discount Input */}
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 ">
                              Discount:
                            </label>
                            <div className="flex items-center gap-1 flex-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={!canEditOrder}
                                value={getNumericValue(discount.value)}
                                onChange={(e) => {
                                  const filtered = filterNumericInput(
                                    e.target.value
                                  );
                                  const parsed =
                                    filtered === ""
                                      ? ""
                                      : parseCurrencyInput(filtered);

                                  console.log({ finalValue: parsed });
                                  // Validate max for percentage
                                  const maxValue =
                                    discount.type === "percentage"
                                      ? 100
                                      : undefined;
                                  const finalValue =
                                    maxValue && parsed && parsed > maxValue
                                      ? maxValue
                                      : parsed;
                                  updateItemDiscount(
                                    item.id || 0,
                                    discount.type,
                                    finalValue
                                  );
                                }}
                                onBlur={(e) => {
                                  const filtered = filterNumericInput(
                                    e.target.value
                                  );
                                  const parsed =
                                    filtered === ""
                                      ? ""
                                      : parseCurrencyInput(filtered);
                                  // Validate max for percentage
                                  const maxValue =
                                    discount.type === "percentage"
                                      ? 100
                                      : undefined;
                                  const finalValue =
                                    maxValue && parsed && parsed > maxValue
                                      ? maxValue
                                      : parsed;
                                  updateItemDiscount(
                                    item.id || 0,
                                    discount.type,
                                    formatCurrency(finalValue)
                                  );
                                }}
                                className="w-[50px] px-2 py-1 text-xs border rounded-l focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                              />
                              <select
                                value={discount.type}
                                disabled={!canEditOrder}
                                onChange={(e) => {
                                  updateItemDiscount(
                                    item.id || 0,
                                    e.target.value as "percentage" | "amount",
                                    discount.value
                                  );
                                }}
                                className="text-xs border-y border-r rounded-r bg-gray-50 px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                              >
                                <option value="percentage">%</option>
                                <option value="amount">฿</option>
                              </select>
                            </div>
                          </div>

                          {/* Final Price Display */}
                          <div className="flex items-center justify-between pt-1 border-t border-gray-300">
                            <span className="text-xs font-semibold text-gray-700">
                              Final Price:
                            </span>
                            <span className="text-sm font-bold text-brand-primary">
                              {money.format(finalPrice)}
                            </span>
                          </div>

                          {/* Quantity and Total */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-gray-500">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              Total: {money.format(finalPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 sm:gap-2 flex-shrink-0">
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
                          className="p-2 sm:p-1 text-red-500 active:bg-red-50 hover:bg-red-50 rounded touch-manipulation mt-1"
                          aria-label="Remove item"
                        >
                          <FaTrash className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                  <span>VAT</span>
                  <div className="flex items-center flex-1 sm:flex-initial">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={getNumericValue(adjustments?.tax?.value)}
                      onChange={(e) => {
                        const filtered = filterNumericInput(e.target.value);
                        const parsed =
                          filtered === ""
                            ? ""
                            : parseCurrencyInput(filtered);
                        // Validate max for percentage
                        const maxValue =
                          adjustments.tax.type === "percentage" ? 100 : undefined;
                        const finalValue =
                          maxValue && parsed !== undefined && parsed && parsed > maxValue
                            ? maxValue
                            : parsed;
                        updateTax(finalValue);
                      }}
                      onBlur={(e) => {
                        const filtered = filterNumericInput(e.target.value);
                        const parsed =
                          filtered === "" ? "" : parseCurrencyInput(filtered);
                        // Validate max for percentage
                        const maxValue =
                          adjustments.tax.type === "percentage" ? 100 : undefined;
                        const finalValue =
                          maxValue && parsed && parsed > maxValue ? maxValue : parsed;
                        updateTax(finalValue);
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
                      type="text"
                      inputMode="decimal"
                      value={getNumericValue(adjustments?.discount?.value)}
                      onChange={(e) => {
                        const filtered = filterNumericInput(e.target.value);
                        const parsed =
                          filtered === ""
                            ? ""
                            : parseCurrencyInput(filtered);
                        // Validate max for percentage
                        const maxValue =
                          adjustments.discount.type === "percentage"
                            ? 100
                            : undefined;
                        const finalValue =
                          maxValue && parsed !== undefined && parsed && parsed > maxValue
                            ? maxValue
                            : parsed;
                        updateDiscount(finalValue);
                      }}
                      onBlur={(e) => {
                        const filtered = filterNumericInput(e.target.value);
                        const parsed =
                          filtered === "" ? "" : parseCurrencyInput(filtered);
                        // Validate max for percentage
                        const maxValue =
                          adjustments.discount.type === "percentage"
                            ? 100
                            : undefined;
                        const finalValue =
                          maxValue && parsed && parsed > maxValue ? maxValue : parsed;
                        updateDiscount(finalValue);
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
                !canCreateOrder ||
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



            {/* Delete Order Button - Only shown when editing an existing order */}
            {orderId && canDeleteOrder && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleDeleteOrder}
                  disabled={deleteOrderMutation.isPending || !canDeleteOrder}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  {deleteOrderMutation.isPending ? (
                    <>
                      <Spinner size="16px" />
                      <span>Deleting Order...</span>
                    </>
                  ) : (
                    <>
                      <FaTrash className="w-4 h-4" />
                      <span>Delete Order</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* shopping cart */}

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
            className={`w-full text-left p-4 border-2 rounded-lg transition-all hover:shadow-md ${selectedStaffId === "self-sell"
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
                  className={`relative text-left p-3 border-2 rounded-lg transition-all hover:shadow-md hover:scale-[1.02] ${selectedStaffId === staff.id
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
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPartialPayment({
            cashAmount: 0,
            cardAmount: 0,
            walletAmount: 0,
          });
        }}
        total={total}
        partialPayment={partialPayment}
        setPartialPayment={setPartialPayment}
        kotData={kotData}
        setKotData={setKotData}
        onProcessPayment={handleProcessPayment}
        onProcessPrintKOT={handleProcessPrintKOT}
        isProcessing={createOrderMutation.isPending}
        enableEnterSubmit={enableEnterSubmit}
        hasNewProduct={(() => {
          // Check if there are items without orderItemId (new products added to existing order)
          // This means some items are new (no orderItemId) - mixed order scenario
          const itemsWithoutOrderItemId = cart.filter(item => !item.orderItemId);
          return itemsWithoutOrderItemId.length > 0;
        })()}
      />

      <Modal
        isOpen={isBarcodeScannerOpen}
        onClose={() => {
          onCloseBarcodeScanner?.();
          setIsBarcodeScannerOpen(false);
        }}
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
    </>
  );
}

export default ShoppingCart;
