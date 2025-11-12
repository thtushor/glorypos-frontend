import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaPalette } from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import { COLORS_URL, DELETE_COLORS_URL, UPDATE_COLORS_URL } from "@/api/api";
import Spinner from "@/components/Spinner";
import InputWithIcon from "@/components/InputWithIcon";
import Modal from "@/components/Modal";
import InventoryFilters from "@/components/shared/InventoryFilters";

interface Color {
  id: number;
  name: string;
  code: string;
  description: string;
  status: "active" | "inactive";
  UserId: number;
}

interface ColorFormData {
  id: number | undefined;
  name: string;
  code: string;
  description: string;
  status: "active" | "inactive";
}

const Colors = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ColorFormData>({
    id: undefined,
    name: "",
    code: "#000000",
    description: "",
    status: "active",
  });

  // Filter states
  const [searchKey, setSearchKey] = useState("");
  const [shopId, setShopId] = useState("");

  // Fetch Colors
  const { data: colors, isLoading } = useQuery({
    queryKey: ["colors", searchKey, shopId],
    queryFn: async () => {
      const params: { searchKey?: string; shopId?: string } = {};
      if (searchKey) params.searchKey = searchKey;
      if (shopId) params.shopId = shopId;
      const response = await AXIOS.get(COLORS_URL, { params });
      return response.data;
    },
  });

  // Create Color Mutation
  const createMutation = useMutation({
    mutationFn: (data: ColorFormData) => AXIOS.post(COLORS_URL, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      toast.success("Color created successfully");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create color");
    },
  });

  // Update Color Mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: ColorFormData }) =>
      AXIOS.post(`${UPDATE_COLORS_URL}/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      toast.success("Color updated successfully");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update color");
    },
  });

  // Delete Color Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => AXIOS.post(`${DELETE_COLORS_URL}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      toast.success("Color deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete color");
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

  const handleEdit = (color: Color) => {
    setFormData({
      id: color.id,
      name: color.name,
      code: color.code,
      description: color.description,
      status: color.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this color?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      id: undefined,
      name: "",
      code: "#000000",
      description: "",
      status: "active",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Colors</h1>
          <p className="text-sm text-gray-600">Manage your product colors</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          <span>Add Color</span>
        </button>
      </div>

      {/* Filters */}
      <InventoryFilters
        searchKey={searchKey}
        shopId={shopId}
        onSearchKeyChange={setSearchKey}
        onShopIdChange={setShopId}
        searchPlaceholder="Search colors..."
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
                  Color Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
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
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center w-full">
                      <Spinner color="#32cd32" size="40px" />
                    </div>
                  </td>
                </tr>
              ) : (
                colors?.map((color: Color) => (
                  <tr key={color.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaPalette className="w-5 h-5 text-brand-primary mr-2" />
                        <span className="font-medium text-gray-900">
                          {color.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded border`}
                          style={{ backgroundColor: color.code }}
                        />
                        <span>{color.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 truncate max-w-md">
                        {color.description || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          color.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {color.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(color)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(color.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash className="w-4 h-4" />
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? "Edit Color" : "Add Color"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name*
            </label>
            <InputWithIcon
              icon={FaPalette}
              name="name"
              type="text"
              required
              placeholder="Enter color name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Code*
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="h-10 w-20"
              />
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="flex-1 appearance-none relative block px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              rows={3}
              placeholder="Enter color description"
              // required
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

export default Colors;
