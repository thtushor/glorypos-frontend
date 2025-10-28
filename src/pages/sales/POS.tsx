import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaSearch,
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaTrash,
  FaUser,
  FaCreditCard,
  FaMoneyBill,
  FaQrcode,
  FaTimes,
  // FaPercent,
  // FaDollarSign,
  // FaEdit,
} from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import { PRODUCT_URL, CATEGORY_URL, ORDERS_URL } from "@/api/api";
import Spinner from "@/components/Spinner";
import ScrollButton from "@/components/ScrollButton";
import Invoice from "@/components/Invoice";
import { successToast } from "@/utils/utils";
import Modal from "@/components/Modal";
import { ProductVariant } from "@/types/ProductType";
import { toast } from "react-toastify";
import { Size, Unit } from "@/types/categoryType";
import { Color } from "@/types/categoryType";

interface Product {
  id: number;
  name: string;
  price: number;
  productImage: string;
  CategoryId: number;
  stock: number;
  Unit: Unit;
  Category: {
    id: number;
    name: string;
  };
  ProductVariants: {
    id: number;
    sku: string;
    quantity: number;
    alertQuantity: number;
    imageUrl: string;
    status: string;
    ProductId: number;
    ColorId: number;
    SizeId: number;
    Size: Size;
    Color: Color;
  }[];
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
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
  const [adjustments, setAdjustments] = useState<CartAdjustments>({
    tax: { type: "percentage", value: 0 },
    discount: { type: "percentage", value: 0 },
    priceAdjustments: {},
  });

  const queryClient = useQueryClient();

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState({
    left: false,
    right: false,
  });

  // Fetch Products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<
    Product[]
  >({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await AXIOS.get(PRODUCT_URL);
      return response.data;
    },
  });

  // Fetch Categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await AXIOS.get(CATEGORY_URL);
      return response.data;
    },
  });

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        product.CategoryId === Number(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

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

  console.log(total);
  // Cart items count
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add this function to check scroll buttons visibility
  const checkScrollButtons = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        categoryScrollRef.current;
      setShowScrollButtons({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth - 10, // 10px buffer
      });
    }
  };

  // Add scroll handlers
  const handleScroll = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200; // Adjust this value as needed
      const newScrollLeft =
        direction === "left"
          ? categoryScrollRef.current.scrollLeft - scrollAmount
          : categoryScrollRef.current.scrollLeft + scrollAmount;

      categoryScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  // Add useEffect to initialize and update scroll buttons
  useEffect(() => {
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, []);

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
      };

      const response = await AXIOS.post(ORDERS_URL, orderData);
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentOrder(data);
      setShowInvoice(true);
      setCart([]);
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
    createOrderMutation.mutate(cart);
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

  if (isLoadingProducts || isLoadingCategories) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-5rem)]">
        <Spinner color="#32cd32" size="40px" />
      </div>
    );
  }

  return (
    <div className=" flex flex-col lg:flex-row gap-6 relative">
      {/* Products Section */}
      <div
        className={`flex-1 flex flex-col  bg-white rounded-lg shadow overflow-hidden ${
          showMobileCart ? "hidden xl:flex" : "flex"
        }`}
      >
        {/* Search and Categories */}
        <div className="p-4 border-b space-y-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="relative flex items-center">
            {/* Left Scroll Button */}
            {showScrollButtons.left && (
              <ScrollButton
                direction="left"
                onClick={() => handleScroll("left")}
              />
            )}

            {/* Categories Container */}
            <div
              ref={categoryScrollRef}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide scroll-smooth mx-8"
              onScroll={checkScrollButtons}
            >
              <button
                key="all"
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-brand-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All Products
              </button>
              {categories.map((category: any) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id.toString())}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === category.id.toString()
                      ? "bg-brand-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Right Scroll Button */}
            {showScrollButtons.right && (
              <ScrollButton
                direction="right"
                onClick={() => handleScroll("right")}
              />
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className={`flex-1 p-4 overflow-y-auto `}>
          <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
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
                                className={`relative -ml-1 first:ml-0 group cursor-pointer transition-transform hover:scale-110 hover:z-10 ${
                                  selectedVariants[product.id] === variant.id
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

          {/* Payment Methods */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handlePayment("card")}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover"
              disabled={createOrderMutation.isPending}
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
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={createOrderMutation.isPending}
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

          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900">
            <FaQrcode className="w-5 h-5" />
            <span>Scan QR Code</span>
          </button>
        </div>
      </div>

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
    </div>
  );
};

export default POS;
