import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaSearch, FaEdit, FaFilter, FaKey, FaCopy, FaExternalLinkAlt } from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import { toast } from "react-toastify";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal";
import InputWithIcon from "@/components/InputWithIcon";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiBox,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import { MdSubscriptions } from "react-icons/md";
import { format } from "date-fns";
import { REQUEST_RESET_PASSWORD } from "@/api/api";

interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  businessName: string;
  businessType: string;
  accountStatus: "active" | "inactive";
  accountType: "super admin" | "admin" | "default";
  isVerified: boolean;
  createdAt: string;
  UserSubscriptions?: {
    id: number;
    startDate: string;
    endDate: string;
    status: "active" | "expired" | "cancelled";
    paymentStatus: "pending" | "completed" | "failed";
    paymentMethod: "cash" | "card";
    amount: string;
    discount: string;
    coupon: string | null;
    SubscriptionPlan: {
      id: number;
      name: string;
      description: string;
      price: string;
      duration: number;
      features: string[];
      maxProducts: number;
      maxStorage: string;
      maxUsers: number;
      status: string;
    };
  }[];
}

interface UserResponse {
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const Users = () => {
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetLinkModal, setShowResetLinkModal] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const user = useAuth();

  console.log({ user: user?.user?.accountType });

  const isSuperAdmin = user?.user?.accountType === "super admin";

  const [filters, setFilters] = useState({
    searchKey: "",
    accountStatus: "",
    accountType: "",
    page: 1,
    pageSize: 10,
  });

  // Fetch Users
  const { data: userData, isLoading } = useQuery<UserResponse>({
    queryKey: ["users", filters],
    queryFn: async () => {
      const response = await AXIOS.get("/users", { params: filters });
      return response.data;
    },
  });

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: Partial<User> & { userId: number }) => {
      const response = await AXIOS.post(`/profile?userId=${data.userId}`, data);

      return response;
    },
    onSuccess: (data) => {
      console.log({ data });
      if (data.status) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        queryClient.invalidateQueries({ queryKey: ["users"] });
      } else {
        toast.error((data as any).message);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update user");
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, email }: { userId: number; email: string }) => {
      const response = await AXIOS.post(REQUEST_RESET_PASSWORD, { userId: user?.user?.id, email });
      return response;
    },
    onSuccess: (data: any) => {
      console.log({ data });
      if (data?.data?.resetLink) {
        setResetLink(data.data.resetLink);
        setShowResetLinkModal(true);
        toast.success("Password reset link generated successfully");
      } else {
        toast.error("Failed to generate reset link");
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to generate reset link");
    },
  });



  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleUpdateUser = (formData: Partial<User>) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ ...formData, userId: selectedUser.id });
  };

  return (
    <div className="md:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by email..."
              value={filters.searchKey}
              onChange={handleFilterChange}
              name="searchKey"
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <FaFilter className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Account Status
            </label>
            <select
              name="accountStatus"
              value={filters.accountStatus}
              onChange={handleFilterChange}
              className="mt-1 border rounded-lg p-2 block w-full border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Account Type
            </label>
            <select
              name="accountType"
              value={filters.accountType}
              onChange={handleFilterChange}
              className="mt-1 block w-full border rounded-lg p-2 border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
            >
              <option value="">All</option>
              <option value="super admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="default">Default</option>
            </select>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verified
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center w-full">
                      <Spinner color="#32cd32" size="40px" />
                    </div>
                  </td>
                </tr>
              ) : (
                userData?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.phoneNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {user.businessName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.businessType}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.accountStatus === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {user.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.accountType}
                    </td>
                    <td className="px-6 py-4">
                      {user.UserSubscriptions?.length ? (
                        <div className="space-y-2">
                          {user.UserSubscriptions.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex flex-col text-sm bg-gray-50 p-2 rounded-md border border-gray-200"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <MdSubscriptions className="text-brand-primary w-4 h-4" />
                                <span className="font-medium">
                                  {sub.SubscriptionPlan.name}
                                </span>
                              </div>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Status:</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium
                                    ${sub.status === "active"
                                        ? "bg-green-100 text-green-800"
                                        : sub.status === "expired"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                  >
                                    {sub.status}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">
                                    Payment:
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium
                                    ${sub.paymentStatus === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : sub.paymentStatus === "failed"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                  >
                                    {sub.paymentStatus}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">Amount:</span>
                                  <span className="font-medium">
                                    ${sub.amount}
                                  </span>
                                </div>
                                {sub.discount !== "0.00" && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                      Discount:
                                    </span>
                                    <span className="text-green-600">
                                      ${sub.discount}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">
                                    Expires:
                                  </span>
                                  <span>
                                    {format(
                                      new Date(sub.endDate),
                                      "MMM dd, yyyy"
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          No active subscription
                        </span>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                            }`}
                        >
                          {user.isVerified ? "✓ Verified" : "⚠ Not Verified"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              resetPasswordMutation.mutate({ userId: user.id, email: user.email });
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
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="group relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-primary bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 transition-all duration-200"
                          title="Edit User Details"
                        >
                          <FaEdit className="w-4 h-4" />
                          <span className="hidden xl:inline">Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {userData && (
        <Pagination
          currentPage={filters.page}
          totalPages={userData.pagination.totalPages}
          totalItems={userData.pagination.totalItems}
          pageSize={filters.pageSize}
          hasNextPage={userData.pagination.hasNextPage}
          hasPreviousPage={userData.pagination.hasPreviousPage}
          onPageChange={handlePageChange}
        />
      )}

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
      >
        {selectedUser && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateUser({
                fullName: formData.get("fullName") as string,
                email: formData.get("email") as string,
                phoneNumber: formData.get("phoneNumber") as string,
                location: formData.get("location") as string,
                businessName: formData.get("businessName") as string,
                businessType: formData.get("businessType") as string,
                accountStatus: formData.get("accountStatus") as
                  | "active"
                  | "inactive",
                accountType: formData.get("accountType") as
                  | "super admin"
                  | "admin"
                  | "default",
                isVerified: formData.get("isVerified") === "true",
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <InputWithIcon
                  type="text"
                  name="fullName"
                  icon={<FiUser className="text-gray-400" />}
                  defaultValue={selectedUser.fullName}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <InputWithIcon
                  type="email"
                  name="email"
                  icon={<FiMail className="text-gray-400" />}
                  defaultValue={selectedUser.email}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <InputWithIcon
                  type="tel"
                  name="phoneNumber"
                  icon={<FiPhone className="text-gray-400" />}
                  defaultValue={selectedUser.phoneNumber}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <InputWithIcon
                  type="text"
                  name="location"
                  icon={<FiMapPin className="text-gray-400" />}
                  defaultValue={selectedUser.location}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <InputWithIcon
                  type="text"
                  name="businessName"
                  icon={<FiBriefcase className="text-gray-400" />}
                  defaultValue={selectedUser.businessName}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Type
                </label>
                <InputWithIcon
                  type="text"
                  name="businessType"
                  icon={<FiBox className="text-gray-400" />}
                  defaultValue={selectedUser.businessType}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Account Status
                </label>
                <select
                  name="accountStatus"
                  defaultValue={selectedUser.accountStatus}
                  required
                  className="mt-1 border rounded-md p-2 block w-full border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Account Type
                </label>
                <select
                  name="accountType"
                  defaultValue={selectedUser.accountType}
                  required
                  className="mt-1 block border p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                >
                  <option value="super admin">Super Admin</option>
                  {/* <option value="admin">Admin</option> */}
                  <option value="shop">Shop</option>
                </select>
              </div>
              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Verification Status
                  </label>
                  <select
                    name="isVerified"
                    defaultValue={selectedUser.isVerified.toString()}
                    className="mt-1 block border p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                  >
                    <option value="true">Verified</option>
                    <option value="false">Not Verified</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateUserMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover rounded-md disabled:opacity-50"
              >
                {updateUserMutation.isPending ? "Updating..." : "Update User"}
              </button>
            </div>
          </form>
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

export default Users;
