import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaSearch, FaFilter } from "react-icons/fa";
import { BiSpreadsheet } from "react-icons/bi";
import AXIOS from "@/api/network/Axios";
import Pagination from "@/components/Pagination";
import { toast } from "react-toastify";
import ProductStatement from "@/components/ProductStatement";
import Spinner from "@/components/Spinner";

interface StatementItem {
  id: number;
  quantity: number;
  unitPrice: string;
  purchasePrice: string;
  subtotal: string;
  tax: string;
  ProductId: number;
  ProductVariantId: number | null;
  Product: {
    id: number;
    name: string;
    sku: string;
    UserId: number;
    User?: {
      id: number;
      businessName: string;
      fullName: string;
    };
  };
  ProductVariant?: {
    sku: string;
    Color: {
      name: string;
    };
    Size: {
      name: string;
    };
  } | null;
  Order: {
    id: number;
    orderNumber: string;
    orderDate: string;
    customerName: string;
    total: string;
    subtotal: string;
    tax: string;
    paymentMethod: string;
    paymentStatus: string;
    UserId: number;
    User?: {
      id: number;
      businessName: string;
      fullName: string;
    };
    commissions?: Array<{
      id: number;
      commissionAmount: string;
      commissionPercentage: string;
      staff?: {
        id: number;
        fullName: string;
        email: string;
        role: string;
        parent?: {
          id: number;
          businessName: string;
          fullName: string;
        };
      };
    }>;
  };
}

interface PaginationData {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface SummaryData {
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalLoss: number;
  profitMargin: number;
  netProfit: number;
}

interface StatementResponse {
  statements: StatementItem[];
  summary: SummaryData;
  pagination: PaginationData;
}

interface FilterParams {
  page: number;
  pageSize: number;
  searchKey?: string;
  productId?: number;
  productVariantId?: number;
  startDate?: string;
  endDate?: string;
  productUserId?: number;
  userRoleId?: number;
  orderStartDate?: string;
  orderEndDate?: string;
}

const ProductStatementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    pageSize: 20,
  });

  // Build query parameters using useMemo (similar to POS.tsx)
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page: filters.page,
      pageSize: filters.pageSize,
    };

    if (filters.searchKey) params.searchKey = filters.searchKey;
    if (filters.productId) params.productId = filters.productId;
    if (filters.productVariantId)
      params.productVariantId = filters.productVariantId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.productUserId) params.productUserId = filters.productUserId;
    if (filters.userRoleId) params.userRoleId = filters.userRoleId;
    if (filters.orderStartDate) params.orderStartDate = filters.orderStartDate;
    if (filters.orderEndDate) params.orderEndDate = filters.orderEndDate;

    return params;
  }, [filters]);

  // Fetch Statement Data
  const {
    data: statementData,
    isLoading,
    isFetching,
  } = useQuery<StatementResponse>({
    queryKey: ["product-statement-page", queryParams],
    queryFn: async () => {
      try {
        const response = await AXIOS.get("/statement/products", {
          params: queryParams,
        });
        return response.data;
      } catch (error: any) {
        toast.error(error?.message || "Failed to fetch product statement");
        return {
          statements: [],
          summary: {
            totalSold: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            totalLoss: 0,
            profitMargin: 0,
            netProfit: 0,
          },
          pagination: {
            page: 1,
            pageSize: 20,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }
    },
  });

  // Extract data from response
  const dataArray = statementData?.statements || [];

  // Use API summary or calculate totals for table footer
  const totals = dataArray?.reduce(
    (acc: any, item: StatementItem) => {
      acc.quantity += item.quantity;
      acc.sales += Number(item.subtotal);
      acc.cost += Number(item.purchasePrice) * item.quantity;
      return acc;
    },
    { quantity: 0, sales: 0, cost: 0 }
  );

  // Use API summary data
  const apiSummary = statementData?.summary;

  // Calculate tax from statements if needed (since it's not in summary)
  const calculatedTax =
    dataArray?.reduce((acc: number, item: StatementItem) => {
      const orderTax = Number(item?.Order?.tax) || 0;
      const orderSubtotal = Number(item?.Order?.subtotal) || 1;
      const itemSubtotal = Number(item?.subtotal) || 0;
      const tax = Number(
        (orderTax * (itemSubtotal / orderSubtotal) || 0).toFixed(2)
      );
      return acc + tax;
    }, 0) || 0;

  const summary = apiSummary
    ? {
        totalSales: apiSummary.totalRevenue,
        totalProfit: apiSummary.totalProfit,
        totalLoss: apiSummary.totalLoss,
        totalTax: calculatedTax,
      }
    : {
        totalSales: 0,
        totalProfit: 0,
        totalLoss: 0,
        totalTax: 0,
      };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1, searchKey: searchQuery }));
  };

  const handleFilterChange = (name: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, page: 1, [name]: value }));
  };

  // Helper function to determine if order is Self or Shop
  const getSaleType = (
    item: StatementItem
  ): { type: "Self" | "Shop"; name: string } => {
    if (item.Order.UserId === item.Product.UserId) {
      return {
        type: "Self",
        name: `${
          item.Order?.User?.businessName ||
          item.Order?.User?.fullName ||
          "Unknown Shop"
        } (Self)`,
      };
    }
    return {
      type: "Shop",
      name: `Taken from - ${
        item.Product?.User?.businessName ||
        item.Product?.User?.fullName ||
        "Unknown Shop"
      }`,
    };
  };

  const pagination = statementData?.pagination || {
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: 0,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h1 className="text-2xl font-semibold">Product Statement</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <form onSubmit={handleSearch} className="flex-1 md:w-80">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border rounded-lg hover:bg-gray-50 transition-colors"
            title="Toggle Filters"
          >
            <FaFilter className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => {
              setIsOpen(true);
            }}
            className="p-2 border rounded-lg hover:bg-gray-50 transition-colors"
            title="Print Statement"
          >
            <BiSpreadsheet className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-700 mb-1">
              Total Sales
            </h3>
            <p className="text-2xl font-bold text-blue-800">
              ${summary.totalSales.toFixed(2)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-700 mb-1">
              Total Profit
            </h3>
            <p className="text-2xl font-bold text-green-800">
              ${summary.totalProfit.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-sm font-medium text-red-700 mb-1">
              Total Loss
            </h3>
            <p className="text-2xl font-bold text-red-800">
              ${summary.totalLoss.toFixed(2)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-sm font-medium text-purple-700 mb-1">
              Total Tax
            </h3>
            <p className="text-2xl font-bold text-purple-800">
              ${summary.totalTax.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-white rounded-lg shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Filter Options
            </h3>
            <p className="text-sm text-gray-500">
              Filter product statements by various criteria
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Product Filters */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Product ID
              </label>
              <input
                type="number"
                placeholder="Filter by Product ID"
                value={filters.productId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "productId",
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Product Variant ID
              </label>
              <input
                type="number"
                placeholder="Filter by Variant ID"
                value={filters.productVariantId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "productVariantId",
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Product Owner User ID
              </label>
              <input
                type="number"
                placeholder="Filter by Product Owner"
                value={filters.productUserId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "productUserId",
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Order Item Date Filters */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Order Item Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Order Item End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Order Date Filters */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Order Start Date
              </label>
              <input
                type="date"
                value={filters.orderStartDate || ""}
                onChange={(e) =>
                  handleFilterChange("orderStartDate", e.target.value)
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Order End Date
              </label>
              <input
                type="date"
                value={filters.orderEndDate || ""}
                onChange={(e) =>
                  handleFilterChange("orderEndDate", e.target.value)
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Staff/Commission Filter */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Commission User Role ID
              </label>
              <input
                type="number"
                placeholder="Filter by Commission UserRoleId"
                value={filters.userRoleId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "userRoleId",
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Filters orders with commissions for this UserRoleId
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setFilters({
                  page: 1,
                  pageSize: 20,
                });
                setSearchQuery("");
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Statement Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop/Self
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center w-full">
                      <Spinner color="#32cd32" size="40px" />
                    </div>
                  </td>
                </tr>
              ) : !dataArray || dataArray.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No statement data found
                  </td>
                </tr>
              ) : (
                dataArray.map((item: StatementItem) => {
                  const cost = Number(item.purchasePrice) * item.quantity;
                  const sales = Number(item.subtotal);
                  const profit = sales - cost;
                  const saleType = getSaleType(item);
                  const commissions = item.Order.commissions || [];

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.Order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.Order.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900">
                            {item.Product.name}
                            {item.ProductVariant && (
                              <span className="text-gray-500 ml-1">
                                - {item.ProductVariant.Color.name},{" "}
                                {item.ProductVariant.Size.name}
                              </span>
                            )}
                          </span>
                          <br />
                          <span className="text-xs text-gray-500">
                            SKU: {item.ProductVariant?.sku || item.Product.sku}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            saleType.type === "Self"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {saleType.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {commissions.length > 0 ? (
                          <div className="space-y-1">
                            {commissions.map((commission) => (
                              <div key={commission.id} className="text-xs">
                                <div className="font-medium text-gray-900">
                                  <span>
                                    <strong>Staff: </strong>
                                    {commission.staff?.fullName || "N/A"}
                                  </span>
                                </div>
                                <div className="font-medium text-gray-900">
                                  <span>
                                    <strong>Shop: </strong>
                                    {commission.staff?.parent?.businessName ||
                                      commission.staff?.parent?.fullName ||
                                      "N/A"}
                                  </span>
                                </div>
                                <div className="text-gray-500">
                                  $
                                  {Number(commission.commissionAmount).toFixed(
                                    2
                                  )}{" "}
                                  ({commission.commissionPercentage}%)
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            No commission
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        ${Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        ${cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        ${sales.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span
                          className={`font-medium ${
                            profit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ${profit.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {totals && dataArray && dataArray.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-3 text-right text-sm font-semibold text-gray-900"
                  >
                    Totals:
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    {totals.quantity}
                  </td>
                  <td className="px-6 py-3"></td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    ${totals.cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    ${totals.sales.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold">
                    <span
                      className={
                        totals.sales - totals.cost >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      ${(totals.sales - totals.cost).toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onPageChange={handlePageChange}
        />
      )}

      {/* Product Statement Modal for Printing */}
      <ProductStatement
        isOpen={isOpen}
        productId={filters.productId}
        productVariantId={filters.productVariantId}
        startDate={filters.startDate}
        endDate={filters.endDate}
        productUserId={filters.productUserId}
        userRoleId={filters.userRoleId}
        orderStartDate={filters.orderStartDate}
        orderEndDate={filters.orderEndDate}
        searchKey={filters.searchKey}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </div>
  );
};

export default ProductStatementPage;
