import { useState, useMemo, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaEye, FaBarcode } from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import {
  DELETE_PRODUCT_URL,
  CATEGORY_URL,
  BRANDS_URL,
  UNITS_URL,
  fetchProducts,
} from "@/api/api";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import AddProduct from "@/components/shared/AddProduct";
import {
  Product,
  ProductFormData,
  ProductQueryParams,
} from "@/types/ProductType";
import { Brand, Unit } from "@/types/categoryType";
import { Category } from "@/types/categoryType";
import BarcodeModal from "@/components/BarcodeModal";
import InventoryFilters from "@/components/shared/InventoryFilters";
import { useAuth } from "@/context/AuthContext";
import money from "@/utils/money";
import ProductImageSlider from "@/components/shared/ProductImageSlider";

// Add this interface at the top

// Add this interface for the view modal
interface ViewModalProps {
  product: Product;
  onClose: () => void;
}

// Add this interface for the barcode modal

const Products: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const currentShopId = user?.child?.id ?? user?.id;
  const hasAppliedDefaultShop = useRef(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filter states for API
  const [searchKey, setSearchKey] = useState("");
  const [shopId, setShopId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all"
  );
  const [selectedBrand, setSelectedBrand] = useState<number | "all">("all");
  const [selectedUnit, setSelectedUnit] = useState<number | "all">("all");

  useEffect(() => {
    if (!hasAppliedDefaultShop.current && currentShopId) {
      setShopId(String(currentShopId));
      hasAppliedDefaultShop.current = true;
    }
  }, [currentShopId]);

  // Price range filter for API
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({
    min: undefined,
    max: undefined,
  });

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    id: undefined,
    code: null,
    sku: "",
    name: "",
    description: "",
    CategoryId: 0,
    BrandId: 0,
    UnitId: 0,
    ColorId: 0,
    SizeId: 0,
    alertQuantity: 0,
    productImage: "",
    discountType: null,
    discountAmount: null,
    purchasePrice: 0,
    salesPrice: 0,
    vat: 0,
    price: 0,
    stock: 0,
    status: "active",
  });

  // Add state for selected variant
  const [selectedVariants, setSelectedVariants] = useState<
    Record<number, number>
  >({});

  // Build query parameters
  const queryParams: ProductQueryParams = useMemo(() => {
    const params: ProductQueryParams = {
      page,
      pageSize,
    };

    if (searchKey) params.searchKey = searchKey;
    if (shopId) params.shopId = shopId;
    if (selectedCategory !== "all") params.categoryId = selectedCategory;
    if (selectedBrand !== "all") params.brandId = selectedBrand;
    if (selectedUnit !== "all") params.unitId = selectedUnit;

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
      params.maxPrice = priceRange?.max;
    }

    return params;
  }, [
    page,
    pageSize,
    searchKey,
    shopId,
    selectedCategory,
    selectedBrand,
    selectedUnit,
    priceRange,
  ]);

  // Products query with pagination
  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", queryParams],
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

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await AXIOS.get(CATEGORY_URL);
      return response.data;
    },
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await AXIOS.get(BRANDS_URL);
      return response.data;
    },
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await AXIOS.get(UNITS_URL);
      return response.data;
    },
  });

  const deleteMutation = useMutation<any, Error, number>({
    mutationFn: (id: number) => AXIOS.post(`${DELETE_PRODUCT_URL}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete product");
    },
  });

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setPage(1);
  };

  // Handlers

  const handleEdit = (product: Product) => {
    setFormData({
      id: product.id,
      code: product.code,
      sku: product.sku,
      name: product.name,
      description: product.description,
      CategoryId: product.CategoryId,
      BrandId: product.BrandId,
      UnitId: product.UnitId,
      SizeId: product.SizeId,
      ColorId: product.ColorId,
      alertQuantity: product.alertQuantity,
      productImage: product.productImage || "",
      productImages:
        (product as any).productImages ||
        (product.productImage ? [product.productImage] : []),
      images: product.images || (product.images ? [product.images] : []),
      discountType: product.discountType,
      discountAmount: product.discountAmount,
      purchasePrice: product.purchasePrice,
      salesPrice: product.salesPrice,
      vat: product.vat,
      price: product.price,
      stock: product.stock,
      status: product.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      id: undefined,
      code: null,
      sku: "",
      name: "",
      description: "",
      CategoryId: 0,
      BrandId: 0,
      UnitId: 0,
      SizeId: 0,
      ColorId: 0,
      alertQuantity: 0,
      productImage: "",
      discountType: null,
      discountAmount: null,
      purchasePrice: 0,
      salesPrice: 0,
      vat: 0,
      price: 0,
      stock: 0,
      status: "active",
    });
  };

  // Add this state for the view modal
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // Add this component for the view modal

  // Update the product card JSX
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Products</h1>
          <p className="text-sm text-gray-600">Manage your products</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover flex items-center gap-2"
        >
          <FaPlus /> Add Product
        </button>
      </div>

      {/* API Filters */}
      <InventoryFilters
        searchKey={searchKey}
        shopId={shopId}
        onSearchKeyChange={(value) => {
          setSearchKey(value);
          handleFilterChange();
        }}
        onShopIdChange={(value) => {
          setShopId(value);
          handleFilterChange();
        }}
        searchPlaceholder="Search products..."
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedCategory(value === "all" ? "all" : Number(value));
            handleFilterChange();
          }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={selectedBrand}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedBrand(value === "all" ? "all" : Number(value));
            handleFilterChange();
          }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">All Brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>

        <select
          value={selectedUnit}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedUnit(value === "all" ? "all" : Number(value));
            handleFilterChange();
          }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">All Units</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>

        {/* Price Range */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Min"
            value={priceRange?.min}
            onChange={(e) => {
              setPriceRange({
                ...priceRange,
                min: Number(e.target.value) || undefined,
              });
              handleFilterChange();
            }}
            className="border rounded-lg px-3 py-2 w-24"
          />
          <span>-</span>
          <input
            type="text"
            placeholder="Max"
            value={priceRange?.max}
            onChange={(e) => {
              setPriceRange({
                ...priceRange,
                max: Number(e.target.value) || undefined,
              });
              handleFilterChange();
            }}
            className="border rounded-lg px-3 py-2 w-24"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoadingProducts ? (
          <div className="col-span-full flex justify-center py-8">
            <Spinner color="#32cd32" size="40px" />
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No products found
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Product Image Section */}
              <div className="relative aspect-square overflow-hidden">
                {/* <img
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
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                /> */}

                <ProductImageSlider images={product?.images || []} />

                {/* Action Buttons Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => setViewProduct(product)}
                    className="p-2 bg-white rounded-full hover:bg-brand-primary hover:text-white transition-colors"
                    title="View Details"
                  >
                    <FaEye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 bg-white rounded-full hover:bg-brand-primary hover:text-white transition-colors"
                    title="Edit Product"
                  >
                    <FaEdit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-white rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    title="Delete Product"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Category: {product.Category?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Brand: {product.Brand?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Shop:{" "}
                    {product.User?.businessName ||
                      product.User?.fullName ||
                      "N/A"}{" "}
                    (ID: {product.User?.id || product.UserId || "N/A"})
                  </p>

                  {/* Detailed Pricing Section */}
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Sales Price:
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        {money.format(Number(product.salesPrice || 0))}
                      </span>
                    </div>
                    {product.discountType &&
                      Number(product.discountAmount || 0) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Discount:
                          </span>
                          <span className="text-xs font-medium text-red-600">
                            {product.discountType === "percentage"
                              ? `${product.discountAmount}%`
                              : money.format(
                                  Number(product.discountAmount || 0)
                                )}
                          </span>
                        </div>
                      )}
                    {Number(product.vat || 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">VAT:</span>
                        <span className="text-xs font-medium text-gray-700">
                          {money.format(Number(product.vat || 0))}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-900">
                        Final Price:
                      </span>
                      <span className="text-sm font-bold text-brand-primary">
                        {money.format(Number(product.price || 0))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variant Preview */}
                {product.ProductVariants?.length > 0 && (
                  <div className="mt-3 flex -space-x-2">
                    {product.ProductVariants.slice(0, 3).map((variant) => (
                      <img
                        key={variant.id}
                        src={variant.imageUrl}
                        alt={`Variant ${variant.sku}`}
                        onClick={() =>
                          setSelectedVariants({
                            [product.id]: variant.id,
                          })
                        }
                        className={`w-8 h-8 rounded-full border-2 border-white object-cover ${
                          selectedVariants[product.id] === variant.id
                            ? "border-brand-primary"
                            : ""
                        }`}
                      />
                    ))}
                    {product.ProductVariants.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                        +{product.ProductVariants.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
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

      {/* Product Form Modal */}
      <Modal
        isOpen={isModalOpen}
        className="lg:!max-w-[80vw] !max-w-[95vw]"
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={formData.id ? "Edit Product" : "Add Product"}
      >
        <AddProduct
          productData={formData}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* View Product Modal */}
      <Modal
        isOpen={!!viewProduct}
        onClose={() => setViewProduct(null)}
        title="Product Details"
        className="lg:!max-w-[80vw] !max-w-[95vw]"
      >
        {viewProduct && (
          <ViewProductModal
            product={viewProduct}
            onClose={() => setViewProduct(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Products;

export const ViewProductModal: React.FC<ViewModalProps> = ({ product }) => {
  const [selectedSku, setSelectedSku] = useState<{
    sku: string;
    name: string;
    price: number;
  } | null>(null);

  // Add this function to handle barcode printing
  const handlePrintBarcode = (sku: string, name: string, price: number) => {
    setSelectedSku({ sku, name, price });
  };

  const calculateTotalStock = () => {
    return (
      product.ProductVariants?.reduce(
        (acc, variant) => acc + variant.quantity,
        0
      ) || 0
    );
  };

  return (
    <div className="space-y-8">
      {/* Product Header - Made responsive */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image Section */}
        <div className="w-full md:w-1/3">
          <div className="relative group">
            <img
              src={product.productImage}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <a
                href={product.productImage}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white rounded-full hover:bg-brand-primary hover:text-white transition-colors"
              >
                <FaEye className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Product Info Section */}
        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {product.name}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {product.status}
              </span>
            </div>

            {/* Price and Stock Info */}
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-3 bg-brand-primary/10 rounded-lg">
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-xl font-bold text-brand-primary">
                  ${Number(product.price || 0).toFixed(2)}
                </p>
              </div>
              <div className="px-4 py-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">Stock</p>
                <p className="text-xl font-bold text-gray-800">
                  {calculateTotalStock() || product.stock}
                </p>
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">SKU</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{product.sku}</p>
                  <button
                    onClick={() =>
                      handlePrintBarcode(
                        product.sku,
                        product.name,
                        product.price
                      )
                    }
                    className="p-1.5 text-gray-600 hover:text-brand-primary hover:bg-gray-100 rounded-full transition-colors"
                    title="Print Barcode"
                  >
                    <FaBarcode className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium truncate">{product.Category?.name}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Brand</p>
                <p className="font-medium truncate">{product.Brand?.name}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Color</p>
                <p className="font-medium truncate">
                  {product.ProductVariants?.length > 0
                    ? [
                        ...new Set(
                          product.ProductVariants.map(
                            (item) => item?.Color?.name
                          )
                        ),
                      ].join(", ")
                    : product.Color?.name}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Size</p>
                <p className="font-medium truncate">
                  {product.ProductVariants?.length > 0
                    ? [
                        ...new Set(
                          product.ProductVariants.map(
                            (item) => item?.Size?.name
                          )
                        ),
                      ].join(", ")
                    : product.Size?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Description
            </h3>
            <p className="text-gray-600 whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Variants Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Product Variants
          </h3>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
            {product.ProductVariants?.length || 0} variants
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.ProductVariants?.map((variant) => (
            <div
              key={variant.id}
              className="bg-white  border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                <div className="relative group w-20 h-20 cursor-pointer">
                  <img
                    src={variant?.imageUrl || ""}
                    alt={`Variant ${variant.sku}`}
                    className="w-full h-full object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                    <a
                      href={variant?.imageUrl || ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white rounded-full hover:bg-brand-primary hover:text-white transition-colors"
                    >
                      <FaEye className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-800">
                        SKU: {variant.sku}
                      </h4>
                      <button
                        onClick={() =>
                          handlePrintBarcode(
                            variant.sku,
                            `${product.name} - ${variant.Color?.name} ${variant.Size?.name}`,
                            product.price
                          )
                        }
                        className="p-1.5 text-gray-600 hover:text-brand-primary hover:bg-gray-100 rounded-full transition-colors"
                        title="Print Barcode"
                      >
                        <FaBarcode className="w-4 h-4" />
                      </button>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        variant.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {variant.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Stock:</span>
                      <span className="font-medium">{variant.quantity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Color:</span>
                      <span className="font-medium flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: variant.Color?.code }}
                        />
                        {variant.Color?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">{variant.Size?.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Barcode Modal */}
      <Modal
        isOpen={!!selectedSku}
        onClose={() => setSelectedSku(null)}
        title="Print Barcode"
        className="max-w-md"
      >
        {selectedSku && (
          <BarcodeModal
            sku={selectedSku.sku}
            name={selectedSku.name}
            price={selectedSku.price}
            onClose={() => setSelectedSku(null)}
          />
        )}
      </Modal>
    </div>
  );
};
