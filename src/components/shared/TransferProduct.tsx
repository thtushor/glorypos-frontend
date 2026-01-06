/* eslint-disable react-hooks/exhaustive-deps */
import {
    BRANDS_URL,
    CATEGORY_URL,
    COLORS_URL,
    PRODUCT_URL,
    PRODUCT_VARIANTS_URL,
    SIZES_URL,
    UNITS_URL,
} from "@/api/api";

import AXIOS from "@/api/network/Axios";
import { successToast, uploadFile } from "@/utils/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import InputWithIcon from "../InputWithIcon";
import {
    FaBox,
    FaDollarSign,
    FaPercent,
    FaBoxes,
    FaBell,
    FaCloudUploadAlt,
    FaTimes,
    FaStore,
} from "react-icons/fa";
import { Brand, Unit } from "@/types/categoryType";
import { Category } from "@/types/categoryType";
import Spinner from "../Spinner";
import { ProductFormData, Product } from "@/types/ProductType";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";
import { useShopFilterOptions } from "@/hooks/useShopFilterOptions";

function TransferProduct({
    productData,
    onClose,
}: {
    productData: Product;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { hasPermission } = usePermission();

    // Permission checks
    const canViewCostProfit = hasPermission(PERMISSIONS.SALES.VIEW_COST_PROFIT);
    const canAdjustStock = hasPermission(PERMISSIONS.INVENTORY.ADJUST_STOCK);

    const isRestaurent = user?.shopType === "restaurant";
    const [enableVariants, setEnableVariants] = useState(false);
    const [selectedShop, setSelectedShop] = useState<number | "">("");

    // Form state - copy from original product but clear ID and SKU
    const [formData, setFormData] = useState<ProductFormData>({
        id: undefined,
        code: null,
        sku: "", // Will be auto-generated
        name: productData.name,
        description: productData.description,
        CategoryId: productData.CategoryId,
        BrandId: productData.BrandId,
        UnitId: productData.UnitId,
        ColorId: productData.ColorId,
        SizeId: productData.SizeId,
        alertQuantity: productData.alertQuantity,
        productImage: productData.productImage || "",
        images: productData.images || [],
        imageFiles: [],
        discountType: productData.discountType,
        discountAmount: productData.discountAmount,
        purchasePrice: productData.purchasePrice,
        salesPrice: productData.salesPrice,
        vat: productData.vat,
        price: productData.price,
        stock: productData.stock,
        status: "active",
        gender: productData.gender || null,
        modelNo: productData.modelNo || null,
    });

    const [imagePreviews, setImagePreviews] = useState<string[]>(
        productData.images || []
    );
    const [isLoadingImage, setIsLoadingImage] = useState(false);

    // Fetch shops for selection using the hook
    const { shops, isLoading: isLoadingShops } = useShopFilterOptions();

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

    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await AXIOS.get(CATEGORY_URL);
            return response.data;
        },
    });

    const { data: brands = [] } = useQuery<Brand[]>({
        queryKey: ["brands"],
        queryFn: async () => {
            const response = await AXIOS.get(BRANDS_URL);
            return response.data;
        },
    });

    const { data: units = [] } = useQuery<Unit[]>({
        queryKey: ["units"],
        queryFn: async () => {
            const response = await AXIOS.get(UNITS_URL);
            return response.data;
        },
    });

    // Fetch existing variants from the original product
    const { data: existingVariants = [], isLoading: isLoadingVariants } =
        useQuery({
            queryKey: ["variants", productData.id],
            queryFn: async () => {
                if (!productData.id) return [];
                const response = await AXIOS.get(PRODUCT_VARIANTS_URL, {
                    params: {
                        ProductId: productData.id,
                    },
                });
                return response.data;
            },
            enabled: !!productData.id,
        });

    // Create mutation for transferring product
    const transferMutation = useMutation<any, Error, ProductFormData>({
        mutationFn: async (data: ProductFormData) => {
            if (!selectedShop) {
                throw new Error("Please select a shop");
            }

            // Add shopId to the data
            const transferData = {
                ...data,
                UserId: selectedShop,
            };

            return AXIOS.post(PRODUCT_URL, transferData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
            toast.success("Product transferred successfully to the selected shop");
            onClose();
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to transfer product");
        },
    });

    // Handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedShop) {
            toast.error("Please select a shop to transfer the product to");
            return;
        }

        setIsLoadingImage(true);

        try {
            let finalPrimaryImage = formData.productImage;
            let finalImages: string[] = [...(formData.images || [])];

            // Upload new files if any
            if (formData?.imageFiles?.length && formData?.imageFiles?.length > 0) {
                const uploads = await uploadFile(formData.imageFiles || []);

                const uploadedUrls = Array.isArray(uploads)
                    ? uploads.map((u) => u.original)
                    : [uploads.original];

                finalImages = [...finalImages, ...uploadedUrls];
            }

            // If primary empty but images exist
            if (!finalPrimaryImage && finalImages.length > 0) {
                finalPrimaryImage = finalImages[0];
            }

            const submitData = {
                ...formData,
                productImage: finalPrimaryImage,
                images: finalImages,
                imageFiles: undefined, // prevent file object send
                sku: "", // Let backend generate new SKU
            };

            transferMutation.mutate(submitData);
        } catch (err) {
            console.log(err);
            successToast("Failed to upload image", "error");
        } finally {
            setIsLoadingImage(false);
        }
    };

    // Handler for input and textarea elements
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prevFormData) => {
            const updatedData = { ...prevFormData, [name]: value };

            // Recalculate prices when related fields change
            if (
                name === "salesPrice" ||
                name === "discountType" ||
                name === "discountAmount" ||
                name === "vat"
            ) {
                const salesPrice = Number(updatedData.salesPrice || 0);
                const discountType = updatedData.discountType;
                const discountAmount = Number(updatedData.discountAmount || 0);
                const vat = Number(updatedData.vat || 0);

                let discountedPrice = salesPrice;

                // Apply discount
                if (discountType === "percentage") {
                    discountedPrice -= (salesPrice * discountAmount) / 100;
                } else if (discountType === "amount") {
                    discountedPrice -= discountAmount;
                }

                // Apply VAT
                const finalPrice = discountedPrice + (discountedPrice * vat) / 100;

                updatedData.price = Math.max(Number(finalPrice.toFixed(2)), 0);
            }

            return updatedData;
        });
    };

    // Handler for select elements
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prevFormData) => {
            const updatedData = { ...prevFormData, [name]: value };

            // Recalculate prices when related fields change
            if (
                name === "salesPrice" ||
                name === "discountType" ||
                name === "discountAmount" ||
                name === "vat"
            ) {
                const salesPrice = Number(updatedData.salesPrice || 0);
                const discountType = updatedData.discountType;
                const discountAmount = Number(updatedData.discountAmount || 0);
                const vat = Number(updatedData.vat || 0);

                let discountedPrice = salesPrice;

                // Apply discount
                if (discountType === "percentage") {
                    discountedPrice -= (salesPrice * discountAmount) / 100;
                } else if (discountType === "amount") {
                    discountedPrice -= discountAmount;
                }

                // Apply VAT
                const finalPrice = discountedPrice + (discountedPrice * vat) / 100;

                updatedData.price = Math.max(Number(finalPrice.toFixed(2)), 0);
            }

            return updatedData;
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileArray = Array.from(files);
            setFormData((prev) => ({
                ...prev,
                imageFiles: [...(prev.imageFiles || []), ...fileArray],
            }));

            // Create previews for all selected images immediately
            fileArray.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews((prev) => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
        // Reset input to allow selecting same files again
        e.target.value = "";
    };

    const handleRemoveImage = (index: number) => {
        const preview = imagePreviews[index];

        const isNewUpload = preview.startsWith("data:");

        if (isNewUpload) {
            // remove new file
            const newImageFiles = [...(formData.imageFiles || [])];
            newImageFiles.splice(
                index - (imagePreviews.length - (formData.imageFiles?.length || 0)),
                1
            );

            setFormData((prev) => ({
                ...prev,
                imageFiles: newImageFiles,
            }));
        } else {
            // remove existing url
            const newOldImages = formData?.images?.filter((img) => img !== preview);
            setFormData((prev) => ({
                ...prev,
                images: newOldImages,
            }));
        }

        // remove preview always
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        if (existingVariants?.length > 0) {
            setFormData({
                ...formData,
                stock: 0,
            });
            setEnableVariants(true);
        }
    }, [existingVariants]);

    if (isLoadingVariants || isLoadingShops) {
        return (
            <div className="flex items-center justify-center h-64 w-auto rounded-md object-cover">
                <Spinner size="32px" color="#32cd32" className="mx-4 my-1" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shop Selection - Most Important Field */}
            <div className="bg-brand-primary/10 border-2 border-brand-primary rounded-lg p-4">
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                    <FaStore className="inline mr-2" />
                    Select Target Shop*
                </label>
                <select
                    value={selectedShop}
                    onChange={(e) => setSelectedShop(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-4 py-3 border-2 border-brand-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-lg"
                    required
                >
                    <option value="">-- Select a shop to transfer this product --</option>
                    {shops.map((shop) => (
                        <option key={shop.id} value={shop.id}>
                            {shop.businessName || shop.fullName} ({shop.email})
                        </option>
                    ))}
                </select>
                <p className="text-sm text-gray-600 mt-2">
                    This product will be replicated to the selected shop with a new barcode.
                </p>
            </div>

            {/* Original Product Info */}
            <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="text-md font-semibold text-gray-800 mb-2">
                    Transferring Product: {productData.name}
                </h3>
                <p className="text-sm text-gray-600">
                    Original SKU: <span className="font-mono font-semibold">{productData.sku}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    Note: A new SKU will be auto-generated for the transferred product.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SKU - Disabled as it will be auto-generated */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU (Auto-generated)
                    </label>
                    <InputWithIcon
                        icon={FaBox}
                        name="sku"
                        type="text"
                        disabled
                        placeholder="Will be auto-generated"
                        value=""
                        onChange={() => { }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        A new unique SKU will be generated automatically
                    </p>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name*
                    </label>
                    <InputWithIcon
                        icon={FaBox}
                        name="name"
                        type="text"
                        required
                        placeholder="Enter product name"
                        value={formData.name}
                        onChange={handleInputChange}
                    />
                </div>

                {/* Description */}
                <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        name="description"
                        placeholder="Enter product description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                        rows={3}
                    />
                </div>

                {/* Category, Brand, Unit */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                    </label>
                    <select
                        value={formData.CategoryId || ""}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                CategoryId: e.target.value ? Number(e.target.value) : 0,
                            })
                        }
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand
                    </label>
                    <select
                        value={formData.BrandId || ""}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                BrandId: e.target.value ? Number(e.target.value) : 0,
                            })
                        }
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="">Select Brand</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                    </label>
                    <select
                        value={formData.UnitId || ""}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                UnitId: e.target.value ? Number(e.target.value) : 0,
                            })
                        }
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="">Select Unit</option>
                        {units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                                {unit.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Color */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                    </label>
                    <select
                        value={formData.ColorId}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                ColorId: e.target.value ? Number(e.target.value) : 0,
                            })
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
                        value={formData.SizeId}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                SizeId: e.target.value ? Number(e.target.value) : 0,
                            })
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

                {/* Gender */}
                {!isRestaurent && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gender
                        </label>
                        <select
                            value={formData.gender || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    gender: e.target.value
                                        ? (e.target.value as "men" | "women" | "others")
                                        : null,
                                })
                            }
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                        >
                            <option value="">Select Gender</option>
                            <option value="men">Men</option>
                            <option value="women">Women</option>
                            <option value="others">Others</option>
                        </select>
                    </div>
                )}

                {/* Model Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model Number
                    </label>
                    <InputWithIcon
                        icon={FaBox}
                        name="modelNo"
                        type="text"
                        placeholder="Enter model number (optional)"
                        value={formData.modelNo || ""}
                        onChange={handleInputChange}
                    />
                </div>

                {/* Prices */}
                {canViewCostProfit && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Purchase Price*
                        </label>
                        <InputWithIcon
                            icon={FaDollarSign}
                            name="purchasePrice"
                            type="number"
                            step="0.01"
                            required
                            placeholder="Enter purchase price"
                            value={formData.purchasePrice?.toString()}
                            onChange={handleInputChange}
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sales Price*
                    </label>
                    <InputWithIcon
                        icon={FaDollarSign}
                        name="salesPrice"
                        type="number"
                        step="0.01"
                        required
                        placeholder="Enter sales price"
                        value={formData.salesPrice?.toString()}
                        onChange={handleInputChange}
                    />
                </div>

                {/* Discount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Type
                    </label>
                    <select
                        value={formData.discountType || ""}
                        onChange={handleSelectChange}
                        name="discountType"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="">Select Discount Type</option>
                        <option value="percentage">Percentage</option>
                        <option value="amount">Amount</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Amount
                    </label>
                    <InputWithIcon
                        icon={FaDollarSign}
                        name="discountAmount"
                        type="number"
                        step="0.01"
                        placeholder="Enter discount amount"
                        value={formData.discountAmount?.toString() || ""}
                        onChange={handleInputChange}
                    />
                </div>

                {/* VAT */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        VAT (%)*
                    </label>
                    <InputWithIcon
                        icon={FaPercent}
                        name="vat"
                        type="number"
                        step="0.01"
                        required
                        placeholder="Enter VAT"
                        value={formData.vat?.toString()}
                        onChange={handleInputChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Final Price*
                    </label>
                    <InputWithIcon
                        icon={FaDollarSign}
                        name="price"
                        type="number"
                        step="0.01"
                        required
                        placeholder="Enter final price"
                        value={formData.price?.toString()}
                        onChange={handleInputChange}
                    />
                </div>

                {/* Stock */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock{enableVariants ? "" : "*"}
                    </label>
                    <InputWithIcon
                        icon={FaBoxes}
                        name="stock"
                        type="number"
                        required={!enableVariants}
                        disabled={enableVariants || !canAdjustStock}
                        placeholder={!canAdjustStock ? "No permission to adjust stock" : "Enter stock quantity"}
                        value={formData.stock?.toString()}
                        onChange={handleInputChange}
                        title={!canAdjustStock ? "You don't have permission to adjust stock" : ""}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alert Quantity
                    </label>
                    <InputWithIcon
                        icon={FaBell}
                        name="alertQuantity"
                        type="number"
                        placeholder="Enter alert quantity"
                        value={formData.alertQuantity?.toString()}
                        onChange={handleInputChange}
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status*
                    </label>
                    <select
                        value={formData.status}
                        onChange={handleSelectChange}
                        name="status"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                        required
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {/* Product Images */}
                <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Images
                    </label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <FaCloudUploadAlt className="w-10 h-10 mb-3 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload</span> or drag
                                    and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    PNG, JPG or WEBP (Multiple files allowed)
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </label>
                    </div>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Variants Section - Show if original product has variants */}
            {existingVariants?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-yellow-800 mb-2">
                        Product Variants Detected
                    </h3>
                    <p className="text-sm text-yellow-700">
                        The original product has {existingVariants.length} variant(s). After transferring,
                        you can add variants separately from the Products page.
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={transferMutation.isPending || isLoadingImage || !selectedShop}
                    className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {transferMutation.isPending || isLoadingImage ? (
                        <>
                            <Spinner size="16px" color="#fff" />
                            Transferring...
                        </>
                    ) : (
                        "Transfer Product"
                    )}
                </button>
            </div>
        </form>
    );
}

export default TransferProduct;
