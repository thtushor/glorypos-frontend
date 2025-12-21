// pages/payroll/LeaveHistory.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_LEAVE_HISTORY, PAYROLL_LEAVE_UPDATE } from "@/api/api";
import Spinner from "@/components/Spinner";
import { toast } from "react-toastify";
import { FaCheck, FaTimes } from "react-icons/fa";
import { useParams, Link } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

interface Leave {
  id: number;
  startDate: string;
  endDate: string;
  type: string;
  notes: string;
  status: "pending" | "approved" | "rejected";
  employee: { id: number; fullName: string; email: string; role: string };
  approver: { fullName: string } | null;
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

const LeaveHistory = () => {
  const { hasPermission } = usePermission();
  const canViewOtherProfiles = hasPermission(PERMISSIONS.STAFF_PROFILE.VIEW_OTHER_PROFILES);

  const queryClient = useQueryClient();
  const params = useParams<{ staffId?: string }>();
  const staffId = params.staffId;

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    status: "",
    userId: staffId || "",
    startDate: "",
    endDate: "",
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
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["leave-history", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, String(v));
      });
      const res = await AXIOS.get(`${PAYROLL_LEAVE_HISTORY}?${params}`);
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: "approved" | "rejected";
    }) => AXIOS.put(`${PAYROLL_LEAVE_UPDATE}/${id}`, { status }),
    onSuccess: () => {
      toast.success("Leave status updated");
      queryClient.invalidateQueries({ queryKey: ["leave-history"] });
      setShowApproveModal(false);
      setShowRejectModal(false);
      setSelectedLeave(null);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to update"),
  });

  const leaves: Leave[] = data?.leaves || [];
  const pagination = data?.pagination;

  const renderStatus = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"
          }`}
      >
        {status}
      </span>
    );
  };

  // === Modal Handlers ===
  const openApprove = (leave: Leave) => {
    setSelectedLeave(leave);
    setShowApproveModal(true);
  };

  const openReject = (leave: Leave) => {
    setSelectedLeave(leave);
    setShowRejectModal(true);
  };

  const confirmApprove = () => {
    if (selectedLeave) {
      updateMutation.mutate({ id: selectedLeave.id, status: "approved" });
    }
  };

  const confirmReject = () => {
    if (selectedLeave) {
      updateMutation.mutate({ id: selectedLeave.id, status: "rejected" });
    }
  };

  return (
    <div className=" max-w-7xl mx-auto">
      {/* Filters */}
      <div className="bg-white pb-4 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee ID
          </label>
          <input
            type="number"
            placeholder="e.g. 10"
            value={filters.userId}
            onChange={(e) =>
              setFilters({ ...filters, userId: e.target.value, page: 1 })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={!!staffId}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value, page: 1 })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value, page: 1 })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No leave requests found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        {canViewOtherProfiles ? (
                          <Link
                            to={`/staff-profile/${leave.employee.id}/profile`}
                            className="text-sm text-brand-primary hover:text-brand-hover hover:underline font-bold transition-colors"
                          >
                            {leave.employee.fullName}
                          </Link>
                        ) : (
                          <div className="text-sm text-green-500 font-bold">
                            {leave.employee.fullName}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {leave.employee.email}
                        </div>
                        <div className="text-xs font-medium text-gray-900">
                          ID: {leave.employee.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {format(new Date(leave.startDate), "MMM dd")} —{" "}
                      {format(new Date(leave.endDate), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm capitalize text-gray-700">
                      {leave.type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {renderStatus(leave.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {leave.notes || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {leave.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openApprove(leave)}
                            disabled={updateMutation.isPending}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Approve"
                          >
                            <FaCheck size={16} />
                          </button>
                          <button
                            onClick={() => openReject(leave)}
                            disabled={updateMutation.isPending}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Reject"
                          >
                            <FaTimes size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">
                          by {leave.approver?.fullName || "Admin"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm">
          <p className="text-gray-600 mb-2 sm:mb-0">
            Showing {(filters.page - 1) * filters.pageSize + 1} to{" "}
            {Math.min(filters.page * filters.pageSize, pagination.totalCount)}{" "}
            of {pagination.totalCount} requests
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 border rounded bg-brand-primary text-white">
              {filters.page}
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={!pagination.hasMore}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* === Approve Modal === */}
      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() => !updateMutation.isPending && setShowApproveModal(false)}
        title="Approve Leave"
        onConfirm={confirmApprove}
        isPending={updateMutation.isPending}
        confirmText="Approve"
        confirmColor="green"
      >
        <p>
          Approve leave for <strong>{selectedLeave?.employee.fullName}</strong>?
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {selectedLeave &&
            `${format(new Date(selectedLeave.startDate), "MMM dd")} – ${format(
              new Date(selectedLeave.endDate),
              "MMM dd, yyyy"
            )}`}
        </p>
      </ConfirmationModal>

      {/* === Reject Modal === */}
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => !updateMutation.isPending && setShowRejectModal(false)}
        title="Reject Leave"
        onConfirm={confirmReject}
        isPending={updateMutation.isPending}
        confirmText="Reject"
        confirmColor="red"
      >
        <p>
          Reject leave request from{" "}
          <strong>{selectedLeave?.employee.fullName}</strong>?
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {selectedLeave &&
            `${format(new Date(selectedLeave.startDate), "MMM dd")} – ${format(
              new Date(selectedLeave.endDate),
              "MMM dd, yyyy"
            )}`}
        </p>
        <p className="text-xs text-red-600 mt-2">
          This action cannot be undone.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default LeaveHistory;
