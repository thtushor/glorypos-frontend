import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaTags } from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import {
  CATEGORY_URL,
  DELETE_CATEGORY_URL,
  UPDATE_CATEGORY_URL,
} from "@/api/api";
import Spinner from "@/components/Spinner";
import InputWithIcon from "@/components/InputWithIcon";
import InventoryFilters from "@/components/shared/InventoryFilters";

interface User {
  id: number;
  fullName: string;
  email: string;
  businessName: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  status: "active" | "inactive";
  UserId: number;
  User?: User;
}

interface CategoryFormData {
  id: number | undefined;
  name: string;
  description: string;
  status: "active" | "inactive";
}

const Categories = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    id: undefined,
    name: "",
    description: "",
    status: "active",
  });

  // Filter states
  const [searchKey, setSearchKey] = useState("");
  const [shopId, setShopId] = useState("");

  // Fetch Categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", searchKey, shopId],
    queryFn: async () => {
      const params: { searchKey?: string; shopId?: string } = {};
      if (searchKey) params.searchKey = searchKey;
      if (shopId) params.shopId = shopId;
      const response = await AXIOS.get(CATEGORY_URL, { params });
      return response.data;
    },
  });

  // Create Category Mutation
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => AXIOS.post(CATEGORY_URL, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create category");
    },
  });

  // Update Category Mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: CategoryFormData }) =>
      AXIOS.post(`${UPDATE_CATEGORY_URL}/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully");
      setIsModalOpen(false);
      setEditingCategory(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update category");
    },
  });

  // Delete Category Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => AXIOS.post(`${DELETE_CATEGORY_URL}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete category");
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

  const handleEdit = (category: Category) => {
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      id: undefined,
      name: "",
      description: "",
      status: "active",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Categories</h1>
          <p className="text-sm text-gray-600">
            Manage your product categories
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Filters */}
      <InventoryFilters
        searchKey={searchKey}
        shopId={shopId}
        onSearchKeyChange={setSearchKey}
        onShopIdChange={setShopId}
        searchPlaceholder="Search categories..."
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
                  Description
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
              ) : categories?.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No categories found
                  </td>
                </tr>
              ) : (
                categories?.map((category: Category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaTags className="w-5 h-5 text-brand-primary mr-2" />
                        <span className="font-medium text-gray-900">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 truncate max-w-md">
                        {category.description || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {category.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {category.User?.businessName || category.User?.fullName || "N/A"}
                        </div>
                        <div className="text-gray-500">
                          ID: {category.User?.id || category.UserId || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name*
                </label>
                <InputWithIcon
                  icon={FaTags}
                  name="name"
                  type="text"
                  required
                  placeholder="Enter category name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
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
                  placeholder="Enter category description"
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
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Spinner
                      size="16px"
                      color="#ffffff"
                      className="mx-4 my-1"
                    />
                  ) : formData?.id ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
