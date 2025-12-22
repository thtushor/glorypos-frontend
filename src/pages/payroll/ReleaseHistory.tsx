// src/pages/payroll/ReleaseHistory.tsx
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_HISTORY } from "@/api/api";
import Spinner from "@/components/Spinner";
import { FaCalendarAlt, FaPrint, FaEye, FaBuilding } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import money from "@/utils/money";
import { useReactToPrint } from "react-to-print";
import { CHILD_USERS_URL, SUB_SHOPS_URL } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { useParams, Link } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";
import Modal from "@/components/Modal";

interface Release {
  id: number;
  userId: number;
  salaryMonth: string;
  baseSalary: string;
  advanceAmount: string;
  bonusAmount: string;
  bonusDescription: string | null;
  loanDeduction: string;
  fineAmount: string;
  overtimeAmount: string;
  otherDeduction: string;
  netPayableSalary: string;
  paidAmount: string;
  status: string;
  releaseDate: string | null;
  releasedBy: number | null;
  shopId: number;
  calculationSnapshot: {
    advance: {
      remaining: number;
      totalTaken: number;
      deductedThisMonth: number;
      totalRepaidBefore: number;
    };
    commission?: {
      totalSales: number;
      commissionRate: string;
      commissionAmount: number;
    };
    presentDays: number;
    workingDays: number;
    perDaySalary: number;
    paidLeaveDays: number;
    salaryBreakdown: {
      due: number;
      paid: number;
      gross: number;
      netPayable: number;
      totalDeductions: number;
    };
    unpaidLeaveDays: number;
    unpaidLeaveDeduction: number;
  };
  createdAt: string;
  updatedAt: string;
  UserRole: {
    id: number;
    fullName: string;
    email: string;
    role: string;
    baseSalary: string;
    parent: {
      id: number;
      fullName: string;
      businessName: string;
    };
  };
  releaser: {
    id: number;
    fullName: string;
  } | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

interface ChildUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface ChildUsersResponse {
  status: boolean;
  message: string;
  users: ChildUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface SubShop {
  id: number;
  fullName: string;
  email: string;
  businessName: string;
  accountType: string;
}

interface SubShopResponse {
  users: SubShop[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

const ReleaseHistory = () => {
  const { hasPermission } = usePermission();
  const canViewOtherProfiles = hasPermission(PERMISSIONS.STAFF_PROFILE.VIEW_OTHER_PROFILES);

  const { user } = useAuth();
  const params = useParams<{ staffId?: string }>();
  const staffId = params.staffId;

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: "",
    startDate: "",
    endDate: "",
    status: "",
    userId: staffId || "",
    shopId: "",
    minAmount: "",
    maxAmount: "",
  });

  // Update userId filter when staffId changes
  useEffect(() => {
    if (staffId && filters.userId !== staffId) {
      setFilters(prev => ({ ...prev, userId: staffId, page: 1 }));
    }
  }, [staffId]);

  const [selectedPayslip, setSelectedPayslip] = useState<Release | null>(null);
  const payslipRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: payslipRef,
  });

  // Fetch all employees for the dropdown
  const { data: usersData, isLoading: loadingUsers } = useQuery<ChildUsersResponse>({
    queryKey: ["childUsers", "all"],
    queryFn: async () => {
      const res = await AXIOS.get(`${CHILD_USERS_URL}?page=1&pageSize=1000`);
      return res.data;
    },
  });

  const employees = usersData?.users || [];

  // Fetch all shops for the dropdown
  const { data: shopData, isLoading: isLoadingShops } = useQuery<SubShopResponse>({
    queryKey: ["sub-shops-for-filter"],
    queryFn: async () => {
      const response = await AXIOS.get(SUB_SHOPS_URL, {
        params: {
          page: 1,
          pageSize: 1000000,
        },
      });
      return response.data;
    },
  });

  const shops = shopData?.users || [];

  const { data, isLoading, error } = useQuery({
    queryKey: ["release-history", filters],
    queryFn: async () => {
      // Build params object, excluding empty values
      const params: Record<string, any> = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;
      if (filters.userId) params.userId = filters.userId;
      if (filters.shopId) params.shopId = filters.shopId;
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;

      const res = await AXIOS.get(PAYROLL_HISTORY, { params });
      return res.data;
    },
  });

  const releases: Release[] = data?.releases || [];
  const pagination: Pagination | undefined = data?.pagination;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm gap-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, email..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="RELEASED">Released</option>
            </select>
          </div>

          {/* Shop */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <FaBuilding className="inline" />
              Shop
            </label>
            <select
              value={filters.shopId}
              onChange={(e) =>
                setFilters({ ...filters, shopId: e.target.value, page: 1 })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              disabled={isLoadingShops}
            >
              <option value="">
                {isLoadingShops ? "Loading shops..." : "All Shops"}
              </option>
              {user?.id && (
                <option key={user.id} value={user.id}>
                  {(user as any)?.businessName ||
                    (user as any)?.fullName ||
                    "Current Shop"}
                </option>
              )}
              {shops.map((shop) =>
                shop?.id ? (
                  <option key={shop?.id} value={shop?.id}>
                    {shop.businessName || shop.fullName}
                  </option>
                ) : null
              )}
            </select>
          </div>

          {/* Employee */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <FiUser className="inline" />
              Employee
            </label>
            <select
              value={filters.userId}
              onChange={(e) =>
                setFilters({ ...filters, userId: e.target.value, page: 1 })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={loadingUsers || !!staffId}
            >
              <option value="">
                {loadingUsers ? "Loading employees..." : "All Employees"}
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Min Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Amount
            </label>
            <input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) =>
                setFilters({ ...filters, minAmount: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Amount
            </label>
            <input
              type="number"
              placeholder="999999"
              value={filters.maxAmount}
              onChange={(e) =>
                setFilters({ ...filters, maxAmount: e.target.value, page: 1 })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-4">
          <button
            onClick={() =>
              setFilters({
                page: 1,
                pageSize: 10,
                search: "",
                startDate: "",
                endDate: "",
                status: "",
                userId: "",
                shopId: "",
                minAmount: "",
                maxAmount: "",
              })
            }
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Loading / Error / Empty */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          Failed to load history
        </div>
      ) : releases.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-lg">
          No salary records found
        </div>
      ) : (
        /* Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Net Payable
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Due
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Released On
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {releases.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-emerald-50 transition duration-200"
                  >
                    {/* Employee */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div>
                        {canViewOtherProfiles ? (
                          <Link
                            to={`/staff-profile/${item.UserRole.id}/profile`}
                            className="font-semibold text-brand-primary hover:text-brand-hover hover:underline transition-colors"
                          >
                            {item.UserRole.fullName}
                          </Link>
                        ) : (
                          <div className="font-semibold text-gray-900">
                            {item.UserRole.fullName}
                          </div>
                        )}
                        <div className="text-sm text-gray-600">
                          {item.UserRole.email}
                        </div>
                        <div className="text-xs font-semibold text-emerald-600">
                          {item.UserRole.role.toUpperCase()}
                        </div>
                      </div>
                    </td>

                    {/* Month */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-nowrap text-sm font-medium">
                        <FaCalendarAlt className="text-emerald-600" />
                        {formatMonth(item.salaryMonth)}
                      </div>
                    </td>

                    {/* Net Payable */}
                    <td className="px-6 py-5">
                      <div className="text-base text-nowrap font-bold text-blue-600">
                        {money.format(parseFloat(item.netPayableSalary))}
                      </div>
                    </td>

                    {/* Paid */}
                    <td className="px-6 py-5">
                      <div className="text-base text-nowrap font-bold text-green-600">
                        {money.format(parseFloat(item.paidAmount))}
                      </div>
                    </td>

                    {/* Due */}
                    <td className="px-6 py-5">
                      <div className="text-base text-nowrap font-bold text-orange-600">
                        {money.format(parseFloat(item.netPayableSalary) - parseFloat(item.paidAmount))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === "RELEASED"
                          ? "bg-green-100 text-green-800"
                          : item.status === "PENDING"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Released On */}
                    <td className="px-6 py-5 text-sm text-nowrap text-gray-700 font-medium">
                      {formatDate(item.releaseDate)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <button
                        onClick={() => setSelectedPayslip(item)}
                        className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                      >
                        <FaEye />
                        Payslip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-700">
                Showing {(filters.page - 1) * filters.pageSize + 1}–{" "}
                {Math.min(
                  filters.page * filters.pageSize,
                  pagination.totalCount
                )}{" "}
                of {pagination.totalCount} records
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={filters.page === 1}
                  className="px-5 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  Previous
                </button>

                <span className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold">
                  {filters.page}
                </span>

                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={!pagination.hasMore}
                  className="px-5 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payslip Modal */}
      <Modal
        isOpen={!!selectedPayslip}
        onClose={() => setSelectedPayslip(null)}
        maxWidth="4xl"
        className="p-0"
      >
        {selectedPayslip && (
          <>
            {/* Modal Header with Print Button */}
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center -mt-6 -mx-6 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Salary Payslip</h2>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm"
              >
                <FaPrint />
                Print
              </button>
            </div>

            {/* Payslip Content */}
            <div ref={payslipRef} className="px-6 pb-6">
              {/* Company Header */}
              <div className="text-center mb-4 border-b-2 border-gray-800 pb-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedPayslip.UserRole.parent.businessName}
                </h1>
                <p className="text-sm text-gray-600 mt-1">Salary Payslip</p>
              </div>

              {/* Employee & Period Info - Compact Grid */}
              <div className="grid grid-cols-3 gap-x-6 gap-y-2 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Employee:</span>
                  <span className="font-semibold ml-2">{selectedPayslip.UserRole.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-600">ID:</span>
                  <span className="font-semibold ml-2">{selectedPayslip.userId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Role:</span>
                  <span className="font-semibold ml-2">{selectedPayslip.UserRole.role.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Month:</span>
                  <span className="font-semibold ml-2">{formatMonth(selectedPayslip.salaryMonth)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Release Date:</span>
                  <span className="font-semibold ml-2">{formatDate(selectedPayslip.releaseDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Released By:</span>
                  <span className="font-semibold ml-2">{selectedPayslip.releaser?.fullName || "N/A"}</span>
                </div>
              </div>

              {/* Salary Breakdown Table - Compact */}
              <div className="mb-4">
                <div className="border border-gray-300">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Description</th>
                        <th className="px-4 py-2 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {/* Earnings */}
                      <tr className="bg-gray-100">
                        <td colSpan={2} className="px-4 py-1.5 font-semibold text-gray-800">EARNINGS</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-1.5 text-gray-700">Base Salary</td>
                        <td className="px-4 py-1.5 text-right font-medium">
                          {money.format(parseFloat(selectedPayslip.baseSalary))}
                        </td>
                      </tr>
                      {selectedPayslip.calculationSnapshot.commission && (
                        <tr>
                          <td className="px-4 py-1.5 text-gray-700">
                            Commission ({selectedPayslip.calculationSnapshot.commission.commissionRate}%)
                          </td>
                          <td className="px-4 py-1.5 text-right font-medium text-green-700">
                            + {money.format(selectedPayslip.calculationSnapshot.commission.commissionAmount)}
                          </td>
                        </tr>
                      )}
                      {parseFloat(selectedPayslip.bonusAmount) > 0 && (
                        <tr>
                          <td className="px-4 py-1.5 text-gray-700">Bonus</td>
                          <td className="px-4 py-1.5 text-right font-medium text-green-700">
                            + {money.format(parseFloat(selectedPayslip.bonusAmount))}
                          </td>
                        </tr>
                      )}
                      {parseFloat(selectedPayslip.overtimeAmount) > 0 && (
                        <tr>
                          <td className="px-4 py-1.5 text-gray-700">Overtime</td>
                          <td className="px-4 py-1.5 text-right font-medium text-green-700">
                            + {money.format(parseFloat(selectedPayslip.overtimeAmount))}
                          </td>
                        </tr>
                      )}

                      {/* Deductions */}
                      <tr className="bg-gray-100">
                        <td colSpan={2} className="px-4 py-1.5 font-semibold text-gray-800">DEDUCTIONS</td>
                      </tr>
                      {selectedPayslip.calculationSnapshot.unpaidLeaveDeduction > 0 && (
                        <tr>
                          <td className="px-4 py-1.5 text-gray-700">
                            Leave Deduction ({selectedPayslip.calculationSnapshot.unpaidLeaveDays} days)
                          </td>
                          <td className="px-4 py-1.5 text-right font-medium text-red-700">
                            - {money.format(selectedPayslip.calculationSnapshot.unpaidLeaveDeduction)}
                          </td>
                        </tr>
                      )}
                      {parseFloat(selectedPayslip.advanceAmount) > 0 && (
                        <tr>
                          <td className="px-4 py-1.5 text-gray-700">Advance Deduction</td>
                          <td className="px-4 py-1.5 text-right font-medium text-red-700">
                            - {money.format(parseFloat(selectedPayslip.advanceAmount))}
                          </td>
                        </tr>
                      )}
                      {parseFloat(selectedPayslip.fineAmount) > 0 && (
                        <tr>
                          <td className="px-4 py-1.5 text-gray-700">Fine</td>
                          <td className="px-4 py-1.5 text-right font-medium text-red-700">
                            - {money.format(parseFloat(selectedPayslip.fineAmount))}
                          </td>
                        </tr>
                      )}
                      {parseFloat(selectedPayslip.loanDeduction) > 0 && (
                        <tr>
                          <td className="px-4 py-1.5 text-gray-700">Loan Deduction</td>
                          <td className="px-4 py-1.5 text-right font-medium text-red-700">
                            - {money.format(parseFloat(selectedPayslip.loanDeduction))}
                          </td>
                        </tr>
                      )}
                      {parseFloat(selectedPayslip.otherDeduction) > 0 && (
                        <tr>
                          <td className="px-4 py-1.5 text-gray-700">Other Deduction</td>
                          <td className="px-4 py-1.5 text-right font-medium text-red-700">
                            - {money.format(parseFloat(selectedPayslip.otherDeduction))}
                          </td>
                        </tr>
                      )}

                      {/* Summary */}
                      <tr className="bg-blue-50 border-t-2 border-blue-600">
                        <td className="px-4 py-2 font-bold text-blue-900">Net Payable</td>
                        <td className="px-4 py-2 text-right font-bold text-blue-900 text-base">
                          {money.format(parseFloat(selectedPayslip.netPayableSalary))}
                        </td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="px-4 py-2 font-bold text-green-900">Amount Paid</td>
                        <td className="px-4 py-2 text-right font-bold text-green-900 text-base">
                          {money.format(parseFloat(selectedPayslip.paidAmount))}
                        </td>
                      </tr>
                      <tr className="bg-orange-50 border-t-2 border-orange-600">
                        <td className="px-4 py-2 font-bold text-orange-900">Remaining Due</td>
                        <td className="px-4 py-2 text-right font-bold text-orange-900 text-base">
                          {money.format(parseFloat(selectedPayslip.netPayableSalary) - parseFloat(selectedPayslip.paidAmount))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance Summary - Compact */}
              <div className="mb-4 border border-gray-300 p-3">
                <h3 className="font-semibold text-sm text-gray-800 mb-2">Attendance Summary</h3>
                <div className="grid grid-cols-4 gap-3 text-center text-sm">
                  <div>
                    <p className="text-xs text-gray-600">Working Days</p>
                    <p className="text-lg font-bold text-gray-800">{selectedPayslip.calculationSnapshot.workingDays}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Present</p>
                    <p className="text-lg font-bold text-green-600">{selectedPayslip.calculationSnapshot.presentDays}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Paid Leave</p>
                    <p className="text-lg font-bold text-blue-600">{selectedPayslip.calculationSnapshot.paidLeaveDays}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Unpaid Leave</p>
                    <p className="text-lg font-bold text-red-600">{selectedPayslip.calculationSnapshot.unpaidLeaveDays}</p>
                  </div>
                </div>
              </div>

              {/* Footer - Compact */}
              <div className="pt-3 border-t border-gray-300 text-xs text-gray-600">
                <p>
                  <span className="font-semibold">Generated:</span> {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </p>
                <p className="italic mt-1">This is a computer-generated payslip.</p>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ReleaseHistory;
