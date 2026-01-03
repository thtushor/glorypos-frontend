import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
// import { FaCalendar, FaSearch } from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import { SUBSCRIBE_USER_PLAN, SUBSCRIBE_CONFIRM } from "@/api/api";
import Spinner from "@/components/Spinner";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import { format } from "date-fns";
import money from "@/utils/money";

interface User {
  id: number;
  fullName: string;
  email: string;
  businessName: string;
  phoneNumber: string;
  location: string;
  businessType: string;
  accountStatus: string;
  accountType: string;
}

interface Plan {
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
}

interface Subscription {
  id: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  paymentStatus: "pending" | "completed" | "failed";
  paymentMethod: "cash" | "card";
  amount: string;
  discount: string;
  coupon: string | null;
  UserId: number;
  SubscriptionPlanId: number;
  User: User;
  SubscriptionPlan: Plan;
}

const UserSubscriptions = () => {
  const queryClient = useQueryClient();
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    searchKey: "",
    status: "",
    paymentStatus: "",
    paymentMethod: "",
    page: 1,
    pageSize: 10,
  });

  // Fetch Subscriptions
  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ["subscriptions", filters],
    queryFn: async () => {
      const response = await AXIOS.get(SUBSCRIBE_USER_PLAN, {
        params: filters,
      });
      return response.data;
    },
  });

  // Confirm Subscription Mutation
  const confirmSubscriptionMutation = useMutation({
    mutationFn: async (data: {
      paymentMethod: "cash" | "card";
      paymentStatus: "pending" | "completed" | "failed";
      status: "active" | "expired" | "cancelled";
    }) => {
      if (!selectedSubscription) throw new Error("No subscription selected");
      return AXIOS.post(
        `${SUBSCRIBE_CONFIRM}/${selectedSubscription.id}`,
        data
      );
    },
    onSuccess: () => {
      toast.success("Subscription status updated successfully");
      setShowConfirmModal(false);
      setSelectedSubscription(null);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update subscription status");
    },
  });

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleConfirmSubscription = (data: {
    paymentMethod: "cash" | "card";
    paymentStatus: "pending" | "completed" | "failed";
    status: "active" | "expired" | "cancelled";
  }) => {
    confirmSubscriptionMutation.mutate(data);
  };

  console.log({ subscriptionData });

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by business name or email..."
              className="w-full px-4 py-2 border rounded-lg"
              value={filters.searchKey}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchKey: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-4">
            <input
              type="date"
              className="px-4 py-2 border rounded-lg"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
            <input
              type="date"
              className="px-4 py-2 border rounded-lg"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
            <select
              className="px-4 py-2 border rounded-lg"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="px-4 py-2 border rounded-lg"
              value={filters.paymentStatus}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  paymentStatus: e.target.value,
                }))
              }
            >
              <option value="">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center  py-4">
                  <div className="flex justify-center items-center w-full">
                    <Spinner color="#32cd32" size="40px" />
                  </div>
                </td>
              </tr>
            ) : (subscriptionData?.subscriptions || []).length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  No subscriptions found
                </td>
              </tr>
            ) : (
              subscriptionData?.subscriptions.map(
                (subscription: Subscription) => (
                  <tr key={subscription.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.User.businessName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subscription.User.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        {subscription.User.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.SubscriptionPlan.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {money.format(Number(subscription.amount))}
                        {subscription.discount !== "0.00" && (
                          <span className="text-green-500 ml-2">
                            (-{money.format(Number(subscription.discount))})
                          </span>
                        )}
                      </div>
                      {subscription.coupon && (
                        <div className="text-xs text-blue-500">
                          Coupon: {subscription.coupon}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {format(
                          new Date(subscription.startDate),
                          "MMM d, yyyy"
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        to{" "}
                        {format(new Date(subscription.endDate), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 capitalize">
                        {subscription.paymentMethod}
                      </div>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${subscription.paymentStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : subscription.paymentStatus === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {subscription.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${subscription.status === "active"
                            ? "bg-green-100 text-green-800"
                            : subscription.status === "expired"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedSubscription(subscription);
                          setShowConfirmModal(true);
                        }}
                        className="text-brand-primary hover:text-brand-hover"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {subscriptionData && (
        <div className="px-6 py-4">
          <Pagination
            currentPage={subscriptionData.pagination.page}
            totalPages={subscriptionData.pagination.totalPages}
            totalItems={subscriptionData.pagination.totalItems}
            pageSize={filters.pageSize}
            hasNextPage={subscriptionData.pagination.hasNextPage}
            hasPreviousPage={subscriptionData.pagination.hasPreviousPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Status Update Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedSubscription(null);
        }}
        title="Update Subscription Status"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleConfirmSubscription({
              paymentMethod: formData.get("paymentMethod") as "cash" | "card",
              paymentStatus: formData.get("paymentStatus") as
                | "pending"
                | "completed"
                | "failed",
              status: formData.get("status") as
                | "active"
                | "expired"
                | "cancelled",
            });
          }}
          className="space-y-4 p-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              defaultValue={selectedSubscription?.paymentMethod}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Status
            </label>
            <select
              name="paymentStatus"
              defaultValue={selectedSubscription?.paymentStatus}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subscription Status
            </label>
            <select
              name="status"
              defaultValue={selectedSubscription?.status}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={confirmSubscriptionMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-hover disabled:opacity-50 flex items-center gap-2"
            >
              {confirmSubscriptionMutation.isPending ? (
                <Spinner size="16px" color="#ffffff" />
              ) : (
                "Update Status"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserSubscriptions;
