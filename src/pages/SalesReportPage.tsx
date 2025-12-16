import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BRANDS_URL,
  CATEGORY_URL,
  COLORS_URL,
  SALES_REPORT_URL,
  UNITS_URL,
} from "@/api/api";
import AXIOS from "@/api/network/Axios";
import InventoryFilters from "@/components/shared/InventoryFilters";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import { Category, Brand, Unit, Color } from "@/types/categoryType";
import { useAuth } from "@/context/AuthContext";
import money from "@/utils/money";

type SalesReportFilters = {
  startDate: string;
  endDate: string;
  shopId: string;
  productSearch: string;
  categoryId: string;
  brandId: string;
  modelNo: string;
  colorId: string;
  unitId: string;
};

type Kpis = {
  todaySalesAmount: number;
  todayItemsSold: number;
  todayOrders: number;
  currentStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalProducts: number;
  totalCategories: number;
  totalBrands: number;
};

type ProductRow = {
  productId: number;
  name: string;
  sku: string;
  categoryId: number | null;
  categoryName: string | null;
  brandId: number | null;
  brandName: string | null;
  modelNo: string | null;
  stockQty: number;
  salesQty: number;
  salesAmount: number;
  hasVariants: boolean;
  variants: VariantRow[];
};

type VariantRow = {
  variantId: number;
  sku: string;
  productId: number;
  productName: string;
  colorName: string | null;
  sizeName: string | null;
  stockQty: number;
  salesQty: number;
  salesAmount: number;
  stockStatus: string;
};

type PaginatedView<T> = {
  page: number;
  pageSize: number;
  total: number;
  rows: T[];
};

type TimeSeriesPoint = {
  date: string;
  salesAmount: number;
  itemsSold: number;
  orders: number;
};

type SimpleAggRow = {
  categoryId?: number;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  productsCount: number;
  stockQty: number;
  salesQty: number;
  salesAmount: number;
};

type SalesReportResponse = {
  status: boolean;
  message: string;
  data: {
    filtersUsed: {
      startDate: string;
      endDate: string;
      productSearch: string | null;
      variantSearch: string | null;
      categoryId: number | null;
      brandId: number | null;
      modelNo: string | null;
      colorId: number | null;
      unitId: number | null;
      shopId?: string | number;
    };
    kpis: Kpis;
    productView: PaginatedView<ProductRow>;
    variantView: PaginatedView<VariantRow>;
    timeSeries: {
      byDate: TimeSeriesPoint[];
    };
    categoryView: {
      totalCategories: number;
      rows: SimpleAggRow[];
    };
    brandView: {
      totalBrands: number;
      rows: SimpleAggRow[];
    };
    modelView: {
      totalModels: number;
      rows: any[];
    };
  };
};

async function fetchSalesReport(filters: SalesReportFilters): Promise<any> {
  const params: Record<string, any> = {};

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.shopId) params.shopId = filters.shopId;
  if (filters.productSearch) params.productSearch = filters.productSearch;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.brandId) params.brandId = filters.brandId;
  if (filters.modelNo) params.modelNo = filters.modelNo;
  if (filters.colorId) params.colorId = filters.colorId;
  if (filters.unitId) params.unitId = filters.unitId;

  const response = await AXIOS.get(SALES_REPORT_URL, {
    params,
  });

  return response;
}

export default function SalesReportPage() {
  const { user } = useAuth();
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const defaultFilters: SalesReportFilters = {
    startDate: thirtyDaysAgo.toISOString(),
    endDate: today.toISOString(),
    shopId: user?.child?.id?.toString() ?? user?.id?.toString() ?? "",
    productSearch: "",
    categoryId: "",
    brandId: "",
    modelNo: "",
    colorId: "",
    unitId: "",
  };

  const [filters, setFilters] = useState<SalesReportFilters>(defaultFilters);

  const {
    data: report,
    isLoading,
    isFetching,
    error,
  } = useQuery<SalesReportResponse>({
    queryKey: ["sales-report", filters],
    queryFn: () => fetchSalesReport(filters),
  });

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

  const { data: colors = [] } = useQuery<Color[]>({
    queryKey: ["colors"],
    queryFn: async () => {
      const response = await AXIOS.get(COLORS_URL);
      return response.data;
    },
  });

  const kpis = report?.data?.kpis;
  const timeSeries = report?.data?.timeSeries?.byDate ?? [];
  const productRows = report?.data?.productView?.rows ?? [];
  const variantRows = report?.data?.variantView?.rows ?? [];
  const categoryRows = report?.data?.categoryView?.rows ?? [];
  const brandRows = report?.data?.brandView?.rows ?? [];

  const dateRangeLabel = useMemo(() => {
    if (!filters.startDate || !filters.endDate) return "Custom Range";
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }, [filters.startDate, filters.endDate]);

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    setFilters((prev) => ({
      ...prev,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }));
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Sales & Inventory Analytics
          </h1>
          <p className="text-sm text-gray-600">
            Deep insights into sales performance, stock health and product
            trends.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm border">
            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
            {isFetching ? "Refreshing..." : "Live analytics"}
          </span>
          <span className="text-xs text-gray-500 text-right">
            Range: {dateRangeLabel}
          </span>
        </div>
      </div>

      {/* Top Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 mb-5 space-y-4">
        <InventoryFilters
          searchKey={filters.productSearch}
          shopId={filters.shopId}
          onSearchKeyChange={(value) =>
            setFilters((prev) => ({ ...prev, productSearch: value }))
          }
          onShopIdChange={(value) =>
            setFilters((prev) => ({ ...prev, shopId: value }))
          }
          searchPlaceholder="Search by product name, SKU..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 md:gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate.slice(0, 10)}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: new Date(e.target.value).toISOString(),
                }))
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate.slice(0, 10)}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: new Date(e.target.value).toISOString(),
                }))
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Category
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  categoryId: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Brand
            </label>
            <select
              value={filters.brandId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, brandId: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Unit
            </label>
            <select
              value={filters.unitId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, unitId: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">All Units</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Color
            </label>
            <select
              value={filters.colorId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, colorId: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">All Colors</option>
              {colors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model No */}
    <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Model No
            </label>
            <input
              type="text"
              value={filters.modelNo}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, modelNo: e.target.value }))
              }
              placeholder="Model number"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Quick ranges */}
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => handleQuickRange(1)}
            className="px-3 py-1.5 text-xs rounded-full border bg-white hover:bg-gray-100 transition"
          >
            Today
          </button>
          <button
            onClick={() => handleQuickRange(7)}
            className="px-3 py-1.5 text-xs rounded-full border bg-white hover:bg-gray-100 transition"
          >
            Last 7 days
          </button>
          <button
            onClick={() => handleQuickRange(30)}
            className="px-3 py-1.5 text-xs rounded-full border bg-white hover:bg-gray-100 transition"
          >
            Last 30 days
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <Spinner color="#32cd32" size="40px" />
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          Failed to load sales report. Please adjust filters or try again.
        </div>
      )}

      {!isLoading && report && (
        <div className="space-y-6">
          {/* KPI Cards */}
          {kpis && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard
                title="Today's Sales"
                value={kpis.todaySalesAmount}
                format="currency"
                accent="emerald"
              />
              <KpiCard
                title="Items Sold"
                value={kpis.todayItemsSold}
                accent="blue"
              />
              <KpiCard
                title="Orders"
                value={kpis.todayOrders}
                accent="violet"
              />
              <KpiCard
                title="Current Stock"
                value={kpis.currentStock}
                accent="amber"
              />
              <KpiCard
                title="Low Stock"
                value={kpis.lowStockCount}
                accent="orange"
              />
              <KpiCard
                title="Out of Stock"
                value={kpis.outOfStockCount}
                accent="red"
              />
              <KpiCard
                title="Total Products"
                value={kpis.totalProducts}
                accent="indigo"
              />
              <KpiCard
                title="Total Categories"
                value={kpis.totalCategories}
                accent="cyan"
              />
              <KpiCard
                title="Total Brands"
                value={kpis.totalBrands}
                accent="tomatoes"
              />
            </div>
          )}

          {/* Sales over time */}
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Sales Over Time
              </h2>
              <span className="text-xs text-gray-500">
                {timeSeries.length} data points
              </span>
            </div>
            {timeSeries.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                No sales data for this period.
              </div>
            ) : (
              <div className="relative h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={timeSeries.map((point) => ({
                      name: new Date(point.date).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" }
                      ),
                      sales: point.salesAmount,
                      itemsSold: point.itemsSold,
                      orders: point.orders,
                    }))}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#32cd32"
                      fill="#32cd32"
                      fillOpacity={0.15}
                      name="Sales"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category & brand summary */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                All Categories Overview
              </h2>
              <p className="text-[11px] text-gray-500 mb-2">
                Longer bars indicate higher sales for this category in the selected period.
              </p>
              {categoryRows.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No category breakdown for this period.
                </p>
              ) : (
                <div className="max-h-64 overflow-auto pr-1 custom-scrollbar">
                  <ul className="space-y-3">
                    {categoryRows.map((cat) => (
                      <li
                        key={cat.categoryId}
                        className="text-xs rounded-lg border border-gray-100 px-3 py-2 bg-gray-50/60"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {cat.categoryName}
                          </span>
                          <span className="font-semibold text-emerald-600">
                            {money.format(Number(cat.salesAmount || 0))}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
                          <span>
                            Products:{" "}
                            <span className="font-medium">
                              {cat.productsCount}
                            </span>
                          </span>
                          <span>
                            Items sold:{" "}
                            <span className="font-medium">{cat.salesQty}</span>
                          </span>
                          <span>
                            Stock qty:{" "}
                            <span className="font-medium">{cat.stockQty}</span>
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                          {(() => {
                            const maxSales = Math.max(
                              ...categoryRows.map((c) => c.salesAmount || 0)
                            );
                            const width =
                              maxSales > 0
                                ? (Number(cat.salesAmount || 0) / maxSales) *
                                  100
                                : 0;
                            return (
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-brand-primary"
                                style={{ width: `${width}%` }}
                              />
                            );
                          })()}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Brands */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                All Brands Overview
              </h2>
              <p className="text-[11px] text-gray-500 mb-2">
                Longer bars indicate higher sales for this brand in the selected period.
              </p>
              {brandRows.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No brand breakdown for this period.
                </p>
              ) : (
                <div className="max-h-64 overflow-auto pr-1 custom-scrollbar">
                  <ul className="space-y-3">
                    {brandRows.map((brand) => (
                      <li
                        key={brand.brandId}
                        className="text-xs rounded-lg border border-gray-100 px-3 py-2 bg-gray-50/60"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {brand.brandName}
                          </span>
                          <span className="font-semibold text-emerald-600">
                            {money.format(Number(brand.salesAmount || 0))}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
                          <span>
                            Products:{" "}
                            <span className="font-medium">
                              {brand.productsCount}
                            </span>
                          </span>
                          <span>
                            Items sold:{" "}
                            <span className="font-medium">{brand.salesQty}</span>
                          </span>
                          <span>
                            Stock qty:{" "}
                            <span className="font-medium">{brand.stockQty}</span>
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                          {(() => {
                            const maxSales = Math.max(
                              ...brandRows.map((b) => b.salesAmount || 0)
                            );
                            const width =
                              maxSales > 0
                                ? (Number(brand.salesAmount || 0) / maxSales) *
                                  100
                                : 0;
                            return (
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-brand-primary"
                                style={{ width: `${width}%` }}
                              />
                            );
                          })()}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Product & variant tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Products */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Product Performance
                </h2>
                <span className="text-xs text-gray-500">
                  {productRows.length} products
                </span>
              </div>
              <div className="overflow-auto custom-scrollbar max-h-[420px]">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">
                        Product
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">
                        Stock
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">
                        Sold
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">
                        Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {productRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-4 text-center text-gray-500"
                        >
                          No product data for this period.
                        </td>
                      </tr>
                    )}
                    {productRows.map((row) => (
                      <tr key={row.productId} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 line-clamp-1">
                              {row.name}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              SKU: {row.sku}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Model Name: {row.modelNo||"N/A"}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {row.categoryName} • {row.brandName}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {row.stockQty}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {row.salesQty}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-600 whitespace-nowrap">
                          {money.format(Number(row.salesAmount || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Variant Performance
                </h2>
                <span className="text-xs text-gray-500">
                  {variantRows.length} variants
                </span>
              </div>
              <div className="overflow-auto custom-scrollbar max-h-[420px]">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">
                        Variant
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">
                        Stock
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">
                        Sold
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">
                        Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {variantRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-4 text-center text-gray-500"
                        >
                          No variant data for this period.
                        </td>
                      </tr>
                    )}
                    {variantRows.map((row) => (
                      <tr key={row.variantId} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 line-clamp-1">
                              {row.productName}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              SKU: {row.sku}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {row.colorName} • {row.sizeName}
                            </span>
                            <span className="inline-flex mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                              {row.stockStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {row.stockQty}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {row.salesQty}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-600 whitespace-nowrap">
                          {money.format(Number(row.salesAmount || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Modal import usage to avoid TS removal warning */}
      <Modal isOpen={false} onClose={() => {}}>
        <div />
      </Modal>
    </div>
  );
}

type Accent =
  | "emerald"
  | "blue"
  | "violet"
  | "amber"
  | "orange"
  | "red"
  | "indigo"
  | "cyan"
  | "tomatoes";

interface KpiCardProps {
  title: string;
  value: number;
  format?: "number" | "currency";
  accent?: Accent;
}

const accentMap: Record<
  Accent,
  { bg: string; text: string; ring: string; pill: string }
> = {
  emerald: {
    bg: "from-emerald-50 to-emerald-100",
    text: "text-emerald-700",
    ring: "ring-emerald-100",
    pill: "bg-emerald-100 text-emerald-700",
  },
  blue: {
    bg: "from-sky-50 to-sky-100",
    text: "text-sky-700",
    ring: "ring-sky-100",
    pill: "bg-sky-100 text-sky-700",
  },
  violet: {
    bg: "from-violet-50 to-violet-100",
    text: "text-violet-700",
    ring: "ring-violet-100",
    pill: "bg-violet-100 text-violet-700",
  },
  amber: {
    bg: "from-amber-50 to-amber-100",
    text: "text-amber-700",
    ring: "ring-amber-100",
    pill: "bg-amber-100 text-amber-700",
  },
  orange: {
    bg: "from-orange-50 to-orange-100",
    text: "text-orange-700",
    ring: "ring-orange-100",
    pill: "bg-orange-100 text-orange-700",
  },
  red: {
    bg: "from-rose-50 to-rose-100",
    text: "text-rose-700",
    ring: "ring-rose-100",
    pill: "bg-rose-100 text-rose-700",
  },
  indigo: {
    bg: "from-indigo-50 to-indigo-100",
    text: "text-indigo-700",
    ring: "ring-indigo-100",
    pill: "bg-indigo-100 text-indigo-700",
  },
  cyan: {
    bg: "from-cyan-50 to-cyan-100",
    text: "text-cyan-700",
    ring: "ring-cyan-100",
    pill: "bg-cyan-100 text-cyan-700",
  },
  tomatoes: {
    bg: "from-red-50 to-red-100",
    text: "text-red-700",
    ring: "ring-red-100",
    pill: "bg-red-100 text-red-700",
  },
};

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  format = "number",
  accent = "emerald",
}) => {
  const styles = accentMap[accent];
  const display =
    format === "currency"
      ? money.format(Number(value || 0))
      : value.toLocaleString();

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${styles.bg} shadow-sm ring-1 ${styles.ring}`}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/50" />
      <div className="absolute -left-10 -bottom-10 h-24 w-24 rounded-full bg-white/40" />
      <div className="relative px-3 py-3 sm:px-4 sm:py-4 space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
          {title}
        </p>
        <p
          className={`text-lg sm:text-xl md:text-2xl font-semibold ${styles.text}`}
        >
          {display}
        </p>
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${styles.pill}`}
        >
          Live
        </span>
      </div>
    </div>
  );
};