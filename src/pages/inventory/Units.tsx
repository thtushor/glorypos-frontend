import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaRuler } from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import { UNITS_URL, DELETE_UNITS_URL, UPDATE_UNITS_URL } from "@/api/api";
import Spinner from "@/components/Spinner";
import InputWithIcon from "@/components/InputWithIcon";
import Modal from "@/components/Modal";
import InventoryFilters from "@/components/shared/InventoryFilters";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";

interface User {
  id: number;
  fullName: string;
  email: string;
  businessName: string;
}

interface Unit {
  id: number;
  name: string;
  shortName: string;
  status: "active" | "inactive";
  UserId: number;
  User?: User;
}

interface UnitFormData {
  id: number | undefined;
  name: string;
  shortName: string;
  status: "active" | "inactive";
}

const Units = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const canManageUnits = hasPermission(PERMISSIONS.INVENTORY.MANAGE_UNITS);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<UnitFormData>({
    id: undefined,
    name: "",
    shortName: "",
    status: "active",
  });
  const formRef = useRef<HTMLFormElement>(null);

  // Filter states
  const [searchKey, setSearchKey] = useState("");
  const [shopId, setShopId] = useState(user?.id?.toString() || "");

  // Fetch Units
  const { data: units, isLoading } = useQuery({
    queryKey: ["units", searchKey, shopId],
    queryFn: async () => {
      const params: { searchKey?: string; shopId?: string } = {};
      if (searchKey) params.searchKey = searchKey;
      if (shopId) params.shopId = shopId;
      const response = await AXIOS.get(UNITS_URL, { params });
      return response.data;
    },
  });

  // Create Unit Mutation
  const createMutation = useMutation({
    mutationFn: (data: UnitFormData) => AXIOS.post(UNITS_URL, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit created successfully");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create unit");
    },
  });

  // Update Unit Mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: UnitFormData }) =>
      AXIOS.post(`${UPDATE_UNITS_URL}/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit updated successfully");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update unit");
    },
  });

  // Delete Unit Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => AXIOS.post(`${DELETE_UNITS_URL}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Unit deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete unit");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      updateMutation.mutate({
        id: formData.id,
        updates: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Use ref to store latest handleSubmit to avoid stale closures
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  const handleEdit = (unit: Unit) => {
    setFormData({
      id: unit.id,
      name: unit.name,
      shortName: unit.shortName,
      status: unit.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this unit?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      id: undefined,
      name: "",
      shortName: "",
      status: "active",
    });
  };

  // Global keyboard event listener for Enter key - works anytime modal is open
  useEffect(() => {
    if (!isModalOpen) return;

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
        if (!createMutation.isPending && !updateMutation.isPending) {
          // Get the form element and trigger validation
          const form = formRef.current;
          if (form) {
            // Check if form is valid (triggers HTML5 validation)
            if (form.checkValidity()) {
              // Form is valid, submit it
              handleSubmitRef.current(e as any);
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
  }, [isModalOpen, createMutation.isPending, updateMutation.isPending]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex sm:flex-row flex-col sm:justify-between gap-2 sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Units</h1>
          <p className="text-sm text-gray-600">Manage your product units</p>
        </div>
        {canManageUnits && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex justify-center items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add Unit</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <InventoryFilters
        searchKey={searchKey}
        shopId={shopId}
        onSearchKeyChange={setSearchKey}
        onShopIdChange={setShopId}
        searchPlaceholder="Search units..."
      />

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Short Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
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
              ) : units?.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No units found
                  </td>
                </tr>
              ) : (
                units?.map((unit: Unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaRuler className="w-5 h-5 text-brand-primary mr-2" />
                        <span className="font-medium text-gray-900">
                          {unit.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{unit.shortName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${unit.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                          }`}
                      >
                        {unit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {unit.User?.businessName ||
                            unit.User?.fullName ||
                            "N/A"}
                        </div>
                        <div className="text-gray-500">
                          ID: {unit.User?.id || unit.UserId || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-3">
                        {canManageUnits && (
                          <>
                            <button
                              onClick={() => handleEdit(unit)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit Unit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(unit.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete Unit"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? "Edit Unit" : "Add Unit"}
      >
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name*
            </label>
            <InputWithIcon
              icon={FaRuler}
              name="name"
              type="text"
              required
              placeholder="Enter unit name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Name*
            </label>
            <InputWithIcon
              icon={FaRuler}
              name="shortName"
              type="text"
              required
              placeholder="Enter short name"
              value={formData.shortName}
              onChange={(e) =>
                setFormData({ ...formData, shortName: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status*
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "active" | "inactive",
                })
              }
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary flex`}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Spinner size="16px" color="#ffffff" className="mx-4 my-1" />
              ) : formData?.id ? (
                "Update"
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Units;
