import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FaSearch,
  FaFilter,
  FaDollarSign,
  FaUsers,
  FaChartLine,
} from "react-icons/fa";
// import { BiSpreadsheet } from "react-icons/bi";
import AXIOS from "@/api/network/Axios";
import { SUB_SHOPS_URL, CHILD_USERS_URL, COMMISSIONS_URL } from "@/api/api";
import Pagination from "@/components/Pagination";
import { toast } from "react-toastify";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/context/AuthContext";
import money from "@/utils/money";
import { useParams } from "react-router-dom";

interface CommissionItem {
  id: number;
  baseAmount: string;
  commissionAmount: string;
  commissionPercentage: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  OrderId: number;
  UserRoleId: number;
  UserId: number;
  staff: {
    id: number;
    fullName: string;
    email: string;
    phone: string | null;
    role: string;
  };
  shop: {
    id: number;
    businessName: string;
    fullName: string;
    email: string;
  };
  order: {
    id: number;
    orderNumber: string;
    total: string;
    orderDate: string;
    paidAmount: string;
    paymentStatus: string;
  };
}

// interface PaginationData {
//   page: number;
//   pageSize: number;
//   totalPages: number;
//   totalItems: number;
//   hasNextPage: boolean;
//   hasPreviousPage: boolean;
// }

// interface SummaryData {
//   totalCommission: number;
//   totalOrders: number;
//   averageCommission: string;
// }

// interface CommissionsResponse {
//   items: CommissionItem[];
//   summary: SummaryData;
//   pagination: PaginationData;
// }

interface FilterParams {
  page: number;
  pageSize: number;
  shopId?: number;
  staffId?: number;
  orderId?: number;
  minAmount?: number;
  maxAmount?: number;
  commissionAmount?: number;
  startDate?: string;
  endDate?: string;
  staffRole?: string;
}

const StaffCommissionsPage: React.FC = () => {
  const { user } = useAuth();
  const params = useParams<{ staffId?: string }>();
  const urlStaffId = params.staffId;

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    pageSize: 20,
    staffId: urlStaffId ? Number(urlStaffId) : undefined,
  });

  // Update staffId filter when URL param changes
  useEffect(() => {
    if (urlStaffId && filters.staffId !== Number(urlStaffId)) {
      setFilters(prev => ({ ...prev, staffId: Number(urlStaffId), page: 1 }));
    }
  }, [urlStaffId]);

  // Fetch Shops
  const { data: shopData, isLoading: isLoadingShops } = useQuery({
    queryKey: ["sub-shops-for-commissions-filter"],
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
    queryKey: ["active-staff-for-commissions-filter"],
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

  // Get unique staff roles
  const staffRoles = useMemo(() => {
    const roles = new Set<string>();
    activeStaffs.forEach((staff: any) => {
      if (staff.role) roles.add(staff.role);
    });
    return Array.from(roles);
  }, [activeStaffs]);

  // Build query parameters using useMemo
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page: filters.page,
      pageSize: filters.pageSize,
    };

    if (filters.shopId) params.shopId = filters.shopId;
    if (filters.staffId) params.staffId = filters.staffId;
    if (filters.orderId) params.orderId = filters.orderId;
    if (filters.minAmount !== undefined && filters.minAmount !== null)
      params.minAmount = filters.minAmount;
    if (filters.maxAmount !== undefined && filters.maxAmount !== null)
      params.maxAmount = filters.maxAmount;
    if (
      filters.commissionAmount !== undefined &&
      filters.commissionAmount !== null
    )
      params.commissionAmount = filters.commissionAmount;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.staffRole) params.staffRole = filters.staffRole;

    return params;
  }, [filters]);

  // Fetch Commissions Data
  const {
    data: commissionsData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["staff-commissions", queryParams],
    queryFn: async () => {
      try {
        const response = await AXIOS.get(COMMISSIONS_URL, {
          params: queryParams,
        });
        // Handle both response structures: { data: {...} } or { items: [...], ... }
        return response.data || response;
      } catch (error: any) {
        toast.error(error?.message || "Failed to fetch staff commissions");
        return {
          items: [],
          summary: {
            totalCommission: 0,
            totalOrders: 0,
            averageCommission: "0.00",
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

  // Extract data from response (handle both structures)
  const dataArray =
    commissionsData?.data?.items || commissionsData?.items || [];
  const summary = commissionsData?.data?.summary || commissionsData?.summary;
  const pagination = commissionsData?.data?.pagination ||
    commissionsData?.pagination || {
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: 0,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Calculate totals for table footer
  const totals = dataArray?.reduce(
    (acc: any, item: CommissionItem) => {
      acc.baseAmount += Number(item.baseAmount);
      acc.commissionAmount += Number(item.commissionAmount);
      return acc;
    },
    { baseAmount: 0, commissionAmount: 0 }
  );

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search can be implemented if API supports it
    // For now, we'll use it to filter by order number
    if (searchQuery) {
      const orderId = parseInt(searchQuery);
      if (!isNaN(orderId)) {
        setFilters((prev) => ({ ...prev, page: 1, orderId }));
      }
    }
  };

  const handleFilterChange = (name: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, page: 1, [name]: value || undefined }));
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Staff Commissions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage staff commission payments
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <form onSubmit={handleSearch} className="flex-1 md:w-80">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border rounded-lg transition-colors ${showFilters
                ? "bg-brand-primary text-white"
                : "hover:bg-gray-50 text-gray-600"
              }`}
            title="Toggle Filters"
          >
            <FaFilter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-700 mb-1">
                  Total Commission
                </h3>
                <p className="text-3xl font-bold text-blue-900">
                  {money.format(summary.totalCommission)}
                </p>
              </div>
              <div className="bg-blue-200 p-3 rounded-lg">
                <FaDollarSign className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-green-700 mb-1">
                  Total Orders
                </h3>
                <p className="text-3xl font-bold text-green-900">
                  {summary.totalOrders}
                </p>
              </div>
              <div className="bg-green-200 p-3 rounded-lg">
                <FaUsers className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-purple-700 mb-1">
                  Average Commission
                </h3>
                <p className="text-3xl font-bold text-purple-900">
                  {money.format(Number(summary.averageCommission))}
                </p>
              </div>
              <div className="bg-purple-200 p-3 rounded-lg">
                <FaChartLine className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Filter Options
            </h3>
            <p className="text-sm text-gray-500">
              Filter staff commissions by various criteria
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Shop Filter */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Shop
              </label>
              <select
                value={filters.shopId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "shopId",
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                disabled={isLoadingShops}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Shops</option>
                {isLoadingShops ? (
                  <option value="" disabled>
                    Loading shops...
                  </option>
                ) : (
                  [...(user?.id ? [{ id: user.id, ...user }] : []), ...shops]
                    .filter((shop: any) => shop?.id != null)
                    .map((shop: any) => (
                      <option key={shop.id} value={shop.id}>
                        {shop.businessName || shop.fullName}
                      </option>
                    ))
                )}
              </select>
            </div>

            {/* Staff Filter */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Staff Member
              </label>
              <select
                value={filters.staffId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "staffId",
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                disabled={isLoadingStaff || !!urlStaffId}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Staff</option>
                {isLoadingStaff ? (
                  <option value="" disabled>
                    Loading staff...
                  </option>
                ) : (
                  activeStaffs.map((staff: any) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullName} ({staff.role})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Staff Role Filter */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Staff Role
              </label>
              <select
                value={filters.staffRole || ""}
                onChange={(e) =>
                  handleFilterChange("staffRole", e.target.value)
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">All Roles</option>
                {staffRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Order ID Filter */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Order ID
              </label>
              <input
                type="number"
                placeholder="Filter by Order ID"
                value={filters.orderId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "orderId",
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Min Amount Filter */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Min Commission Amount
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Minimum amount"
                value={filters.minAmount || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "minAmount",
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Max Amount Filter */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Max Commission Amount
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Maximum amount"
                value={filters.maxAmount || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "maxAmount",
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Commission Amount Filter */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Exact Commission Amount
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Exact amount"
                value={filters.commissionAmount || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "commissionAmount",
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Start Date Filter */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
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

            {/* End Date Filter */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setFilters({
                  page: 1,
                  pageSize: 20,
                });
                setSearchQuery("");
              }}
              className="px-6 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Commissions Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Staff
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Shop
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Base Amount
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Commission %
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Commission Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center w-full">
                      <Spinner color="#32cd32" size="40px" />
                    </div>
                  </td>
                </tr>
              ) : !dataArray || dataArray.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-gray-500 text-sm"
                  >
                    No commission data found
                  </td>
                </tr>
              ) : (
                dataArray.map((item: CommissionItem) => {
                  const commissionAmount = Number(item.commissionAmount);
                  const baseAmount = Number(item.baseAmount);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="font-medium text-gray-900">
                          {item.order.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.staff.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.staff.email}
                          </div>
                          <div className="text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {item.staff.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.shop.businessName || item.shop.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.shop.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {money.format(baseAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {Number(item.commissionPercentage).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className="font-semibold text-green-600">
                          {money.format(commissionAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.order.paymentStatus === "completed"
                              ? "bg-green-100 text-green-800"
                              : item.order.paymentStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                          {item.order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {item.notes || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {totals && dataArray && dataArray.length > 0 && (
              <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-right text-sm font-bold text-gray-900"
                  >
                    Totals:
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    {money.format(totals.baseAmount)}
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                    {money.format(totals.commissionAmount)}
                  </td>
                  <td colSpan={2} className="px-6 py-4"></td>
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
    </div>
  );
};

export default StaffCommissionsPage;
