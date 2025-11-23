// src/pages/payroll/PayrollMain.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import ActionMenu from "@/components/ActionMenu";
import {
  FaTrash,
  FaUserCog,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaCalendarCheck,
  FaUsers,
  FaStar,
  FaMoneyBillWave,
  FaBuilding,
  FaCalendarTimes,
} from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import {
  CHILD_USERS_URL,
  PAYROLL_ATTENDANCE_PRESENT_MULTIPLE,
  PAYROLL_ATTENDANCE_ABSENT_MULTIPLE,
} from "@/api/api";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash/debounce";
import AttendanceForm from "./AttendanceForm";
import LeaveForm from "./LeaveForm";
import PromotionForm from "./PromotionForm";
import SalaryDetails from "./SalaryDetails";
import ReleaseForm from "./ReleaseForm";
import HistoryModal from "./HistoryModal";
import CreateUserForm from "../users/CreateUserForm";

// === INTERFACES ===
interface Parent {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  businessName: string;
  businessType: string;
  accountStatus: string;
  accountType: string;
}

interface ChildUser {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: "active" | "inactive";

  attendanceType?: "present" | "absent" | null;
  attendanceDate?: string | null;
  isHalfDay?: boolean;
  reason?: string | null;
  notes?: string | null;
  lateMinutes?: number;
  extraMinutes?: number;

  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canViewReports: boolean;
  };
  baseSalary: number | null;
  requiredDailyHours: number | null;
  createdAt: string;
  updatedAt: string;
  parentUserId: number;
  userId: number | null;
  parent: Parent;
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

// === MAIN COMPONENT ===
const PayrollMain = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChildUser | null>(null);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBulkPresentModal, setShowBulkPresentModal] = useState(false);
  const [showBulkAbsentModal, setShowBulkAbsentModal] = useState(false);

  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    searchKey: searchParams.get("searchKey") || "",
    role: searchParams.get("role") || "",
    status: searchParams.get("status") || "",
    withAttendance: "true",
  });

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;

  // === FETCH USERS ===
  const { data, isLoading } = useQuery<ChildUsersResponse>({
    queryKey: ["childUsers", page, pageSize, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(filters.searchKey && { searchKey: filters.searchKey }),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        withAttendance: "true",
      });
      const res = await AXIOS.get(`${CHILD_USERS_URL}?${params}`);
      return res.data;
    },
  });

  // === DELETE USER ===
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await AXIOS.post(`${CHILD_USERS_URL}/delete/${userId}`);
    },
    onSuccess: () => {
      toast.success("Employee deleted");
      queryClient.invalidateQueries({ queryKey: ["childUsers"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const handleDelete = (user: ChildUser) => {
    if (window.confirm("Delete this employee?")) {
      deleteUserMutation.mutate(user.id);
    }
  };

  // === FILTERS ===
  const updateFilters = debounce((newFilters: typeof filters) => {
    setFilters(newFilters);
    setSearchParams({
      page: "1",
      pageSize: String(pageSize),
      ...newFilters,
    });
  }, 300);

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: String(newPage),
    });
  };

  // === BULK PRESENT ===
  const markPresentMutation = useMutation({
    mutationFn: () =>
      AXIOS.post(PAYROLL_ATTENDANCE_PRESENT_MULTIPLE, { userIds: selectedIds }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Marked Present");
      queryClient.invalidateQueries({ queryKey: ["childUsers"] });
      setSelectedIds([]);
      setShowBulkPresentModal(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed");
      setShowBulkPresentModal(false);
    },
  });

  // === BULK ABSENT ===
  const markAbsentMutation = useMutation({
    mutationFn: () =>
      AXIOS.post(PAYROLL_ATTENDANCE_ABSENT_MULTIPLE, { userIds: selectedIds }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Marked Absent");
      queryClient.invalidateQueries({ queryKey: ["childUsers"] });
      setSelectedIds([]);
      setShowBulkAbsentModal(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed");
      setShowBulkAbsentModal(false);
    },
  });

  return (
    <>
      {/* BULK ACTION BUTTONS */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setShowBulkPresentModal(true)}
            disabled={markPresentMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-70 flex items-center gap-2"
          >
            <FaCalendarCheck />
            {markPresentMutation.isPending
              ? "Marking..."
              : `Present (${selectedIds.length})`}
          </button>

          <button
            onClick={() => setShowBulkAbsentModal(true)}
            disabled={markAbsentMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-70 flex items-center gap-2"
          >
            <FaCalendarTimes />
            {markAbsentMutation.isPending
              ? "Marking..."
              : `Absent (${selectedIds.length})`}
          </button>
        </div>
      )}

      {/* FILTERS */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          value={filters.searchKey}
          onChange={(e) =>
            updateFilters({ ...filters, searchKey: e.target.value })
          }
        />
        <select
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          value={filters.role}
          onChange={(e) => updateFilters({ ...filters, role: e.target.value })}
        >
          <option value="">All Roles</option>
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
          <option value="staff">Staff</option>
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          value={filters.status}
          onChange={(e) =>
            updateFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length ===
                    (data?.users.filter((u) => !u.attendanceType).length || 0)
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(
                        data?.users
                          .filter((u) => !u.attendanceType)
                          .map((u) => u.id) || []
                      );
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className={
                    data?.users.every((u) => u.attendanceType)
                      ? "cursor-not-allowed opacity-70"
                      : ""
                  }
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Today
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Salary/Hrs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <Spinner color="#32cd32" size="40px" />
                </td>
              </tr>
            ) : (
              data?.users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      disabled={!!user.attendanceType}
                      checked={selectedIds.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((prev) => [...prev, user.id]);
                        } else {
                          setSelectedIds((prev) =>
                            prev.filter((id) => id !== user.id)
                          );
                        }
                      }}
                      className={
                        user.attendanceType
                          ? "cursor-not-allowed opacity-70"
                          : ""
                      }
                    />
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium text-center ${
                          user.attendanceType === "absent"
                            ? "bg-red-100 text-red-800"
                            : user.attendanceType === "present"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.attendanceType === "absent"
                          ? "Absent"
                          : user.attendanceType === "present"
                          ? "Present"
                          : "Working"}
                        {user.isHalfDay && " (½)"}
                      </span>
                      <div className="text-xs text-gray-500 text-nowrap">
                        {format(new Date(), "dd MMM, yyyy")}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{user.fullName}</span>
                      <span className="text-sm text-gray-500 text-nowrap">
                        {user.email}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-nowrap">
                        {user.parent.businessName}
                      </span>
                      <span className="text-sm text-gray-500 text-nowrap">
                        {user.parent.businessType}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 capitalize">{user.role}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm">
                        ฿{user.baseSalary || "N/A"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user.requiredDailyHours || "N/A"} hrs/day
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {format(new Date(user.createdAt), "MMM dd, yyyy")}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <ActionMenu
                      isLargeData={data?.users?.length > 2}
                      actions={[
                        {
                          label: "Set Attendance",
                          icon: <FaCalendarCheck className="w-4 h-4" />,
                          onClick: () => {
                            setSelectedUser(user);
                            setShowAttendanceModal(true);
                          },
                          color: "green",
                        },
                        {
                          label: "Add Leaves",
                          icon: <FaUsers className="w-4 h-4" />,
                          onClick: () => {
                            setSelectedUser(user);
                            setShowLeaveModal(true);
                          },
                          color: "yellow",
                        },
                        {
                          label: "Add Promotion",
                          icon: <FaStar className="w-4 h-4" />,
                          onClick: () => {
                            setSelectedUser(user);
                            setShowPromotionModal(true);
                          },
                          color: "purple",
                        },

                        {
                          label: "Edit Employee",
                          icon: <FaEdit className="w-4 h-4" />,
                          onClick: () => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          },
                          color: "blue",
                        },
                        {
                          label: "Employee Details",
                          icon: <FaUserCog className="w-4 h-4" />,
                          onClick: () => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          },
                          color: "cyan",
                        },
                        {
                          label: "Delete Employee",
                          icon: <FaTrash className="w-4 h-4" />,
                          onClick: () => handleDelete(user),
                          danger: true,
                          color: "red",
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {data?.pagination && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(page - 1) * data.pagination.pageSize + 1} to{" "}
            {Math.min(
              page * data.pagination.pageSize,
              data.pagination.totalCount
            )}{" "}
            of {data.pagination.totalCount}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from(
              { length: data.pagination.totalPages },
              (_, i) => i + 1
            ).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-3 py-1 border rounded-md ${
                  p === page
                    ? "bg-brand-primary text-white hover:bg-brand-hover"
                    : "hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!data.pagination.hasMore}
              className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* === MODALS === */}
      {/* Edit */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Employee"
      >
        <CreateUserForm
          user={selectedUser}
          onSuccess={() => {
            setShowEditModal(false);
            queryClient.invalidateQueries({ queryKey: ["childUsers"] });
          }}
        />
      </Modal>

      {/* Details */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Employee Details"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Employee Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FaUserCog />{" "}
                    <span className="font-medium">{selectedUser.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope /> <span>{selectedUser.email}</span>
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center gap-2">
                      <FaPhone /> <span>{selectedUser.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FaMoneyBillWave />{" "}
                    <span>Base: ฿{selectedUser.baseSalary || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCalendarCheck />{" "}
                    <span>
                      Hours: {selectedUser.requiredDailyHours || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Business</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FaBuilding />{" "}
                    <span className="font-medium">
                      {selectedUser.parent.businessName}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {selectedUser.parent.businessType}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Attendance */}
      <Modal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        title="Manage Attendance"
      >
        <AttendanceForm
          user={selectedUser}
          onSuccess={() => {
            setShowAttendanceModal(false);
            queryClient.invalidateQueries({ queryKey: ["childUsers"] });
          }}
        />
      </Modal>

      {/* Leave */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Manage Leaves"
      >
        <LeaveForm
          user={selectedUser}
          onSuccess={() => setShowLeaveModal(false)}
        />
      </Modal>

      {/* Promotion */}
      <Modal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        title="Promotion/Demotion"
      >
        <PromotionForm
          user={selectedUser}
          onSuccess={() => setShowPromotionModal(false)}
        />
      </Modal>

      {/* Salary */}
      <Modal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        title="Salary Details"
      >
        <SalaryDetails
          user={selectedUser}
          onSuccess={() => setShowSalaryModal(false)}
        />
      </Modal>

      {/* Release */}
      <Modal
        isOpen={showReleaseModal}
        onClose={() => setShowReleaseModal(false)}
        title="Release Salary"
      >
        <ReleaseForm
          user={selectedUser}
          onSuccess={() => setShowReleaseModal(false)}
        />
      </Modal>

      {/* History */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Salary History"
      >
        <HistoryModal user={selectedUser} />
      </Modal>

      {/* Bulk Present */}
      <Modal
        isOpen={showBulkPresentModal}
        onClose={() =>
          !markPresentMutation.isPending && setShowBulkPresentModal(false)
        }
        title="Mark Present"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Mark <strong>{selectedIds.length}</strong> employee(s) as{" "}
            <span className="text-green-600 font-medium">PRESENT</span> today?
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
            <p>Only unmarked users will be updated.</p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowBulkPresentModal(false)}
              disabled={markPresentMutation.isPending}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              onClick={() => markPresentMutation.mutate()}
              disabled={markPresentMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-70 flex items-center gap-2"
            >
              {markPresentMutation.isPending ? (
                <>
                  <Spinner size="16px" color="white" /> Marking...
                </>
              ) : (
                "Confirm & Mark"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Absent */}
      <Modal
        isOpen={showBulkAbsentModal}
        onClose={() =>
          !markAbsentMutation.isPending && setShowBulkAbsentModal(false)
        }
        title="Mark Absent"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Mark <strong>{selectedIds.length}</strong> employee(s) as{" "}
            <span className="text-red-600 font-medium">ABSENT</span> today?
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
            <p>Only unmarked users will be updated.</p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowBulkAbsentModal(false)}
              disabled={markAbsentMutation.isPending}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              onClick={() => markAbsentMutation.mutate()}
              disabled={markAbsentMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-70 flex items-center gap-2"
            >
              {markAbsentMutation.isPending ? (
                <>
                  <Spinner size="16px" color="white" /> Marking...
                </>
              ) : (
                "Confirm & Mark"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PayrollMain;
