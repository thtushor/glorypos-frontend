import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaTrash,
  FaUserCog,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaKey,
  FaCopy,
  FaExternalLinkAlt,
} from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import { CHILD_USERS_URL, REQUEST_RESET_PASSWORD } from "@/api/api";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import { format } from "date-fns";
import CreateUserForm from "./CreateUserForm";
import { useSearchParams, Link } from "react-router-dom";
import debounce from "lodash/debounce";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useShopFilterOptions } from "@/hooks/useShopFilterOptions";

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
  phone?: string;
  role: string;
  status: "active" | "inactive";
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canViewReports: boolean;
  };
  createdAt: string;
  updatedAt: string;
  parentUserId: number;
  userId: number | null;
  parent: Parent;
  baseSalary?: number | null;
  requiredDailyHours?: number | null;
  salaryFrequency?: "daily" | "weekly" | "monthly";
  salaryStartDate?: string | null;
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

const ChildUsers = () => {
  const [selectedUser, setSelectedUser] = useState<ChildUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetLinkModal, setShowResetLinkModal] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermission();

  const { user } = useAuth();

  // Permission checks
  const canCreateUser = hasPermission(PERMISSIONS.USERS.CREATE_CHILD_USER);
  const canEditUser = hasPermission(PERMISSIONS.USERS.EDIT_CHILD_USER);
  const canDeleteUser = hasPermission(PERMISSIONS.USERS.DELETE_CHILD_USER);
  const canViewDetails = hasPermission(PERMISSIONS.USERS.VIEW_CHILD_USERS);
  const canViewOtherProfiles = hasPermission(PERMISSIONS.STAFF_PROFILE.VIEW_OTHER_PROFILES);

  const [filters, setFilters] = useState({
    searchKey: searchParams.get("searchKey") || "",
    role: searchParams.get("role") || "",
    status: searchParams.get("status") || "",
    parentUserId: user?.id?.toString() || ""
  });
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;

  const { data, isLoading } = useQuery<ChildUsersResponse>({
    queryKey: ["childUsers", page, pageSize, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(filters.searchKey && { searchKey: filters.searchKey }),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.parentUserId && { parentUserId: filters?.parentUserId })
      });
      const response = await AXIOS.get(`${CHILD_USERS_URL}?${params}`);
      return response.data;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await AXIOS.post(`${CHILD_USERS_URL}/delete/${userId}`);
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["childUsers"] });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete user");
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await AXIOS.post(REQUEST_RESET_PASSWORD, { userId: user?.id, email });
      return response;
    },
    onSuccess: (data: any) => {
      console.log({ data });
      if (data?.data?.resetLink) {
        setResetLink(data.data.resetLink);
        setShowResetLinkModal(true);
        toast.success("Password reset link generated successfully");
      } else {
        toast.error(data?.message || "Failed to generate reset link");
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to generate reset link");
    },
  });

  const handleDelete = (user: ChildUser) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const updateFilters = debounce((newFilters: typeof filters) => {
    setFilters(newFilters);
    setSearchParams({
      page: "1",
      pageSize: String(pageSize),
      ...newFilters,
    });
  }, 100);

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      ...Object.fromEntries(searchParams),
      page: String(newPage),
    });
  };

  const { shops, isLoading: isLoadingShops } = useShopFilterOptions();

  //   if (isLoading) {
  //     return (
  //       <div className="flex justify-center items-center h-64">
  //         <Spinner color="#32cd32" size="40px" />
  //       </div>
  //     );
  //   }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Child Users</h1>
        {canCreateUser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-hover flex items-center gap-2"
          >
            <FaPlus /> Add User
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          className="border rounded-md px-3 py-2"
          value={filters.searchKey}
          onChange={(e) =>
            updateFilters({ ...filters, searchKey: e.target.value })
          }
        />
        <select
          className="border rounded-md px-3 py-2"
          value={filters.role}
          onChange={(e) => updateFilters({ ...filters, role: e.target.value })}
        >
          <option value="">All Roles</option>
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
          <option value="staff">Staff</option>
        </select>
        <select
          className="border rounded-md px-3 py-2"
          value={filters.status}
          onChange={(e) =>
            updateFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>


        {/* Shop Filter */}
        <select
          value={filters.parentUserId || ""}
          onChange={(e) =>
            updateFilters({ ...filters, parentUserId: e.target.value })

          }
          disabled={isLoadingShops}
          className="border rounded-lg p-2"
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

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Parent Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
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
                <td colSpan={6}>
                  <div className="flex justify-center items-center h-64">
                    <Spinner color="#32cd32" size="40px" />
                  </div>
                </td>
              </tr>
            ) : null}
            {!isLoading &&
              data?.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {canViewOtherProfiles ? (
                        <Link
                          to={`/staff-profile/${user.id}/profile`}
                          className="font-medium text-brand-primary hover:text-brand-hover hover:underline transition-colors"
                        >
                          {user.fullName}
                        </Link>
                      ) : (
                        <span className="font-medium">{user.fullName}</span>
                      )}
                      <span className="text-sm text-gray-500">
                        {user.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.parent.businessName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {user.parent.businessType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize">{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                        }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(user.createdAt), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 flex items-center justify-end">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          resetPasswordMutation.mutate({ email: user.email });
                        }}
                        disabled={resetPasswordMutation.isPending}
                        className="group relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        title="Generate Password Reset Link"
                      >
                        <FaKey className="w-4 h-4" />
                        <span className="hidden xl:inline">Reset Password</span>
                        {resetPasswordMutation.isPending && (
                          <div className="absolute inset-0 flex items-center justify-center bg-orange-50 rounded-lg">
                            <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </button>
                      {canEditUser && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="group relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                          title="Edit User"
                        >
                          <FaEdit className="w-4 h-4" />
                          <span className="hidden xl:inline">Edit</span>
                        </button>
                      )}
                      {canViewDetails && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                          className="group relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-primary bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 transition-all duration-200"
                          title="View Details"
                        >
                          <FaUserCog className="w-4 h-4" />
                          <span className="hidden xl:inline">Details</span>
                        </button>
                      )}
                      {canDeleteUser && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="group relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200"
                          title="Delete User"
                        >
                          <FaTrash className="w-4 h-4" />
                          <span className="hidden xl:inline">Delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Updated pagination controls */}
      {data?.pagination && (
        <div className="mt-4 flex items-center justify-center flex-col sm:flex-row gap-1 sm:justify-between">
          <div className="text-sm text-gray-500">
            Showing {(page - 1) * data.pagination.pageSize + 1} to{" "}
            {Math.min(
              page * data.pagination.pageSize,
              data.pagination.totalCount
            )}{" "}
            of {data.pagination.totalCount} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from(
              { length: data.pagination.totalPages },
              (_, i) => i + 1
            ).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 border rounded-md ${pageNum === page ? "bg-brand-primary text-white" : ""
                  }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!data.pagination.hasMore}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create User"
      >
        <CreateUserForm
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ["childUsers"] });
          }}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
      >
        <CreateUserForm
          user={selectedUser}
          onSuccess={() => {
            setShowEditModal(false);
            queryClient.invalidateQueries({ queryKey: ["childUsers"] });
          }}
        />
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-4">User Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FaUserCog className="text-gray-400" />
                    <div>
                      <p className="font-medium">{selectedUser.fullName}</p>
                      <p className="text-sm text-gray-500">
                        {selectedUser.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-gray-400" />
                    <span>{selectedUser.email}</span>
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-gray-400" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Parent Business</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FaBuilding className="text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {selectedUser.parent.businessName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedUser.parent.businessType}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        )}
      </Modal>

      {/* Reset Link Modal */}
      <Modal
        isOpen={showResetLinkModal}
        onClose={() => {
          setShowResetLinkModal(false);
          setResetLink("");
        }}
        title="Password Reset Link"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Password reset link has been generated. You can copy the link or open it in a new tab.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Reset Link:</p>
            <p className="text-sm text-gray-900 break-all font-mono">
              {resetLink}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(resetLink);
                toast.success("Reset link copied to clipboard!");
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover rounded-md"
            >
              <FaCopy className="w-4 h-4" />
              Copy Link
            </button>
            <button
              onClick={() => {
                window.open(resetLink, "_blank");
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              <FaExternalLinkAlt className="w-4 h-4" />
              Open Link
            </button>
          </div>

          <button
            onClick={() => {
              setShowResetLinkModal(false);
              setResetLink("");
            }}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ChildUsers;
