import {
  BRANDS_URL,
  CATEGORY_URL,
  fetchProducts,
  UNITS_URL,
} from "@/api/api";
import AXIOS from "@/api/network/Axios";
import { useAuth } from "@/context/AuthContext";
import { Brand, Category, Unit } from "@/types/categoryType";
import {
  Product,
  ProductQueryParams,
  ProductVariant,
} from "@/types/ProductType";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp, FaFilter, FaSearch, FaSortAmountDown, FaSortAmountUp, FaInfoCircle } from "react-icons/fa";
import Spinner from "../Spinner";
import money from "@/utils/money";
import { formatCurrency, successToast } from "@/utils/utils";

import { CartAdjustments } from "./ShoppingCart";
import Pagination from "../Pagination";
import Modal from "../Modal";
import { VariantSelectionModal } from "./VariantSelectionModal";
import { CartItem } from "@/types/cartItemType";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";
import { useShopFilterOptions } from "@/hooks/useShopFilterOptions";
import Tooltip from "./Tooltip";

function CartProductSection({
  showMobileCart,
  cart,
  setCart,
  sku,
  setSku,
  //   adjustments,
  setAdjustments,
}: {
  showMobileCart?: boolean;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  adjustments: CartAdjustments;
  setAdjustments: React.Dispatch<React.SetStateAction<CartAdjustments>>;
  sku: string;
  setSku: React.Dispatch<React.SetStateAction<string>>;
}) {
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 100;

  // Filter states for API
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  // Permission checks
  const canCreateOrder = hasPermission(PERMISSIONS.SALES.CREATE_ORDER);

  const [searchKey, setSearchKey] = useState("");
  //   const [sku, setSku] = useState("");
  const [shopId, setShopId] = useState(user?.id?.toString() || "");

  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all"
  );

  const [selectedVariants, setSelectedVariants] = useState<
    Record<number, number>
  >({});

  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

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

  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

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
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

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
    sortBy,
    sortOrder,
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

  // Fetch Shops using custom hook
  const { shops, isLoading: isLoadingShops } = useShopFilterOptions();

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setPage(1);
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

  return (
    <>
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
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isFiltersExpanded ? "max-h-98 opacity-100" : "max-h-0 opacity-0"
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
                        shops
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

                  {/* Sorting Filter */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Sort By
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-transparent bg-white hover:border-gray-400 transition-colors">
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value);
                          handleFilterChange();
                        }}
                        className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                      >
                        <option value="createdAt">Date Created</option>
                        <option value="name">Name</option>
                        <option value="id">ID</option>
                        <option value="stock">Stock</option>
                        <option value="price">Price</option>
                        <option value="status">Status</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setSortOrder((prev) =>
                            prev === "ASC" ? "DESC" : "ASC"
                          );
                          handleFilterChange();
                        }}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border-l border-gray-300 transition-colors flex items-center justify-center"
                        title={
                          sortOrder === "ASC"
                            ? "Sort Ascending"
                            : "Sort Descending"
                        }
                      >
                        {sortOrder === "ASC" ? (
                          <FaSortAmountUp className="text-brand-primary h-4 w-4" />
                        ) : (
                          <FaSortAmountDown className="text-brand-primary h-4 w-4" />
                        )}
                      </button>
                    </div>
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
          className={`flex-1 p-4 overflow-y-auto ${isLoadingProducts || isLoadingCategories || isLoadingShops
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
                    <div className="p-2.5">
                      <div className="flex items-start gap-1 min-w-0 relative group/tooltip mb-0.5">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 text-ellipsis cursor-pointer break-words">
                          {product.name}
                        </h3>
                        <Tooltip content={product.name}>
                          <div className="group/icon cursor-help shrink-0 mt-0.5">
                            <FaInfoCircle className="text-gray-400 hover:text-brand-primary w-3 h-3" />
                          </div>
                        </Tooltip>
                      </div>

                      {/* Price Section with Discount Info */}
                      <div className="mt-1 space-y-0.5">
                        {product.discountType &&
                          Number(product.discountAmount || 0) > 0 &&
                          Number(product.salesPrice || 0) >
                          Number(product.price || 0) ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Sales Price with Strikethrough */}
                            <span className="text-[10px] text-gray-400 line-through">
                              {money.format(Number(product.salesPrice || 0))}
                            </span>
                            {/* Discount Badge */}
                            <span className="px-1 py-0.5 text-[9px] font-bold text-white bg-red-500 rounded">
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
                          <span className="text-base font-bold text-brand-primary">
                            {money.format(Number(product.price || 0))}
                          </span>
                        </div>
                      </div>

                      {/* Improved Variant Preview */}
                      {product.ProductVariants?.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[10px] text-gray-500">
                              Available variants:
                            </span>
                            <div className="flex items-center">
                              {product.ProductVariants.slice(0, 4).map(
                                (variant, index) => (
                                  <div
                                    key={index}
                                    className={`relative -ml-1 first:ml-0 group cursor-pointer transition-transform hover:scale-110 hover:z-10 ${selectedVariants[product.id] ===
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
                                      className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm"
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-gray-900 text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                      {variant.Color?.name} -{" "}
                                      {variant.Size?.name}
                                    </div>
                                    {/* Stock Badge */}
                                    {variant.quantity < 5 && (
                                      <span
                                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border border-white rounded-full"
                                        title={`Only ${variant.quantity} left`}
                                      />
                                    )}
                                  </div>
                                )
                              )}
                              {product.ProductVariants.length > 4 && (
                                <div className="relative -ml-1 group cursor-pointer">
                                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[9px] font-medium text-gray-600 shadow-sm hover:bg-gray-100">
                                    +{product.ProductVariants.length - 4}
                                  </div>
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-gray-900 text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                    {product.ProductVariants.length - 4} more
                                  </div>
                                  {/* Stock Badge */}
                                  {product.ProductVariants.slice(4).some(
                                    (v) => v.quantity < 5
                                  ) && (
                                      <span
                                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border border-white rounded-full"
                                        title="Some variants low stock"
                                      />
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${getTotalStock(product) > 10
                            ? "bg-green-500"
                            : getTotalStock(product) > 5
                              ? "bg-yellow-500"
                              : "bg-red-500"
                            }`}
                        />
                        <span className="text-[10px] text-gray-500">
                          {getTotalStock(product)} in stock
                        </span>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={getTotalStock(product) <= 0 || !canCreateOrder}
                        className="mt-2 w-full md:font-medium text-[10px] px-2 py-1 bg-brand-primary text-white rounded-md hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
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
    </>
  );
}

export default CartProductSection;
