import { Color } from "@/types/categoryType";
import { Product, ProductVariant } from "@/types/ProductType";
import { useMemo, useState } from "react";
import ProductImageSlider from "./ProductImageSlider";

interface VariantSelectionModalProps {
  product: Product;
  onSelect: (variant: ProductVariant) => void;
  onClose: () => void;
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  product,
  onSelect,
  onClose,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  // Group variants by color for better organization
  const variantGroups = useMemo(() => {
    const groups: Record<
      number,
      {
        color: Color;
        variants: ProductVariant[];
      }
    > = {};

    product.ProductVariants?.forEach((variant) => {
      if (!groups[variant.ColorId]) {
        groups[variant.ColorId] = {
          color: variant.Color,
          variants: [],
        };
      }
      groups[variant.ColorId].variants.push({
        ...variant,
        status: variant.status as "active" | "inactive",
      });
    });
    return groups;
  }, [product.ProductVariants]);

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="flex gap-6">
        <div className="w-1/3">
          <ProductImageSlider
            images={
              selectedVariant?.images && selectedVariant.images.length > 0
                ? selectedVariant.images
                : selectedVariant?.imageUrl
                ? [selectedVariant.imageUrl]
                : product?.images && product.images.length > 0
                ? product.images
                : product.productImage
                ? [product.productImage]
                : []
            }
            variant="with-thumbnails"
            showDots={true}
            autoplay={true}
            autoplaySpeed={4000}
            pauseOnHover={true}
            pauseOnFocus={true}
            draggable={true}
            fade={true}
            className="rounded-lg shadow-md"
            aspectRatio="aspect-square"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-800">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Choose your variant</p>
          {selectedVariant && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Selected:</span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: selectedVariant.Color?.code }}
                  />
                  <span className="font-medium">
                    {selectedVariant.Color?.name} / {selectedVariant.Size?.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">SKU:</span>
                  <span className="font-medium">{selectedVariant.sku}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Stock:</span>
                  <span className="font-medium">
                    {selectedVariant.quantity}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Variants Grid */}
      <div className="space-y-6">
        {Object.entries(variantGroups).map(([colorId, group]) => (
          <div key={colorId} className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full border"
                style={{ backgroundColor: group.color.code }}
              />
              <h4 className="font-medium text-gray-700">{group.color.name}</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {group.variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedVariant(variant);
                    // window.open(variant.imageUrl, "_blank", "noopener,noreferrer");
                  }}
                  disabled={variant.quantity === 0}
                  className={`relative group rounded-lg overflow-hidden transition-all ${
                    variant.quantity === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="aspect-square relative">
                    <ProductImageSlider
                      images={
                        variant?.images && variant.images.length > 0
                          ? variant.images
                          : variant?.imageUrl
                          ? [variant.imageUrl]
                          : []
                      }
                      // variant="with-thumbnails"
                      showDots={true}
                      autoplay={true}
                      autoplaySpeed={4000}
                      disaleOnClick
                      pauseOnHover={true}
                      pauseOnFocus={true}
                      draggable={true}
                      fade={true}
                      className="rounded-lg shadow-md"
                      aspectRatio="aspect-square"
                      imageClassName={`transition-transform duration-300 ${
                        selectedVariant?.id === variant.id
                          ? "scale-110"
                          : "group-hover:scale-105"
                      }`}
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${
                        selectedVariant?.id === variant.id
                          ? "bg-black/40"
                          : "bg-black/0 group-hover:bg-black/20"
                      }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg transform transition-all duration-300 ${
                          selectedVariant?.id === variant.id
                            ? "scale-100 opacity-100"
                            : "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {variant.Size?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <span className="px-2 py-1 text-xs font-medium bg-white/90 rounded-full shadow">
                      Stock: {variant.quantity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          disabled={!selectedVariant}
          onClick={() => selectedVariant && onSelect(selectedVariant)}
          className="px-6 py-2 text-white bg-brand-primary rounded-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {selectedVariant ? "Add to Cart" : "Select a Variant"}
        </button>
      </div>
    </div>
  );
};
