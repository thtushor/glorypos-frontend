import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FaTicketAlt } from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import InputWithIcon from "@/components/InputWithIcon";
import { VALIDATE_COUPON_URL, SUBSCRIBE_PLAN } from "@/api/api";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: number;
    name: string;
    price: number;
  };
}

interface CouponValidation {
  isValid: boolean;
  discount: number;
  message: string;
  couponDetails?: {
    type: "percentage" | "fixed";
    value: string;
  };
}

const SubscriptionModal = ({
  isOpen,
  onClose,
  plan,
}: SubscriptionModalProps) => {
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card">("card");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [validCoupon, setValidCoupon] = useState<CouponValidation | null>(null);

  const onCloseHandler = () => {
    onClose();
    setCouponCode("");
  };

  // Validate Coupon
  const validateCouponMutation = useMutation({
    mutationFn: (data: { code: string; amount: number }) =>
      AXIOS.post(VALIDATE_COUPON_URL, data),
    onSuccess: (response) => {
      if (response.status) {
        const { coupon, discountAmount } = response.data;
        setAppliedDiscount(discountAmount);
        setValidCoupon({
          isValid: true,
          discount: discountAmount,
          message: response.data.message,
          couponDetails: {
            type: coupon.type,
            value: coupon.value,
          },
        });
        toast.success(response.data.message);
      } else {
        setAppliedDiscount(0);
        setValidCoupon(null);
        toast.error(response.data.message);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to validate coupon");
      setAppliedDiscount(0);
      setValidCoupon(null);
    },
  });

  // Subscribe Mutation
  const subscribeMutation = useMutation({
    mutationFn: (payload: {
      planId: number;
      status: "active";
      paymentStatus: "pending";
      paymentMethod: "card";
      amount: number;
      couponCode?: string;
    }) => AXIOS.post(SUBSCRIBE_PLAN, payload),
    onSuccess: () => {
      toast.success("Subscription initiated successfully");
      onCloseHandler();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to subscribe to plan");
    },
  });

  const handleValidateCoupon = () => {
    if (!couponCode) return;
    validateCouponMutation.mutate({
      code: couponCode,
      amount: plan.price,
    });
  };

  const handleSubscribe = () => {
    const finalAmount = plan.price - appliedDiscount;
    subscribeMutation.mutate({
      planId: plan.id,
      status: "active",
      paymentStatus: "pending",
      paymentMethod,
      amount: finalAmount,
      ...(validCoupon && { couponCode }),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onCloseHandler} title="Subscribe to Plan">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between text-lg font-medium">
            <span>Plan:</span>
            <span>{plan?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Original Price:</span>
            <span>${plan?.price}</span>
          </div>
          {appliedDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span>-${appliedDiscount}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total Amount:</span>
            <span>${plan?.price - appliedDiscount}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as "card")}
              className="mt-1 block w-full rounded-md border p-2 border-gray-300"
            >
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Coupon Code
              </label>
              <InputWithIcon
                name="couponCode"
                icon={FaTicketAlt}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                disabled={validateCouponMutation.isPending}
              />
            </div>
            <button
              onClick={handleValidateCoupon}
              disabled={!couponCode || validateCouponMutation.isPending}
              className="self-end flex px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-hover disabled:opacity-50"
            >
              {validateCouponMutation.isPending ? (
                <Spinner size="16px" color="#ffffff" className="my-2" />
              ) : (
                "Apply"
              )}
            </button>
          </div>
        </div>

        {validCoupon?.couponDetails && (
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              Applied Coupon: {couponCode} (
              {validCoupon.couponDetails.type === "percentage"
                ? `${parseFloat(validCoupon.couponDetails.value).toFixed(2)}%`
                : `$${parseFloat(validCoupon.couponDetails.value).toFixed(
                    2
                  )}`}{" "}
              off)
            </p>
            <p>Discount Amount: ${appliedDiscount.toFixed(2)}</p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={onCloseHandler}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubscribe}
            disabled={subscribeMutation.isPending}
            className="px-4 flex py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-hover disabled:opacity-50"
          >
            {subscribeMutation.isPending ? (
              <Spinner size="16px" color="#ffffff" className="mx-4 my-1" />
            ) : (
              "Proceed to Payment"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SubscriptionModal;
