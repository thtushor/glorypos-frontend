import { ORDERS_URL } from "@/api/api";
import AXIOS from "@/api/network/Axios";
import CartProductSection from "@/components/shared/CartProductSection";
import ShoppingCart, {
  CartAdjustments,
} from "@/components/shared/ShoppingCart";

import { CartItem } from "@/types/cartItemType";
import { useQuery } from "@tanstack/react-query";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { formatCurrency } from "@/utils/utils";

function DashBoardProduct({
  initialBarcodeOpen = false,
  orderId,
}: {
  initialBarcodeOpen?: boolean;
  orderId?: number;
}) {
  const [sku, setSku] = useState("");

  const [adjustments, setAdjustments] = useState<CartAdjustments>({
    tax: { type: "percentage", value: 0 },
    discount: { type: "percentage", value: 0 },
    priceAdjustments: {},
    salesPriceAdjustments: {},
    discountAdjustments: {},
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  // 🔥 NEW — tab navigation state
  const [activeTab, setActiveTab] = useState<"products" | "cart">(
    initialBarcodeOpen ? "cart" : "products"
  );

  const [initialBarcodeOpenState, setInitialBarcodeOpenState] =
    useState(initialBarcodeOpen);

  const handleBarcodeScan = useCallback((barcode: string) => {
    if (barcode && barcode.trim()) {
      setSku(barcode.trim());
      setActiveTab("products"); // switch to products tab on scan
      setInitialBarcodeOpenState(false);
      toast.success(`Searching for: ${barcode.trim()}`);
    }
  }, []);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);


  const { data: orderItems,isSuccess } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const response = await AXIOS.get(`${ORDERS_URL}/${orderId}`);
      console.log({ response });
      return response;
    },
    enabled: !!orderId,
  });


  useEffect(() => {
    if (!isSuccess) return;

    console.log({ orderItems });

    const mappedItems: CartItem[] =
      orderItems?.data?.OrderItems?.map((item: any) => {
        const product = item.Product;
        const variant = item.ProductVariant;

        const unitPriceNumber = Number(item.unitPrice ?? product?.price ?? 0)+Number(item?.unitDiscount ?? 0);
        const discountAmountNumber = Number(
          item.discountAmount ?? product?.discountAmount ?? 0
        );

        return {
          ...product,
          orderItemId: item.id,
          quantity: Number(item.quantity ?? 0),
          unit: product.Unit,
          selectedVariant: variant
            ? {
                ...variant,
                Category: product?.Category,
              }
            : undefined,
          cartItemId: `${product.id}-${variant?.id ?? "default"}`,
          imageUrl: variant?.imageUrl || product.productImage,
          sku: variant?.sku || product.sku,
          unitPrice: unitPriceNumber,
          originalUnitPrice: Number(
            item.originalUnitPrice ?? product?.price ?? 0
          ),
          purchasePrice: Number(item.purchasePrice ?? product?.purchasePrice ?? 0),
          subtotal: Number(item.subtotal ?? 0),
          discountType:
            (item.discountType as CartItem["discountType"]) || product.discountType,
          unitDiscount: Number(item.unitDiscount ?? 0),
          discountAmount: discountAmountNumber,
          totalDiscount: Number(item.totalDiscount ?? 0),
          OrderId: item.OrderId,
          ProductId: item.ProductId,
          ProductVariantId: item.ProductVariantId,
        };
      }) || [];

    setCart(mappedItems);

    // Sync per-item adjustments from order data so cart math stays consistent
    setAdjustments((prev) => {
      const discountAdjustments = { ...prev.discountAdjustments };
      const salesPriceAdjustments = { ...prev.salesPriceAdjustments };

      mappedItems.forEach((cartItem) => {
        const discountValue = Number(cartItem.discountAmount || 0);
        const unitPrice = (cartItem as CartItem & { unitPrice?: number })
          .unitPrice;

        if (cartItem.discountType && discountValue > 0) {
          discountAdjustments[cartItem.id] = {
            type:
              (cartItem.discountType as "percentage" | "amount") || "percentage",
            value: formatCurrency(discountValue),
          };
        }

        if (unitPrice !== undefined) {
          salesPriceAdjustments[cartItem.id] = formatCurrency(
            Number(unitPrice)
          );
        }
      });

      return {
        ...prev,
        discountAdjustments,
        salesPriceAdjustments,
      };
    });
  }, [isSuccess, orderItems, setAdjustments]);

  


  return (
    <div className="">
      {/* 🔥 Top Navigation Tabs */}
      <div className="flex gap-6 mb-4 border-b pb-2">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "products"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>

        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "cart"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("cart")}
        >
          Cart ({cartItemsCount})
        </button>
      </div>

      {/* 🔥 Tab Content Display */}
      {activeTab === "products" && (
        <CartProductSection
          setCart={setCart}
          cart={cart}
          sku={sku}
          setSku={setSku}
          setAdjustments={setAdjustments}
          adjustments={adjustments}
        />
      )}

      {activeTab === "cart" && (
        <ShoppingCart
          cart={cart}
          setCart={setCart}
          orderId={orderId}
          adjustments={adjustments}
          setAdjustments={setAdjustments}
          handleBarcodeScan={handleBarcodeScan}
          showMobileCart={true}
          initialBarcodeOpen={initialBarcodeOpenState}
          onCloseBarcodeScanner={() => setInitialBarcodeOpenState(false)}
          // variant="desktop"
          initialCustomerInfo={{ name: orderItems?.data?.customerName || "", phone: orderItems?.data?.customerPhone || "" }}
          initialPaymentInfo={
            {
              walletAmount: orderItems?.data?.walletAmount||0,
              cardAmount: orderItems?.data?.cardAmount||0,
              cashAmount: orderItems?.data?.cashAmount||0
            }
          }
          initialKOTInfo={{
            tableNumber: orderItems?.data?.tableNumber||"",
            guestCount: orderItems?.data?.guestNumber||1,
            specialInstructions: orderItems?.data?.specialNotes||""
          }}
          onClose={() => setActiveTab("products")} // switch back to product tab
        />
      )}

    

      {/* Mobile Floating Cart Button */}
      <button
        onClick={() => setActiveTab("cart")}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg md:hidden"
      >
        Cart ({cartItemsCount})
      </button>
    </div>
  );
}

export default DashBoardProduct;
