import React, { useRef } from "react";
import { FaPrint, FaMoneyBill, FaCreditCard, FaWallet } from "react-icons/fa";
// import LogoSvg from "./icons/LogoSvg";
import { getExpiryDate } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import { ORDERS_URL } from "@/api/api";
import Spinner from "./Spinner";
import { toast } from "react-toastify";
import { useReactToPrint } from "react-to-print";
import LogoSvg from "./icons/LogoSvg";
import money from "@/utils/money";
// import { useAuth } from "@/context/AuthContext";

interface InvoiceItem {
  productName: string;
  sku: string;
  details: string;
  quantity: number;
  unitPrice: number;
  originalUnitPrice?: number;
  subtotal: number;
  originalSubtotal?: number;
  discount?: {
    type: "percentage" | "amount";
    unitDiscount: number;
    totalDiscount: number;
    hasDiscount: boolean;
    discountAmount: number;
  };
}

interface InvoiceData {
  invoiceNumber: string;
  guestNumber?: number;
  specialNotes?: number | string;
  tableNumber?: string;
  date: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  items: InvoiceItem[];
  summary: {
    subtotal: string;
    tax: string;
    taxRate: string;
    discount: string;
    discountRate: string;
    total: string;
  };
  payment: {
    method: "cash" | "card" | "mobile_banking" | "mixed";
    status: string;
    cashAmount?: number;
    cardAmount?: number;
    walletAmount?: number;
    paidAmount: number;
    totalAmount: number;
    remainingAmount: number;
    isPaid: boolean;
    isPartial: boolean;
  };
  orderStatus: string;
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
  };
  stats: {
    totalItems: number;
    totalUniqueItems: number;
    averageItemPrice: string;
  };
}

interface InvoiceProps {
  orderId: number;
  onClose: () => void;
  onPrint: () => void;
}

const Invoice: React.FC<InvoiceProps> = ({ orderId, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  // const auth = useAuth();

  const { data: invoiceData, isLoading } = useQuery<InvoiceData>({
    queryKey: ["invoice", orderId],
    queryFn: async () => {
      try {
        const response = await AXIOS.get(
          `${ORDERS_URL}/${Number(orderId || 0)}/invoice`
        );
        return response.data;
      } catch (error: any) {
        toast.error(error?.message || "Failed to fetch invoice");
        return null;
      }
    },
    enabled: !!orderId,
  });

  if (!orderId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner color="#32cd32" size="40px" />
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Failed to load invoice data</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center z-50">
      <div className="w-full">
        <div className="p-6" id="invoice-print" ref={contentRef}>
          {/* Business Info */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <LogoSvg className="h-[90px]" />
            </div>
            <h2 className="text-xl font-semibold">
              {invoiceData.businessInfo.name}
            </h2>
            <p className="text-gray-500 text-sm">
              {invoiceData.businessInfo.address}
            </p>
            <p className="text-gray-500 text-sm">
              Tel: {invoiceData.businessInfo.phone} | Email:{" "}
              {invoiceData.businessInfo.email}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Invoice #{invoiceData.invoiceNumber} •{" "}
              {new Date(invoiceData.date).toLocaleString()}
            </p>
          </div>

          {/* Customer Info */}
          <div className="mb-6 text-sm">
            <h3 className="font-medium mb-2">Customer Information</h3>
            <p>Name: {invoiceData.customer.name}</p>
            <p>Phone: {invoiceData.customer.phone}</p>
            {invoiceData.customer.email !== "N/A" && (
              <p>Email: {invoiceData.customer.email}</p>
            )}
            {(invoiceData.guestNumber || invoiceData.tableNumber) && (
              <div className="mt-3 pt-3 border-t">
                {invoiceData.tableNumber && (
                  <p className="font-medium">Table: {invoiceData.tableNumber}</p>
                )}
                {invoiceData.guestNumber && (
                  <p className="font-medium">Guests: {invoiceData.guestNumber}</p>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-6  overflow-x-auto border px-4 py-1 rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2 min-w-[50px]">Qty</th>
                  <th className="text-center py-2 min-w-[100px]">Price</th>
                  <th className="text-right py-2 min-w-[100px] pr-5">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => {
                  const hasDiscount = item.discount?.hasDiscount || false;
                  const originalPrice =
                    item.unitPrice + (item.discount?.unitDiscount || 0);
                  const showOriginalPrice = hasDiscount;

                  return (
                    <tr key={index} className="border-b">
                      <td className="py-2">
                        <div>
                          <p className="font-medium">
                            {item.productName || "Item"}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {item.sku} | {item.details}
                          </p>
                          {/* {hasDiscount && item.discount && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                              {item.discount.type === "percentage"
                                ? `-${item.discount.unitDiscount}%`
                                : `-${money.format(
                                    item.discount.unitDiscount
                                  )}`}
                            </span>
                          )} */}
                        </div>
                      </td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-center py-2">
                        <div className="flex flex-col items-center">
                          {showOriginalPrice && (
                            <span className="text-xs text-gray-400 line-through mb-0.5">
                              {money.format(originalPrice)}
                            </span>
                          )}
                          <span
                            className={`font-medium ${
                              showOriginalPrice ? "text-red-600" : ""
                            }`}
                          >
                            {money.format(item.unitPrice)}
                          </span>
                        </div>
                      </td>
                      <td className="text-right  pr-5 py-2">
                        <div className="flex flex-col items-end">
                          {showOriginalPrice && originalPrice && (
                            <span className="text-xs text-gray-400 line-through mb-0.5">
                              {money.format(originalPrice * item.quantity || 0)}
                            </span>
                          )}
                          <span
                            className={`font-medium ${
                              showOriginalPrice ? "text-red-600" : ""
                            }`}
                          >
                            {money.format(item.subtotal)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Special Notes */}
          {invoiceData.specialNotes !== undefined && 
           invoiceData.specialNotes !== null && 
           String(invoiceData.specialNotes).trim() !== "" && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-medium text-sm mb-1 text-yellow-800">Special Notes</h3>
              <p className="text-sm text-yellow-700 whitespace-pre-wrap">{String(invoiceData.specialNotes)}</p>
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{money.format(Number(invoiceData.summary.subtotal))}</span>
            </div>
            {Number(invoiceData.summary.tax) > 0 && (
              <div className="flex justify-between">
                <span>Tax ({invoiceData.summary.taxRate})</span>
                <span>{money.format(Number(invoiceData.summary.tax))}</span>
              </div>
            )}
            {Number(invoiceData.summary.discount) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount ({invoiceData.summary.discountRate})</span>
                <span>
                  -{money.format(Number(invoiceData.summary.discount))}
                </span>
              </div>
            )}
            <div className="flex justify-between font-medium text-lg pt-2 border-t">
              <span>Total</span>
              <span>{money.format(Number(invoiceData.summary.total))}</span>
            </div>

            {/* Payment Information */}
            <div className="pt-2 border-t space-y-2">
              {/* Payment Method */}
              {invoiceData.payment.method === "mixed" ? (
                <>
                  {Number(invoiceData?.payment?.cashAmount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <FaMoneyBill className="text-green-600 text-xs" />
                        Cash
                      </span>
                      <span>
                        {money.format(Number(invoiceData.payment.cashAmount))}
                      </span>
                    </div>
                  )}
                  {Number(invoiceData?.payment?.cardAmount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <FaCreditCard className="text-blue-600 text-xs" />
                        Card
                      </span>
                      <span>
                        {money.format(Number(invoiceData.payment.cardAmount))}
                      </span>
                    </div>
                  )}
                  {Number(invoiceData?.payment?.walletAmount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <FaWallet className="text-purple-600 text-xs" />
                        Wallet
                      </span>
                      <span>
                        {money.format(Number(invoiceData.payment.walletAmount))}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    {invoiceData.payment.method === "cash" && (
                      <FaMoneyBill className="text-green-600 text-xs" />
                    )}
                    {invoiceData.payment.method === "card" && (
                      <FaCreditCard className="text-blue-600 text-xs" />
                    )}
                    {invoiceData.payment.method === "mobile_banking" && (
                      <FaWallet className="text-purple-600 text-xs" />
                    )}
                    Payment Method
                  </span>
                  <span className="capitalize">
                    {invoiceData.payment.method === "mobile_banking"
                      ? "Mobile Banking"
                      : invoiceData.payment.method.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Payment Amounts */}
              <div className="flex justify-between">
                <span>Paid Amount</span>
                <span className="text-green-600 font-medium">
                  {money.format(Number(invoiceData.payment.paidAmount))}
                </span>
              </div>
              {invoiceData.payment.remainingAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Remaining</span>
                  <span>
                    {money.format(Number(invoiceData.payment.remainingAmount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span className="capitalize">{invoiceData.payment.status}</span>
              </div>
              {invoiceData.payment.isPartial && (
                <div className="flex justify-between text-orange-600 text-xs">
                  <span>⚠ Partial Payment</span>
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Thank you for your business!
          </p>

          {/* Barcode */}
          {/* <div className="mt-6 flex flex-col items-center justify-center border-t pt-4">
            <Barcode
              value={invoiceData.invoiceNumber}
              width={1.5}
              height={50}
              fontSize={12}
              margin={0}
              displayValue={true}
            />
          </div> */}

          {/* Business Details */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Tax ID: {invoiceData.businessInfo.taxId}</p>
            <p className="text-xs text-black font-medium">Glory POS</p>
            <p className="mt-1">
              Valid until: {getExpiryDate(invoiceData.date)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t px-6 py-4 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Close
          </button>
          <button
            onClick={() => reactToPrintFn()}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover rounded-md flex items-center gap-2"
          >
            <FaPrint className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
