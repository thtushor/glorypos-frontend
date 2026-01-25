import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaSearch,
  FaEdit,
  FaFilter,
  FaPlus,
  FaPercent,
  FaKey,
  FaCopy,
  FaExternalLinkAlt,
  // FaStore,
} from "react-icons/fa";
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
import { SUB_SHOPS_URL, REGISTER_URL, REQUEST_RESET_PASSWORD } from "@/api/api";
import LockIcon from "@/components/icons/LockIcon";
import UserIcon from "@/components/icons/UserIcon";
import EnvelopeIcon from "@/components/icons/EnvelopeIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import LocationIcon from "@/components/icons/Location";
import Category from "@/components/icons/Category";
import BusinessIcon from "@/components/icons/BusinessIcon";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";
// import FallbackAvatar from "@/components/shared/FallbackAvatar";

interface SubShop {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  businessName: string;
  businessType: string;
  accountStatus: "active" | "inactive";
  accountType: "super admin" | "admin" | "shop";
  shopType: "normal" | "restaurant";
  isVerified: boolean;
  createdAt: string;
  parentId?: number;
  password?: string;
  ignoreEmailVerification?: boolean;
  stuffCommission?: number;
  image?: string;
}

interface SubShopResponse {
  users: SubShop[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const OtherShops = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  // Permission check
  const canManageSubShops = hasPermission(PERMISSIONS.SHOPS.MANAGE_SUB_SHOPS);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedShop, setSelectedShop] = useState<SubShop | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetLinkModal, setShowResetLinkModal] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const [filters, setFilters] = useState({
    searchKey: "",
    accountStatus: "",
    accountType: "",
    page: 1,
    pageSize: 10,
  });

  // Fetch Sub Shops
  const { data: shopData, isLoading } = useQuery<SubShopResponse>({
    queryKey: ["sub-shops", filters],
    queryFn: async () => {
      const response = await AXIOS.get(SUB_SHOPS_URL, { params: filters });
      return response.data;
    },
  });

  console.log({ shopData });

  // Create Sub Shop Mutation
  const createShopMutation = useMutation({
    mutationFn: async (data: Partial<SubShop> & { parentId?: number }) => {
      const response = await AXIOS.post(REGISTER_URL, {
        ...data,
        accountStatus: "active",
        isVerified: false,
        verificationToken: "exampleVerificationToken123",
        isLoggedIn: false,
        parentId: data.parentId || user?.id,
      });
      return response;
    },
    onSuccess: (data: any) => {
      if (data.status) {
        toast.success("Sub shop created successfully");
        setShowAddModal(false);
        queryClient.invalidateQueries({ queryKey: ["sub-shops"] });
      } else {
        toast.error(data.message || "Failed to create sub shop");
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create sub shop");
    },
  });

  // Update Sub Shop Mutation
  const updateShopMutation = useMutation({
    mutationFn: async (data: Partial<SubShop> & { shopId: number }) => {
      const response = await AXIOS.post(`/profile?userId=${data.shopId}`, data);
      return response;
    },
    onSuccess: (data: any) => {
      if (data.status) {
        toast.success("Sub shop updated successfully");
        setShowEditModal(false);
        queryClient.invalidateQueries({ queryKey: ["sub-shops"] });
      } else {
        toast.error(data.message || "Failed to update sub shop");
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update sub shop");
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

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleCreateShop = (formData: Partial<SubShop>) => {
    createShopMutation.mutate({
      ...formData,
      ignoreEmailVerification: true,
      parentId: user?.id,
    });
  };

  // Form ref for edit modal validation
  const editFormRef = useRef<HTMLFormElement>(null);

  const handleUpdateShop = (formData: Partial<SubShop>) => {
    if (!selectedShop) return;
    updateShopMutation.mutate({ ...formData, shopId: selectedShop.id });
  };

  // Handler for edit form submission
  const handleEditFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleUpdateShop({
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      location: formData.get("location") as string,
      businessName: formData.get("businessName") as string,
      businessType: formData.get("businessType") as string,
      shopType: formData.get("shopType") as 'normal' | 'restaurant' | undefined,
      accountStatus: formData.get("accountStatus") as
        | "active"
        | "inactive",
      accountType: formData.get("accountType") as
        | "super admin"
        | "admin"
        | "shop",
      stuffCommission: formData.get("stuffCommission")
        ? Number(formData.get("stuffCommission"))
        : undefined,
    });
  };

  // Use ref to store latest handleEditFormSubmit to avoid stale closures
  const handleEditFormSubmitRef = useRef(handleEditFormSubmit);
  useEffect(() => {
    handleEditFormSubmitRef.current = handleEditFormSubmit;
  });

  // Global keyboard event listener for Enter key - works anytime edit modal is open
  useEffect(() => {
    if (!showEditModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Enter is pressed and not in a textarea
      if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        const isTextarea = target.tagName === "TEXTAREA";
        
        // If focused on textarea, allow normal Enter behavior for newlines
        if (isTextarea) return;
        
        // Prevent default to avoid form submission conflicts
        e.preventDefault();
        
        // Submit form if not currently processing
        if (!updateShopMutation.isPending) {
          // Get the form element and trigger validation
          const form = editFormRef.current;
          if (form) {
            // Check if form is valid (triggers HTML5 validation)
            if (form.checkValidity()) {
              // Form is valid, submit it
              handleEditFormSubmitRef.current(e as any);
            } else {
              // Form is invalid, trigger validation UI
              form.reportValidity();
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showEditModal, updateShopMutation.isPending]);

  return (
    <div className="md:p-3 space-y-6">
      {/* Header */}
      <div className="flex sm:flex-row flex-col sm:justify-between gap-2 sm:items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Other Shops</h1>
        <div className="flex sm:flex-row flex-col sm:justify-between gap-2 sm:items-center">
          {canManageSubShops && (
            <button
              onClick={() => {
                setSelectedShop(null);
                setShowAddModal(true);
              }}
              className="flex justify-center whitespace-nowrap items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              Add Sub Shop
            </button>
          )}
          <div className="flex gap-2">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by email..."
                value={filters.searchKey}
                onChange={handleFilterChange}
                name="searchKey"
                className="pl-10 w-full sm:w-fit pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 px-3 border rounded-lg hover:bg-gray-50"
            >
              <FaFilter className="text-gray-600" />
            </button>
          </div>
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
              <option value="shop">Shop</option>
            </select>
          </div>
        </div>
      )}

      {/* Shops Table */}
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
              ) : shopData?.users?.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No shops found
                  </td>
                </tr>
              ) : (
                shopData?.users?.map((shop) => (
                  <tr key={shop?.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {shop?.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {shop?.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {shop?.phoneNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {shop?.businessName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shop?.businessType}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shop?.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${shop?.accountStatus === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {shop?.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize whitespace-nowrap text-sm text-gray-500">
                      {shop?.shopType || "shop"}
                      {/* {shop?.accountType} */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canManageSubShops && (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => {
                              resetPasswordMutation.mutate({ email: shop.email });
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
                          <button
                            onClick={() => {
                              setSelectedShop(shop);
                              setShowEditModal(true);
                            }}
                            className="group relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-primary bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 transition-all duration-200"
                            title="Edit Shop Details"
                          >
                            <FaEdit className="w-4 h-4" />
                            <span className="hidden xl:inline">Edit</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {shopData && (
        <Pagination
          currentPage={filters.page}
          totalPages={shopData.pagination.totalPages}
          totalItems={shopData.pagination.totalItems}
          pageSize={filters.pageSize}
          hasNextPage={shopData.pagination.hasNextPage}
          hasPreviousPage={shopData.pagination.hasPreviousPage}
          onPageChange={handlePageChange}
        />
      )}

      {/* Add Sub Shop Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Sub Shop"
        className="max-w-2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreateShop({
              fullName: formData.get("fullName") as string,
              email: formData.get("email") as string,
              phoneNumber: formData.get("phoneNumber") as string,
              location: formData.get("location") as string,
              businessName: formData.get("businessName") as string,
              businessType: formData.get("businessType") as string,
              shopType: formData.get("shopType") as 'normal' | 'restaurant' | undefined,
              password: formData.get("password") as string,
              stuffCommission: formData.get("stuffCommission")
                ? Number(formData.get("stuffCommission"))
                : undefined,
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                What's your name?
              </label>
              <InputWithIcon
                type="text"
                name="fullName"
                icon={UserIcon}
                required
                placeholder="Enter full name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                What's your Email*
              </label>
              <InputWithIcon
                type="email"
                name="email"
                icon={EnvelopeIcon}
                required
                placeholder="Enter your email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                What's the Phone Number
              </label>
              <InputWithIcon
                type="tel"
                name="phoneNumber"
                icon={PhoneIcon}
                placeholder="Enter your number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Where is your location?*
              </label>
              <InputWithIcon
                type="text"
                name="location"
                icon={LocationIcon}
                required
                placeholder="Enter your location"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                What is your business name?*
              </label>
              <InputWithIcon
                type="text"
                name="businessName"
                icon={BusinessIcon}
                required
                placeholder="Enter your business name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                What kind of business do you run?*
              </label>
              <InputWithIcon
                type="text"
                name="businessType"
                icon={Category}
                required
                placeholder="Enter your business type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                What type of shop do you have?*
              </label>
              <select
                name="shopType"
                required
                defaultValue="normal"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm p-2"
              >
                <option value="normal">Normal Shop</option>
                <option value="restaurant">Restaurant</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password*
              </label>
              <InputWithIcon
                type="password"
                name="password"
                icon={LockIcon}
                required
                placeholder="Enter password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Stuff Sell Commission (%)
              </label>
              <InputWithIcon
                type="number"
                name="stuffCommission"
                icon={FaPercent}
                step="0.01"
                placeholder="Enter commission percentage"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createShopMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover rounded-md disabled:opacity-50"
            >
              {createShopMutation.isPending ? "Creating..." : "Add Sub Shop"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Sub Shop Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Sub Shop"
        className="max-w-2xl"
      >
        {selectedShop && (
          <form
            ref={editFormRef}
            onSubmit={handleEditFormSubmit}
            className="space-y-4"
          >
            {/* Show parent ID if selected shop id and parent id are different */}
            {selectedShop?.parentId &&
              selectedShop?.id !== selectedShop?.parentId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Parent ID:</span>{" "}
                    {selectedShop?.parentId}
                  </p>
                </div>
              )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <InputWithIcon
                  type="text"
                  name="fullName"
                  icon={<FiUser className="text-gray-400" />}
                  defaultValue={selectedShop?.fullName}
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
                  defaultValue={selectedShop?.email}
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
                  defaultValue={selectedShop.phoneNumber}
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
                  defaultValue={selectedShop.location}
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
                  defaultValue={selectedShop.businessName}
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
                  defaultValue={selectedShop.businessType}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shop Type*
                </label>
                <select
                  name="shopType"
                  defaultValue={selectedShop.shopType || "normal"}
                  required
                  className="mt-1 border rounded-md p-2 block w-full border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                >
                  <option value="normal">Normal Shop</option>
                  <option value="restaurant">Restaurant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Account Status
                </label>
                <select
                  name="accountStatus"
                  defaultValue={selectedShop.accountStatus}
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
                  defaultValue={selectedShop.accountType}
                  required
                  className="mt-1 block border p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                >
                  <option value="super admin">Super Admin</option>
                  <option value="shop">Shop</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stuff Sell Commission (%)
                </label>
                <InputWithIcon
                  type="number"
                  name="stuffCommission"
                  icon={FaPercent}
                  step="0.01"
                  defaultValue={selectedShop.stuffCommission?.toString() || ""}
                  placeholder="Enter commission percentage"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
                />
              </div>
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
                disabled={updateShopMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover rounded-md disabled:opacity-50"
              >
                {updateShopMutation.isPending
                  ? "Updating..."
                  : "Update Sub Shop"}
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

export default OtherShops;
