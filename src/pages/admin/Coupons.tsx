import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaTicketAlt } from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import { COUPONS_URL, DELETE_COUPON_URL } from "@/api/api";
import InputWithIcon from "@/components/InputWithIcon";
import { format } from "date-fns";
import money from "@/utils/money";

interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  status: "active" | "inactive" | "expired";
  description?: string;
}

type CouponFormData = Omit<Coupon, "usedCount"> & {
  id?: number;
};

const formatDateForInput = (date: string | Date): string => {
  const d = new Date(date);
  return format(d, "yyyy-MM-dd");
};

const Coupons = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    id: 0,
    code: "",
    type: "percentage",
    value: 0,
    maxUses: 1,
    startDate: formatDateForInput(new Date()),
    endDate: formatDateForInput(new Date()),
    minPurchaseAmount: 0,
    maxDiscountAmount: 0,
    status: "active",
    description: "",
  });

  // Fetch Coupons
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const response = await AXIOS.get(COUPONS_URL);
      return response.data;
    },
  });

  // Create Coupon Mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => AXIOS.post(COUPONS_URL, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon created successfully");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create coupon");
    },
  });

  // Update Coupon Mutation
  const updateMutation = useMutation({
    mutationFn: (data: Coupon) => AXIOS.put(`${COUPONS_URL}/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon updated successfully");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update coupon");
    },
  });

  // Delete Coupon Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => AXIOS.post(`${DELETE_COUPON_URL}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deleted successfully");
      setIsDeleteModalOpen(false);
      setCouponToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete coupon");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ("id" in formData && formData.id) {
      updateMutation.mutate(formData as Coupon);
    } else {
      const { ...submitData } = formData;
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    const { id, ...rest } = coupon;
    setFormData({
      ...rest,
      startDate: formatDateForInput(rest.startDate),
      endDate: formatDateForInput(rest.endDate),
      id,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (couponToDelete) {
      deleteMutation.mutate(couponToDelete.id);
    }
  };
  const resetForm = () => {
    setFormData({
      id: 0,
      code: "",
      type: "percentage",
      value: 0,
      maxUses: 1,
      startDate: formatDateForInput(new Date()),
      endDate: formatDateForInput(new Date()),
      minPurchaseAmount: 0,
      maxDiscountAmount: 0,
      status: "active",
      description: "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner color="#32cd32" size="40px" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Coupons</h1>
        <button
          onClick={() => {
            setIsModalOpen(true);
            resetForm();
          }}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-hover"
        >
          <FaPlus className="w-4 h-4 mr-2" />
          Add Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon: Coupon) => (
          <div
            key={coupon.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {coupon.code}
                </h3>
                <p className="text-sm text-gray-500">{coupon.description}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${coupon.status === "active"
                    ? "bg-green-100 text-green-800"
                    : coupon.status === "expired"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
              >
                {coupon.status}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-medium">
                  {coupon.type === "percentage"
                    ? `${coupon.value}%`
                    : money.format(coupon.value)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Usage</span>
                <span className="font-medium">
                  {coupon.usedCount} / {coupon.maxUses}
                </span>
              </div>

              {coupon.minPurchaseAmount && coupon.minPurchaseAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Min. Purchase</span>
                  <span className="font-medium">
                    {money.format(coupon.minPurchaseAmount)}
                  </span>
                </div>
              )}

              {coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Max. Discount</span>
                  <span className="font-medium">
                    {money.format(coupon.maxDiscountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Valid Period</span>
                <span className="font-medium">
                  {format(new Date(coupon.startDate), "MMM d, yyyy")} -{" "}
                  {format(new Date(coupon.endDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => handleEdit(coupon)}
                className="p-2 text-gray-600 hover:text-brand-primary"
              >
                <FaEdit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(coupon)}
                className="p-2 text-gray-600 hover:text-red-500"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={`${formData.id ? "Edit" : "Create"} Coupon`}
      >
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Coupon Code*
              </label>
              <InputWithIcon
                required
                name="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Enter coupon code..."
                icon={FaTicketAlt}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type*
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "percentage" | "fixed",
                      value: 0,
                    })
                  }
                  className="mt-1 block w-full rounded-md border p-2 border-gray-300"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Value*
                </label>
                <InputWithIcon
                  type="number"
                  required
                  min="0"
                  max={formData.type === "percentage" ? "100" : undefined}
                  step="0.01"
                  name="value"
                  value={formData.value.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      value: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date*
                </label>
                <InputWithIcon
                  type="date"
                  required
                  name="startDate"
                  value={formData.startDate}
                  max={formData.endDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date*
                </label>
                <InputWithIcon
                  type="date"
                  required
                  name="endDate"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Uses*
                </label>
                <InputWithIcon
                  type="number"
                  required
                  min="1"
                  name="maxUses"
                  value={formData.maxUses.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxUses: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status*
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as Coupon["status"],
                    })
                  }
                  className="mt-1 block w-full rounded-md border p-2 border-gray-300"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Min Purchase Amount
                </label>
                <InputWithIcon
                  type="number"
                  min="0"
                  step="0.01"
                  name="minPurchaseAmount"
                  value={formData.minPurchaseAmount?.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minPurchaseAmount: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Discount Amount
                </label>
                <InputWithIcon
                  type="number"
                  min="0"
                  step="0.01"
                  name="maxDiscountAmount"
                  value={formData.maxDiscountAmount?.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscountAmount: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <InputWithIcon
                type="textarea"
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                placeholder="Enter coupon description..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm flex font-medium text-white bg-brand-primary rounded-md hover:bg-brand-hover disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Spinner size="16px" color="#ffffff" className="mx-4 my-1" />
              ) : formData.id ? (
                "Update Coupon"
              ) : (
                "Create Coupon"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCouponToDelete(null);
        }}
        title="Delete Coupon"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete the coupon "{couponToDelete?.code}"?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="px-4 flex py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50"
            >
              {deleteMutation.isPending ? (
                <Spinner size="16px" color="#ffffff" className="mx-4 my-1" />
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Coupons;
