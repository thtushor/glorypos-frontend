// src/pages/payroll/AdvanceSalaryHistory.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import AXIOS from "@/api/network/Axios";
import {
  PAYROLL_ADVANCE_SALERY,
  PAYROLL_ADVANCE_SALERY_STATUS,
  CHILD_USERS_URL,
  SUB_SHOPS_URL,
} from "@/api/api";
import Spinner from "@/components/Spinner";
import { toast } from "react-toastify";
import {
  FaCheck,
  FaTimes,
  FaUser,
  FaCalendarAlt,
  FaDollarSign,
  FaBuilding,
} from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { useParams, Link } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

interface AdvanceSalary {
  id: number;
  userId: number;
  salaryMonth: string;
  amount: string;
  reason: string;
  approvedBy: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  UserRole: {
    id: number;
    fullName: string;
    email: string;
    baseSalary: string;
    parent: {
      id: number;
      fullName: string;
    };
  };
}

interface AdvanceSalaryResponse {
  advances: AdvanceSalary[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
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

// === Confirmation Modal Component ===
const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  isPending,
  confirmText = "Confirm",
  confirmColor = "green",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm: () => void;
  isPending: boolean;
  confirmText?: string;
  confirmColor?: "green" | "red";
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
        <div className="text-sm text-gray-700 mb-4">{children}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`px-4 py-2 text-white rounded flex items-center gap-2 disabled:opacity-70 ${confirmColor === "green"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
              }`}
          >
            {isPending ? (
              <>
                <Spinner size="16px" color="white" /> {confirmText}ing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdvanceSalaryHistory = () => {
  const { hasPermission } = usePermission();
  const canViewOtherProfiles = hasPermission(PERMISSIONS.STAFF_PROFILE.VIEW_OTHER_PROFILES);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const params = useParams<{ staffId?: string }>();
  const staffId = params.staffId;

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    status: "",
    userId: staffId || "",
    salaryMonth: "",
    shopId: "",
  });

  // Update userId filter when staffId changes
  useEffect(() => {
    if (staffId && filters.userId !== staffId) {
      setFilters(prev => ({ ...prev, userId: staffId, page: 1 }));
    }
  }, [staffId]);

  // === Modal States ===
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<AdvanceSalary | null>(
    null
  );

  // Fetch all employees for the dropdown
  const { data: usersData, isLoading: loadingUsers } =
    useQuery<ChildUsersResponse>({
      queryKey: ["childUsers", "all"],
      queryFn: async () => {
        const res = await AXIOS.get(
          `${CHILD_USERS_URL}?page=1&pageSize=1000&withAttendance=true`
        );
        return res.data;
      },
    });

  const users = usersData?.users || [];

  // Fetch all shops for the dropdown
  const { data: shopData, isLoading: isLoadingShops } =
    useQuery<SubShopResponse>({
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

  const { data, isLoading, error } = useQuery<AdvanceSalaryResponse>({
    queryKey: ["advanceSalary", { ...filters }],
    queryFn: async () => {
      // Build params object, excluding empty values
      const params: Record<string, any> = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (filters.status) params.status = filters.status;
      if (filters.userId) params.userId = filters.userId;
      if (filters.salaryMonth) params.salaryMonth = filters.salaryMonth;
      if (filters.shopId) params.shopId = filters.shopId;

      const res = await AXIOS.get(`${PAYROLL_ADVANCE_SALERY}`, {
        params,
      });
      console.log("Advance Salary Response:", res?.data);
      // Handle both response structures:
      // 1. { status: true, message: "...", data: { advances: [], pagination: {} } }
      // 2. { advances: [], pagination: {} }
      if (res?.data?.data) {
        return res.data.data;
      }
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: "PENDING" | "APPROVED" | "REJECTED";
    }) => {
      // Replace :id with actual ID in the URL
      const url = PAYROLL_ADVANCE_SALERY_STATUS.replace(":id", String(id));
      const res = await AXIOS.post(url, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Advance salary status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["advanceSalary"] });
      setShowApproveModal(false);
      setShowRejectModal(false);
      setSelectedAdvance(null);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update advance salary status"
      );
    },
  });

  const advances: AdvanceSalary[] = data?.advances || [];
  const pagination = data?.pagination;

  const renderStatus = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"
          }`}
      >
        {status.toLowerCase()}
      </span>
    );
  };

  // === Modal Handlers ===
  const openApprove = (advance: AdvanceSalary) => {
    setSelectedAdvance(advance);
    setShowApproveModal(true);
  };

  const openReject = (advance: AdvanceSalary) => {
    setSelectedAdvance(advance);
    setShowRejectModal(true);
  };

  const confirmApprove = () => {
    if (selectedAdvance) {
      updateStatusMutation.mutate({
        id: selectedAdvance.id,
        status: "APPROVED",
      });
    }
  };

  const confirmReject = () => {
    if (selectedAdvance) {
      updateStatusMutation.mutate({
        id: selectedAdvance.id,
        status: "REJECTED",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Filters */}
      <div className="bg-white pb-4 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, page: 1 })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

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
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition"
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
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={loadingUsers || !!staffId}
          >
            <option value="">
              {loadingUsers ? "Loading employees..." : "All Employees"}
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} ({user.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Salary Month
          </label>
          <input
            type="month"
            value={filters.salaryMonth}
            onChange={(e) =>
              setFilters({ ...filters, salaryMonth: e.target.value, page: 1 })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Loading / Error / Empty */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600 bg-white rounded-lg shadow">
          Failed to load advance salary history
        </div>
      ) : advances.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No advance salary requests found.</p>
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
                    Salary Month
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Requested On
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {advances.map((advance) => (
                  <tr
                    key={advance.id}
                    className="hover:bg-emerald-50 transition duration-200"
                  >
                    {/* Employee */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <FaUser className="text-emerald-600" size={16} />
                        </div>
                        <div>
                          {canViewOtherProfiles ? (
                            <Link
                              to={`/staff-profile/${advance.UserRole.id}/profile`}
                              className="font-semibold text-brand-primary hover:text-brand-hover hover:underline transition-colors"
                            >
                              {advance.UserRole.fullName}
                            </Link>
                          ) : (
                            <div className="font-semibold text-gray-900">
                              {advance.UserRole.fullName}
                            </div>
                          )}
                          <div className="text-sm text-gray-600">
                            {advance.UserRole.email}
                          </div>
                          <div className="text-xs font-medium text-gray-500">
                            ID: {advance.userId} | Base: ฿
                            {Number(advance.UserRole.baseSalary).toLocaleString(
                              "th-TH"
                            )}
                          </div>
                          {advance.UserRole.parent && (
                            <div className="text-xs text-emerald-600">
                              Manager: {advance.UserRole.parent.fullName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Salary Month */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FaCalendarAlt className="text-emerald-600" />
                        {advance.salaryMonth
                          ? format(
                            new Date(`${advance.salaryMonth}-01`),
                            "MMMM yyyy"
                          )
                          : advance.salaryMonth}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-base font-bold text-emerald-600">
                        <FaDollarSign />฿
                        {Number(advance.amount).toLocaleString("th-TH")}
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-700 max-w-xs truncate">
                        {advance.reason || "—"}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      {renderStatus(advance.status)}
                    </td>

                    {/* Requested On */}
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">
                      {format(new Date(advance.createdAt), "MMM dd, yyyy")}
                      <div className="text-xs text-gray-500">
                        {format(new Date(advance.createdAt), "HH:mm")}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 whitespace-nowrap text-sm">
                      {advance.status === "PENDING" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openApprove(advance)}
                            disabled={updateStatusMutation.isPending}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                            title="Approve"
                          >
                            <FaCheck size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => openReject(advance)}
                            disabled={updateStatusMutation.isPending}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                            title="Reject"
                          >
                            <FaTimes size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {advance.status === "APPROVED" ? (
                            <span className="text-green-600">✓ Approved</span>
                          ) : (
                            <span className="text-red-600">✗ Rejected</span>
                          )}
                        </span>
                      )}
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
                Showing {(filters.page - 1) * filters.pageSize + 1}–
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
                  disabled={filters.page >= pagination.totalPages}
                  className="px-5 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === Approve Modal === */}
      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() =>
          !updateStatusMutation.isPending && setShowApproveModal(false)
        }
        title="Approve Advance Salary"
        onConfirm={confirmApprove}
        isPending={updateStatusMutation.isPending}
        confirmText="Approve"
        confirmColor="green"
      >
        <p>
          Approve advance salary request from{" "}
          <strong>{selectedAdvance?.UserRole.fullName}</strong>?
        </p>
        {selectedAdvance && (
          <div className="mt-3 space-y-2 text-xs bg-gray-50 p-3 rounded">
            <p>
              <strong>Amount:</strong> ฿
              {Number(selectedAdvance.amount).toLocaleString("th-TH")}
            </p>
            <p>
              <strong>Salary Month:</strong> {selectedAdvance.salaryMonth}
            </p>
            <p>
              <strong>Reason:</strong> {selectedAdvance.reason}
            </p>
          </div>
        )}
        <p className="text-xs text-green-600 mt-2">
          The advance will be eligible for deduction from the employee's salary.
        </p>
      </ConfirmationModal>

      {/* === Reject Modal === */}
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() =>
          !updateStatusMutation.isPending && setShowRejectModal(false)
        }
        title="Reject Advance Salary"
        onConfirm={confirmReject}
        isPending={updateStatusMutation.isPending}
        confirmText="Reject"
        confirmColor="red"
      >
        <p>
          Reject advance salary request from{" "}
          <strong>{selectedAdvance?.UserRole.fullName}</strong>?
        </p>
        {selectedAdvance && (
          <div className="mt-3 space-y-2 text-xs bg-gray-50 p-3 rounded">
            <p>
              <strong>Amount:</strong> ฿
              {Number(selectedAdvance.amount).toLocaleString("th-TH")}
            </p>
            <p>
              <strong>Salary Month:</strong> {selectedAdvance.salaryMonth}
            </p>
            <p>
              <strong>Reason:</strong> {selectedAdvance.reason}
            </p>
          </div>
        )}
        <p className="text-xs text-red-600 mt-2">
          This action cannot be undone. The employee will be notified.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default AdvanceSalaryHistory;
