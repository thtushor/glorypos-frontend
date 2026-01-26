import React, { useEffect, useMemo } from "react";
import {
  FaCheckCircle,
  FaCreditCard,
  FaExclamationCircle,
  FaMoneyBill,
  FaUtensils,
  FaWallet,
} from "react-icons/fa";
import Modal from "../Modal";
import Spinner from "../Spinner";
import money from "@/utils/money";
import {
  filterNumericInput,
  formatCurrency,
  getNumericValue,
  parseCurrencyInput,
} from "@/utils/utils";
import { useAuth } from "@/context/AuthContext";

export interface PartialPayment {
  cashAmount: number;
  cardAmount: number;
  walletAmount: number;
}

interface KOTData {
  tableNumber: string;
  specialInstructions: string;
  guestCount: number | string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  partialPayment: PartialPayment;
  setPartialPayment: React.Dispatch<React.SetStateAction<PartialPayment>>;
  kotData?: KOTData;
  setKotData?: React.Dispatch<React.SetStateAction<KOTData>>;
  onProcessPayment: () => void;
  onProcessPrintKOT?: () => void;
  isProcessing?: boolean;
  enableEnterSubmit?: boolean;
  hasNewProduct?: boolean; // If true, print KOT on Enter (for mixed orders with new items)
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  partialPayment,
  setPartialPayment,
  kotData,
  setKotData,
  onProcessPayment,
  onProcessPrintKOT,
  isProcessing = false,
  enableEnterSubmit = true,
  hasNewProduct = false,
  // hasAdjustment = false,
}) => {
  const { user } = useAuth();

  console.log("hasNewProduct", hasNewProduct);

  // Calculate payment totals with proper decimal handling
  const paymentTotal = useMemo(() => {
    const sum =
      partialPayment.cashAmount +
      partialPayment.cardAmount +
      partialPayment.walletAmount;
    return Math.round(sum * 100) / 100; // Round to 2 decimal places
  }, [partialPayment]);

  const paymentRemaining = useMemo(() => {
    const remaining = total - paymentTotal;
    return Math.round(Math.max(0, remaining) * 100) / 100; // Round to 2 decimal places
  }, [total, paymentTotal]);

  const isPaymentComplete = useMemo(() => {
    return Math.abs(paymentTotal - total) < 0.01; // Allow small floating point differences
  }, [paymentTotal, total]);

  const isPaymentOver = useMemo(() => {
    return paymentTotal > total + 0.01; // Add small buffer for floating point comparison
  }, [paymentTotal, total]);

  // Global keyboard event listener for Enter key - works anytime modal is open
  useEffect(() => {
    if (!isOpen || !enableEnterSubmit) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Enter is pressed and not in a textarea
      if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        const isTextarea = target.tagName === "TEXTAREA";
        
        // If focused on textarea, allow normal Enter behavior for newlines
        if (isTextarea) return;
        
        // Prevent default to avoid form submission conflicts
        e.preventDefault();
        
        // Process payment regardless of completion status (validation happens in handler)
        if (!isProcessing) {
          const isRestaurant = user?.shopType === "restaurant";
          
          // Print KOT if restaurant OR if hasNewProduct is true (mixed order with new items)
          if (isRestaurant) {
            if (onProcessPrintKOT && hasNewProduct) {
              onProcessPrintKOT();
            } else {
              // Fallback to payment if KOT handler not available
              onProcessPayment();
            }
          } else {
            // Normal payment process for non-restaurant shops
            onProcessPayment();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, enableEnterSubmit, isProcessing, onProcessPayment, onProcessPrintKOT, user?.shopType, hasNewProduct]);

  const handleQuickPayment = (method: "cash" | "card" | "mobile_banking") => {
    setPartialPayment({
      cashAmount: method === "cash" ? total : 0,
      cardAmount: method === "card" ? total : 0,
      walletAmount: method === "mobile_banking" ? total : 0,
    });
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (enableEnterSubmit && !isProcessing) {
      onProcessPayment();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Payment"
      className="max-w-2xl w-full mx-2 sm:mx-4"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6 px-1">
        {user?.shopType === "restaurant" && kotData && setKotData && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <FaUtensils className="text-orange-600 text-xl" />
              <h3 className="font-semibold text-orange-900">
                Kitchen Order Details
              </h3>
            </div>

            <div className="space-y-4">
              {/* Table Number */}
              <div>
                <label className="block text-sm font-medium text-orange-900 mb-2">
                  Table Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={kotData.tableNumber}
                  onChange={(e) =>
                    setKotData((prev) => ({
                      ...prev,
                      tableNumber: e.target.value,
                    }))
                  }
                  required
                  placeholder="e.g., T1, Table 5, A-12"
                  className="w-full px-4 py-2.5 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                />
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-sm font-medium text-orange-900 mb-2">
                  Number of Guests
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={getNumericValue(kotData.guestCount)}
                  onChange={(e) => {
                    const filtered = filterNumericInput(e.target.value);
                    const parsed =
                      filtered === ""
                        ? ""
                        : parseCurrencyInput(filtered);
                    // Validate max for guest count
                    const maxValue = 50;
                    const finalValue =
                      parsed && parsed > maxValue ? maxValue : parsed;

                    setKotData((prev) => ({
                      ...prev,
                      guestCount: finalValue,
                    }));
                  }}
                  onBlur={(e) => {
                    const filtered = filterNumericInput(e.target.value);
                    const parsed =
                      filtered === "" ? "" : parseCurrencyInput(filtered);
                    // Validate max for guest count
                    const maxValue = 50;

                    const finalValue =
                      parsed && parsed > maxValue ? maxValue : parsed;

                    setKotData((prev) => ({
                      ...prev,
                      guestCount: finalValue,
                    }));
                  }}
                  className="w-full px-4 py-2.5 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                />
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-orange-900 mb-2">
                  Special Instructions / Notes
                </label>
                <textarea
                  value={kotData.specialInstructions}
                  onChange={(e) =>
                    setKotData((prev) => ({
                      ...prev,
                      specialInstructions: e.target.value,
                    }))
                  }
                  placeholder="e.g., No onions, Extra spicy, Allergies: Peanuts, Serve hot..."
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white resize-none"
                />
                <p className="text-xs text-orange-700 mt-1">
                  These notes will be printed on the Kitchen Order Ticket
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Total Display */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-hover text-white rounded-lg p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm opacity-90 mb-1">
                Total Amount
              </p>
              <p className="text-2xl sm:text-3xl font-bold">
                {money.format(total)}
              </p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-xs sm:text-sm opacity-90 mb-1">
                Payment Status
              </p>
              <div className="flex items-center gap-2">
                {isPaymentComplete ? (
                  <>
                    <FaCheckCircle className="text-xl sm:text-2xl" />
                    <span className="text-base sm:text-lg font-semibold">
                      Complete
                    </span>
                  </>
                ) : isPaymentOver ? (
                  <>
                    <FaExclamationCircle className="text-xl sm:text-2xl text-yellow-300" />
                    <span className="text-base sm:text-lg font-semibold">
                      Overpaid
                    </span>
                  </>
                ) : (
                  <>
                    <FaExclamationCircle className="text-xl sm:text-2xl opacity-75" />
                    <span className="text-base sm:text-lg font-semibold">
                      Pending
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Amount Summary */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div
              className={`p-2 sm:p-3 rounded-lg transition-all ${
                partialPayment.cashAmount > 0
                  ? "bg-green-100 border-2 border-green-400 shadow-sm"
                  : "bg-transparent"
              }`}
            >
              <p
                className={`text-xs mb-1 ${
                  partialPayment.cashAmount > 0
                    ? "text-green-700 font-semibold"
                    : "text-gray-500"
                }`}
              >
                Cash
                {partialPayment.cashAmount > 0 && (
                  <span className="ml-1 text-green-600">✓</span>
                )}
              </p>
              <p
                className={`text-base sm:text-lg font-semibold ${
                  partialPayment.cashAmount > 0
                    ? "text-green-700"
                    : "text-gray-900"
                }`}
              >
                {money.format(partialPayment.cashAmount)}
              </p>
            </div>
            <div
              className={`p-2 sm:p-3 rounded-lg transition-all ${
                partialPayment.cardAmount > 0
                  ? "bg-blue-100 border-2 border-blue-400 shadow-sm"
                  : "bg-transparent"
              }`}
            >
              <p
                className={`text-xs mb-1 ${
                  partialPayment.cardAmount > 0
                    ? "text-blue-700 font-semibold"
                    : "text-gray-500"
                }`}
              >
                Card
                {partialPayment.cardAmount > 0 && (
                  <span className="ml-1 text-blue-600">✓</span>
                )}
              </p>
              <p
                className={`text-base sm:text-lg font-semibold ${
                  partialPayment.cardAmount > 0
                    ? "text-blue-700"
                    : "text-gray-900"
                }`}
              >
                {money.format(partialPayment.cardAmount)}
              </p>
            </div>
            <div
              className={`p-2 sm:p-3 rounded-lg transition-all ${
                partialPayment.walletAmount > 0
                  ? "bg-purple-100 border-2 border-purple-400 shadow-sm"
                  : "bg-transparent"
              }`}
            >
              <p
                className={`text-xs mb-1 ${
                  partialPayment.walletAmount > 0
                    ? "text-purple-700 font-semibold"
                    : "text-gray-500"
                }`}
              >
                Wallet
                {partialPayment.walletAmount > 0 && (
                  <span className="ml-1 text-purple-600">✓</span>
                )}
              </p>
              <p
                className={`text-base sm:text-lg font-semibold ${
                  partialPayment.walletAmount > 0
                    ? "text-purple-700"
                    : "text-gray-900"
                }`}
              >
                {money.format(partialPayment.walletAmount)}
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base font-medium text-gray-700">
                Total Paid:
              </span>
              <span
                className={`text-lg sm:text-xl font-bold ${
                  isPaymentComplete
                    ? "text-green-600"
                    : isPaymentOver
                      ? "text-yellow-600"
                      : "text-gray-900"
                }`}
              >
                {money.format(paymentTotal)}
              </span>
            </div>
            {!isPaymentComplete && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs sm:text-sm text-gray-600">
                  Remaining:
                </span>
                <span
                  className={`text-base sm:text-lg font-semibold ${
                    isPaymentOver ? "text-yellow-600" : "text-red-600"
                  }`}
                >
                  {isPaymentOver
                    ? `+${money.format(Math.abs(paymentRemaining))}`
                    : money.format(paymentRemaining)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Payment Buttons */}
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
            Quick Payment (Full Amount)
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleQuickPayment("cash")}
              className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all touch-manipulation ${
                partialPayment.cashAmount > 0 &&
                partialPayment.cardAmount === 0 &&
                partialPayment.walletAmount === 0
                  ? "bg-green-100 border-green-400 shadow-md"
                  : "bg-green-50 border-green-200 active:bg-green-100 hover:bg-green-100 hover:border-green-300"
              }`}
            >
              <FaMoneyBill
                className={`text-xl sm:text-2xl ${
                  partialPayment.cashAmount > 0 &&
                  partialPayment.cardAmount === 0 &&
                  partialPayment.walletAmount === 0
                    ? "text-green-700"
                    : "text-green-600"
                }`}
              />
              <span
                className={`text-xs sm:text-sm font-medium ${
                  partialPayment.cashAmount > 0 &&
                  partialPayment.cardAmount === 0 &&
                  partialPayment.walletAmount === 0
                    ? "text-green-800"
                    : "text-green-700"
                }`}
              >
                Cash
                {partialPayment.cashAmount > 0 &&
                  partialPayment.cardAmount === 0 &&
                  partialPayment.walletAmount === 0 && (
                    <span className="ml-1">✓</span>
                  )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPayment("card")}
              className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all touch-manipulation ${
                partialPayment.cardAmount > 0 &&
                partialPayment.cashAmount === 0 &&
                partialPayment.walletAmount === 0
                  ? "bg-blue-100 border-blue-400 shadow-md"
                  : "bg-blue-50 border-blue-200 active:bg-blue-100 hover:bg-blue-100 hover:border-blue-300"
              }`}
            >
              <FaCreditCard
                className={`text-xl sm:text-2xl ${
                  partialPayment.cardAmount > 0 &&
                  partialPayment.cashAmount === 0 &&
                  partialPayment.walletAmount === 0
                    ? "text-blue-700"
                    : "text-blue-600"
                }`}
              />
              <span
                className={`text-xs sm:text-sm font-medium ${
                  partialPayment.cardAmount > 0 &&
                  partialPayment.cashAmount === 0 &&
                  partialPayment.walletAmount === 0
                    ? "text-blue-800"
                    : "text-blue-700"
                }`}
              >
                Card
                {partialPayment.cardAmount > 0 &&
                  partialPayment.cashAmount === 0 &&
                  partialPayment.walletAmount === 0 && (
                    <span className="ml-1">✓</span>
                  )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPayment("mobile_banking")}
              className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all touch-manipulation ${
                partialPayment.walletAmount > 0 &&
                partialPayment.cashAmount === 0 &&
                partialPayment.cardAmount === 0
                  ? "bg-purple-100 border-purple-400 shadow-md"
                  : "bg-purple-50 border-purple-200 active:bg-purple-100 hover:bg-purple-100 hover:border-purple-300"
              }`}
            >
              <FaWallet
                className={`text-xl sm:text-2xl ${
                  partialPayment.walletAmount > 0 &&
                  partialPayment.cashAmount === 0 &&
                  partialPayment.cardAmount === 0
                    ? "text-purple-700"
                    : "text-purple-600"
                }`}
              />
              <span
                className={`text-xs sm:text-sm font-medium ${
                  partialPayment.walletAmount > 0 &&
                  partialPayment.cashAmount === 0 &&
                  partialPayment.cardAmount === 0
                    ? "text-purple-800"
                    : "text-purple-700"
                }`}
              >
                Wallet
                {partialPayment.walletAmount > 0 &&
                  partialPayment.cashAmount === 0 &&
                  partialPayment.cardAmount === 0 && (
                    <span className="ml-1">✓</span>
                  )}
              </span>
            </button>
          </div>
        </div>

        {/* Manual Payment Inputs */}
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm font-medium text-gray-700">
            Manual Payment Entry
          </p>

          {/* Cash Payment */}
          <div
            className={`space-y-2 p-3 sm:p-4 rounded-lg border-2 transition-all ${
              partialPayment.cashAmount > 0
                ? "bg-green-50 border-green-300"
                : "bg-transparent border-transparent"
            }`}
          >
            <label
              className={`flex items-center gap-2 text-xs sm:text-sm font-medium ${
                partialPayment.cashAmount > 0
                  ? "text-green-700"
                  : "text-gray-700"
              }`}
            >
              <FaMoneyBill
                className={`text-sm sm:text-base ${
                  partialPayment.cashAmount > 0
                    ? "text-green-600"
                    : "text-green-500"
                }`}
              />
              Cash Amount
              {partialPayment.cashAmount > 0 && (
                <span className="ml-auto text-green-600 font-bold">
                  ✓ Selected
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                ฿
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={
                  partialPayment.cashAmount > 0
                    ? getNumericValue(partialPayment.cashAmount)
                    : ""
                }
                onChange={(e) => {
                  const filtered = filterNumericInput(e.target.value);
                  const parsed =
                    filtered === "" ? 0 : parseCurrencyInput(filtered);
                  setPartialPayment((prev) => ({
                    ...prev,
                    cashAmount: parsed,
                  }));
                }}
                onBlur={(e) => {
                  const filtered = filterNumericInput(e.target.value);
                  const parsed =
                    filtered === "" ? 0 : parseCurrencyInput(filtered);
                  const formatted = formatCurrency(parsed);
                  setPartialPayment((prev) => ({
                    ...prev,
                    cashAmount: formatted,
                  }));
                }}
                placeholder="0.00"
                className="w-full pl-8 sm:pl-10 pr-20 sm:pr-24 py-3 sm:py-3.5 text-base sm:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  const remaining = Math.max(
                    0,
                    total - paymentTotal + partialPayment.cashAmount
                  );
                  const formatted = formatCurrency(remaining);
                  setPartialPayment((prev) => ({
                    ...prev,
                    cashAmount: formatted,
                  }));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-green-600 bg-green-50 rounded-md active:bg-green-100 hover:bg-green-100 transition-colors touch-manipulation whitespace-nowrap"
              >
                Fill
              </button>
            </div>
          </div>

          {/* Card Payment */}
          <div
            className={`space-y-2 p-3 sm:p-4 rounded-lg border-2 transition-all ${
              partialPayment.cardAmount > 0
                ? "bg-blue-50 border-blue-300"
                : "bg-transparent border-transparent"
            }`}
          >
            <label
              className={`flex items-center gap-2 text-xs sm:text-sm font-medium ${
                partialPayment.cardAmount > 0
                  ? "text-blue-700"
                  : "text-gray-700"
              }`}
            >
              <FaCreditCard
                className={`text-sm sm:text-base ${
                  partialPayment.cardAmount > 0
                    ? "text-blue-600"
                    : "text-blue-500"
                }`}
              />
              Card Amount
              {partialPayment.cardAmount > 0 && (
                <span className="ml-auto text-blue-600 font-bold">
                  ✓ Selected
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                ฿
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={
                  partialPayment.cardAmount > 0
                    ? getNumericValue(partialPayment.cardAmount)
                    : ""
                }
                onChange={(e) => {
                  const filtered = filterNumericInput(e.target.value);
                  const parsed =
                    filtered === "" ? 0 : parseCurrencyInput(filtered);
                  setPartialPayment((prev) => ({
                    ...prev,
                    cardAmount: parsed,
                  }));
                }}
                onBlur={(e) => {
                  const filtered = filterNumericInput(e.target.value);
                  const parsed =
                    filtered === "" ? 0 : parseCurrencyInput(filtered);
                  const formatted = formatCurrency(parsed);
                  setPartialPayment((prev) => ({
                    ...prev,
                    cardAmount: formatted,
                  }));
                }}
                placeholder="0.00"
                className="w-full pl-8 sm:pl-10 pr-20 sm:pr-24 py-3 sm:py-3.5 text-base sm:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  const remaining = Math.max(
                    0,
                    total - paymentTotal + partialPayment.cardAmount
                  );
                  const formatted = formatCurrency(remaining);
                  setPartialPayment((prev) => ({
                    ...prev,
                    cardAmount: formatted,
                  }));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-md active:bg-blue-100 hover:bg-blue-100 transition-colors touch-manipulation whitespace-nowrap"
              >
                Fill
              </button>
            </div>
          </div>

          {/* Wallet Payment */}
          <div
            className={`space-y-2 p-3 sm:p-4 rounded-lg border-2 transition-all ${
              partialPayment.walletAmount > 0
                ? "bg-purple-50 border-purple-300"
                : "bg-transparent border-transparent"
            }`}
          >
            <label
              className={`flex items-center gap-2 text-xs sm:text-sm font-medium ${
                partialPayment.walletAmount > 0
                  ? "text-purple-700"
                  : "text-gray-700"
              }`}
            >
              <FaWallet
                className={`text-sm sm:text-base ${
                  partialPayment.walletAmount > 0
                    ? "text-purple-600"
                    : "text-purple-500"
                }`}
              />
              <span className="hidden sm:inline">
                Wallet/Mobile Banking Amount
              </span>
              <span className="sm:hidden">Wallet Amount</span>
              {partialPayment.walletAmount > 0 && (
                <span className="ml-auto text-purple-600 font-bold">
                  ✓ Selected
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                ฿
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={
                  partialPayment.walletAmount > 0
                    ? getNumericValue(partialPayment.walletAmount)
                    : ""
                }
                onChange={(e) => {
                  const filtered = filterNumericInput(e.target.value);
                  const parsed =
                    filtered === "" ? 0 : parseCurrencyInput(filtered);
                  setPartialPayment((prev) => ({
                    ...prev,
                    walletAmount: parsed,
                  }));
                }}
                onBlur={(e) => {
                  const filtered = filterNumericInput(e.target.value);
                  const parsed =
                    filtered === "" ? 0 : parseCurrencyInput(filtered);
                  const formatted = formatCurrency(parsed);
                  setPartialPayment((prev) => ({
                    ...prev,
                    walletAmount: formatted,
                  }));
                }}
                placeholder="0.00"
                className="w-full pl-8 sm:pl-10 pr-20 sm:pr-24 py-3 sm:py-3.5 text-base sm:text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  const remaining = Math.max(
                    0,
                    total - paymentTotal + partialPayment.walletAmount
                  );
                  const formatted = formatCurrency(remaining);
                  setPartialPayment((prev) => ({
                    ...prev,
                    walletAmount: formatted,
                  }));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-md active:bg-purple-100 hover:bg-purple-100 transition-colors touch-manipulation whitespace-nowrap"
              >
                Fill
              </button>
            </div>
          </div>
        </div>

        {/* Clear All Button */}
        {(partialPayment.cashAmount > 0 ||
          partialPayment.cardAmount > 0 ||
          partialPayment.walletAmount > 0) && (
          <button
            type="button"
            onClick={() => {
              setPartialPayment({
                cashAmount: 0,
                cardAmount: 0,
                walletAmount: 0,
              });
            }}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear All
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2 sm:pb-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3.5 sm:py-3 text-gray-700 bg-gray-100 rounded-lg active:bg-gray-200 hover:bg-gray-200 transition-colors font-medium text-base sm:text-sm touch-manipulation"
          >
            Cancel
          </button>
          {user?.shopType === "restaurant" && onProcessPrintKOT && (
            <button
              type="button"
              onClick={onProcessPrintKOT}
              disabled={!isPaymentComplete || isProcessing}
              className={`flex-1 px-4 py-3.5 sm:py-3 text-white rounded-lg font-medium transition-all text-base sm:text-sm touch-manipulation ${
                isPaymentComplete
                  ? "bg-brand-primary active:bg-brand-hover hover:bg-brand-hover shadow-lg active:shadow-xl hover:shadow-xl"
                  : "bg-gray-400 cursor-not-allowed"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="16px" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <FaCheckCircle />
                  <span>Print KOT</span>
                </div>
              )}
            </button>
          )}
          <button
            type="submit"
            disabled={isProcessing}
            className={`flex-1 px-4 py-3.5 sm:py-3 text-white rounded-lg font-medium transition-all text-base sm:text-sm touch-manipulation ${
              isPaymentComplete
                ? "bg-brand-primary active:bg-brand-hover hover:bg-brand-hover shadow-lg active:shadow-xl hover:shadow-xl"
                : "bg-gray-400 cursor-not-allowed"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner size="16px" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <FaCheckCircle />
                <span>Complete Payment</span>
              </div>
            )}
          </button>
        </div>

        {/* Validation Messages */}
        {!isPaymentComplete && paymentTotal > 0 && (
          <div
            className={`p-3 rounded-lg ${
              isPaymentOver
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-2">
              <FaExclamationCircle
                className={`mt-0.5 ${
                  isPaymentOver ? "text-yellow-600" : "text-red-600"
                }`}
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    isPaymentOver ? "text-yellow-800" : "text-red-800"
                  }`}
                >
                  {isPaymentOver
                    ? `Payment exceeds total by ${money.format(
                        paymentTotal - total
                      )}. Please adjust amounts.`
                    : `Payment incomplete. Please add ${money.format(
                        paymentRemaining
                      )} more to complete the payment.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default PaymentModal;
