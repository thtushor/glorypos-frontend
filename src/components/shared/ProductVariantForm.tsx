/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaPlus, FaTimes, FaImage, FaCloudUploadAlt } from "react-icons/fa";
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
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

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
  images?: string[]; // Renamed from imageUrls
  imageFiles?: File[]; // Multiple image files support
}

const ProductVariantForm: React.FC<ProductVariantFormProps> = ({
  productId,
  onSuccess,
}) => {
  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const { hasPermission } = usePermission();

  // Permission check
  const canAdjustStock = hasPermission(PERMISSIONS.INVENTORY.ADJUST_STOCK);

  // const [imagePreviews, setImagePreviews] = useState<string[][]>([]); // Removed: now derived

  // const [imagePreview, setImagePreview] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const [isUplaodingImage, setIsUplaodingImage] = useState<{
    [key: number]: boolean;
  }>({});

  // Removed updateVariantImages helper function - now direct state updates

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
          images: Array.isArray(variant.images) ? variant.images : [], // Use images here
          imageFiles: [],
        }))
      );
      // Removed setImagePreviews initialization
    } else {
      setVariants([]);
      // Removed setImagePreviews([]) here as well
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
        setVariants((prevVariants) =>
          prevVariants.filter((variant) => variant.id !== argx)
        );
        // Removed setImagePreviews update here
      }
      queryClient.invalidateQueries({ queryKey: ["variants", productId] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete variant");
    },
  });

  const handleAddVariant = () => {
    setVariants((prevVariants) => [
      ...prevVariants,
      {
        sku: "",
        status: "active",
        ProductId: productId,
        ColorId: 0,
        SizeId: 0,
        quantity: 0,
        imageUrl: null,
        images: [], // Use images here
        imageFiles: [],
      },
    ]);
    // Removed setImagePreviews update here
  };

  const handleRemoveVariant = async (index: number, variantId?: number) => {
    if (variantId) {
      if (window.confirm("Are you sure you want to delete this variant?")) {
        deleteVariantMutation.mutate(variantId);
      }
    } else {
      setVariants((prevVariants) => prevVariants.filter((_, i) => i !== index));
      // Removed setImagePreviews update here
    }
  };

  const handleVariantChange = (
    index: number,
    field: keyof VariantFormData,
    value: any
  ) => {
    setVariants((prevVariants) => {
      const newVariants = [...prevVariants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return newVariants;
    });
    setIsUplaodingImage((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageUpload = async (
    index: number,
    files: FileList | null,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!files || files.length === 0) return;

    try {
      setIsUplaodingImage((prev) => ({ ...prev, [index]: true }));
      const fileArray = Array.from(files);
      const currentVariant = variants[index];
      const existingImages = currentVariant.images || [];
      // const existingImageFiles = currentVariant.imageFiles || [];

      let newImages = [...existingImages];
      // const newImageFiles = [...existingImageFiles, ...fileArray];

      // Upload new files if there are any pending uploads
      if (fileArray.length > 0) {
        const uploadedImages = await uploadFile(fileArray);
        if (uploadedImages) {
          const uploadedUrls = Array.isArray(uploadedImages)
            ? uploadedImages.map((u) => u.original)
            : [uploadedImages.original];
          newImages = [...newImages, ...uploadedUrls];
          // Clear files that were just uploaded from newImageFiles
          // This assumes successful upload means the file objects are no longer needed in imageFiles
          // This is a simplification; a more robust solution might track which files correspond to which URLs
          // For now, we'll just clear existingImageFiles and only keep the new fileArray in imageFiles temporarily for display before upload.
        }
      }

      setVariants((prevVariants) => {
        const updatedVariants = [...prevVariants];
        updatedVariants[index] = {
          ...updatedVariants[index],
          images: newImages,
          imageFiles: [], // Clear pending files after upload attempt
          imageUrl: newImages.length > 0 ? newImages[0] : null,
        };
        return updatedVariants;
      });
    } catch (error) {
      toast.error("Error uploading images");
    } finally {
      setIsUplaodingImage((prev) => ({ ...prev, [index]: false }));
    }
    if (event && event.target) {
      event.target.value = "";
    }
  };

  const handleRemoveVariantImage = (
    variantIndex: number,
    imageIndex: number
  ) => {
    setVariants((prevVariants) => {
      const updatedVariants = [...prevVariants];
      const variant = updatedVariants[variantIndex];

      const currentImages = variant.images || [];
      const currentImageFiles = variant.imageFiles || [];

      // Combine for previews to find the removed item
      const combinedPreviews = currentImages.concat(
        currentImageFiles.map((file) => URL.createObjectURL(file))
      );
      const removedPreview = combinedPreviews[imageIndex];

      let newImages = [...currentImages];
      const newImageFiles = [...currentImageFiles];

      if (
        removedPreview.startsWith("blob:") ||
        removedPreview.startsWith("data:")
      ) {
        // It's a newly uploaded image preview (from imageFiles)
        const fileToRemoveIndex = newImageFiles.findIndex(
          (file) => URL.createObjectURL(file) === removedPreview
        );
        if (fileToRemoveIndex !== -1) {
          URL.revokeObjectURL(removedPreview); // Clean up the object URL
          newImageFiles.splice(fileToRemoveIndex, 1);
        }
      } else {
        // It's an existing image URL (from images)
        newImages = newImages.filter((url) => url !== removedPreview);
      }

      updatedVariants[variantIndex] = {
        ...variant,
        images: newImages,
        imageFiles: newImageFiles,
        imageUrl: newImages.length > 0 ? newImages[0] : null,
      };
      return updatedVariants;
    });
  };

  const handleSaveVariant = (variant: VariantFormData) => {
    // Ensure imageFiles are empty or uploaded before saving
    if (variant.imageFiles && variant.imageFiles.length > 0) {
      toast.error("Please wait for images to upload or remove pending images.");
      return;
    }
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
            ${productId
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
            {variants.map((variant, index) => {
              const allImages = [
                ...(variant.images || []),
                ...(variant.imageFiles || []).map((file) =>
                  URL.createObjectURL(file)
                ),
              ];
              return (
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
                    {/* Variant Images */}
                    <div className="lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variant Images
                      </label>

                      {/* Image Previews Grid */}
                      {allImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                          {allImages.map((preview, imgIndex) => (
                            <div key={imgIndex} className="relative group">
                              <img
                                src={preview}
                                alt={`Variant preview ${imgIndex + 1}`}
                                className="w-full h-48 object-cover rounded-md border border-gray-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveVariantImage(index, imgIndex)
                                  }
                                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <FaTimes className="w-5 h-5" />
                                </button>
                              </div>
                              {imgIndex === 0 && (
                                <div className="absolute top-2 left-2 bg-brand-primary text-white text-xs px-2 py-1 rounded">
                                  Primary
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Area */}
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:border-brand-primary transition-colors">
                        <div className="space-y-1 text-center">
                          {isUplaodingImage[index] ? (
                            <div className="flex items-center justify-center h-64 w-auto rounded-md object-cover">
                              <Spinner
                                size="32px"
                                color="#32cd32"
                                className="mx-4 my-1"
                              />
                            </div>
                          ) : (
                            <>
                              <FaCloudUploadAlt className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor={`variant-images-${index}`}
                                  className="relative cursor-pointer rounded-md font-medium text-brand-primary hover:text-brand-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-primary"
                                >
                                  <span>Upload files</span>
                                  <input
                                    id={`variant-images-${index}`}
                                    name={`variant-images-${index}`}
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) =>
                                      handleImageUpload(
                                        index,
                                        e.target.files,
                                        e
                                      )
                                    }
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, GIF up to 10MB (Multiple images
                                supported)
                              </p>
                            </>
                          )}
                        </div>
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
                        placeholder="Enter SKU (optional)"
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
                        Quantity {!canAdjustStock && "(Read-only)"}
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
                        disabled={!canAdjustStock}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                        placeholder="Enter quantity"
                        min="0"
                        title={!canAdjustStock ? "You don't have permission to adjust stock" : ""}
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
              );
            })}
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
