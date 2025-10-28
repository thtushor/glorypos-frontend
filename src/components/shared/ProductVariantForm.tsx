/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaPlus, FaTimes, FaImage } from "react-icons/fa";
import { toast } from "react-toastify";
import AXIOS from "@/api/network/Axios";
import {
  COLORS_URL,
  PRODUCT_VARIANTS_URL,
  DELETE_PRODUCT_VARIANTS_URL,
  UPDATE_PRODUCT_VARIANTS_URL,
  SIZES_URL,
} from "@/api/api";
import { uploadFile } from "@/utils/utils";
import Spinner from "../Spinner";

interface ProductVariantFormProps {
  productId?: number;
  onSuccess?: () => void;
}

interface VariantFormData {
  id?: number;
  sku: string;
  status: "active" | "inactive";
  ProductId?: number;
  ColorId: number;
  SizeId: number;
  quantity: number;
  imageUrl: string | null;
}

const ProductVariantForm: React.FC<ProductVariantFormProps> = ({
  productId,
  onSuccess,
}) => {
  const [variants, setVariants] = useState<VariantFormData[]>([]);

  // const [imagePreview, setImagePreview] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const [isUplaodingImage, setIsUplaodingImage] = useState<{
    [key: number]: boolean;
  }>({});

  // Fetch colors and sizes
  const { data: colors = [] } = useQuery({
    queryKey: ["colors"],
    queryFn: async () => {
      const response = await AXIOS.get(COLORS_URL);
      return response.data;
    },
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["sizes"],
    queryFn: async () => {
      const response = await AXIOS.get(SIZES_URL);
      return response.data;
    },
  });

  // Add query to fetch variants
  const { data: existingVariants = [], isLoading: isLoadingVariants } =
    useQuery({
      queryKey: ["variants", productId],
      queryFn: async () => {
        if (!productId) return [];
        const response = await AXIOS.get(PRODUCT_VARIANTS_URL, {
          params: {
            ProductId: productId,
          },
        });
        return response.data;
      },
      enabled: !!productId, // Only run query if productId exists
    });

  // Update variants when existingVariants changes
  useEffect(() => {
    if (existingVariants?.length > 0) {
      setVariants(
        existingVariants.map((variant: any) => ({
          id: variant.id,
          sku: variant.sku,
          status: variant.status,
          ProductId: variant.ProductId,
          ColorId: variant.ColorId,
          SizeId: variant.SizeId,
          quantity: variant.quantity,
          imageUrl: variant.imageUrl,
        }))
      );
    }
  }, [existingVariants]);

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: (data: VariantFormData) =>
      AXIOS.post(PRODUCT_VARIANTS_URL, data),
    onSuccess: () => {
      toast.success("Variant added successfully");
      queryClient.invalidateQueries({ queryKey: ["variants", productId] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to add variant");
    },
  });

  // Add update mutation
  const updateVariantMutation = useMutation({
    mutationFn: (data: VariantFormData) =>
      AXIOS.post(`${UPDATE_PRODUCT_VARIANTS_URL}/${data.id}`, data),
    onSuccess: () => {
      toast.success("Variant updated successfully");
      queryClient.invalidateQueries({ queryKey: ["variants", productId] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update variant");
    },
  });

  // Add delete mutation
  const deleteVariantMutation = useMutation({
    mutationFn: (id: number) =>
      AXIOS.post(`${DELETE_PRODUCT_VARIANTS_URL}/${id}`),
    onSuccess: (data: any, argx: any) => {
      console.log({ data, argx });
      toast.success("Variant deleted successfully");
      if (data.status) {
        setVariants(variants.filter((variant) => variant.id !== argx));
      }
      queryClient.invalidateQueries({ queryKey: ["variants", productId] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete variant");
    },
  });

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        sku: "",
        status: "active",
        ProductId: productId,
        ColorId: 0,
        SizeId: 0,
        quantity: 0,
        imageUrl: null,
      },
    ]);
  };

  const handleRemoveVariant = async (index: number, variantId?: number) => {
    if (variantId) {
      if (window.confirm("Are you sure you want to delete this variant?")) {
        deleteVariantMutation.mutate(variantId);
      }
    } else {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleVariantChange = (
    index: number,
    field: keyof VariantFormData,
    value: any
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setIsUplaodingImage((prev) => ({ ...prev, [index]: false }));
    setVariants(newVariants);
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setIsUplaodingImage((prev) => ({ ...prev, [index]: true }));
      const imageUrl = await uploadFile(file);
      if (imageUrl) {
        handleVariantChange(index, "imageUrl", imageUrl);
      }
    } catch (error) {
      toast.error("Error uploading image");
    } finally {
      setIsUplaodingImage((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleSaveVariant = (variant: VariantFormData) => {
    if (variant.id) {
      updateVariantMutation.mutate(variant);
    } else {
      createVariantMutation.mutate(variant);
    }
  };

  console.log({ isUplaodingImage });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Product Variants
          </h3>
          <p className="text-sm text-gray-500">
            Add different combinations of size and color
          </p>
        </div>
        <button
          onClick={handleAddVariant}
          disabled={!productId}
          type="button"
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-all
            ${
              productId
                ? "text-white bg-brand-primary hover:bg-brand-hover"
                : "text-gray-500 bg-gray-100 cursor-not-allowed"
            }`}
        >
          <FaPlus className="mr-2 h-4 w-4" />
          Add Variant
        </button>
      </div>

      {/* Loading State */}
      {isLoadingVariants ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="32px" color="#32cd32" />
        </div>
      ) : (
        <>
          {/* Variants Grid */}
          <div className="grid grid-cols-1 gap-6">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="relative p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(index, variant.id)}
                  className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FaTimes className="h-5 w-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Variant Image */}
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variant Image
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      {isUplaodingImage[index] ? <Spinner size="32px" color="#32cd32" /> :  <>
                      {variant.imageUrl ? (
                          <div className="relative group w-full h-full">
                            <img
                              src={variant.imageUrl || ""}
                              alt="Variant preview"
                              className="mx-auto h-64 w-auto rounded-md object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <FaTimes className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FaImage className="w-8 h-8 mb-4 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 10MB
                            </p>
                          </div>
                        )}
                      </>}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(index, file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) =>
                        handleVariantChange(index, "sku", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                      placeholder="Enter SKU"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <select
                      value={variant.ColorId}
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          "ColorId",
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                    >
                      <option value="">Select Color</option>
                      {colors.map((color: any) => (
                        <option key={color.id} value={color.id}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size
                    </label>
                    <select
                      value={variant.SizeId}
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          "SizeId",
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                    >
                      <option value="">Select Size</option>
                      {sizes.map((size: any) => (
                        <option key={size.id} value={size.id}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={variant.quantity}
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                      placeholder="Enter quantity"
                      min="0"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={variant.status}
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          "status",
                          e.target.value as "active" | "inactive"
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleSaveVariant(variant)}
                    type="button"
                    disabled={
                      createVariantMutation.isPending ||
                      updateVariantMutation.isPending ||
                      deleteVariantMutation.isPending ||
                      isUplaodingImage[index]
                    }
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-hover shadow-sm disabled:opacity-50"
                  >
                    {createVariantMutation.isPending ||
                    updateVariantMutation.isPending ||
                    deleteVariantMutation.isPending ||
                    isUplaodingImage[index] ? (
                      <Spinner size="16px" color="#ffffff" className="mr-4" />
                    ) : variant.id ? (
                      "Update Variant"
                    ) : (
                      "Save Variant"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {variants.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FaImage className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No variants
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {productId
                  ? "Get started by adding a new variant"
                  : "Save the product first to add variants"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductVariantForm;
