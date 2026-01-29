import React, { useRef, useMemo } from "react";
import { FaPrint, FaMoneyBill, FaCreditCard, FaWallet, FaUtensils } from "react-icons/fa";
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
import { useReceiptPrint, type Order, type PrintOptions } from "react-pos-engine";
import { useAuth } from "@/context/AuthContext";
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
  spec?: string;
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
  const kotRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  const { user } = useAuth();

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

  // KOT print function with dynamic document title
  const kotPrintFn = useReactToPrint({
    contentRef: kotRef,
    documentTitle: invoiceData?.businessInfo?.name ? `KOT - ${invoiceData.businessInfo.name}` : "KOT",
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
      }
    `
  });

  // Transform invoice data to Order format for react-pos-engine
  const receiptOrder: Order | null = useMemo(() => {
    if (!invoiceData) return null;

    // Helper function to convert price to cents
    // Prices in the system are in base currency (e.g., 29.99), need to convert to cents (2999)
    const toCents = (price: number): number => {
      // Convert to cents by multiplying by 100 and rounding to avoid floating point issues
      return Math.round(price * 100);
    };

    // Build custom fields array (individual fields)
    const individualFields: Array<{ key: string; value: string }> = [];

    // Invoice Number
    if (invoiceData.invoiceNumber) {
      individualFields.push({ key: "Invoice #", value: invoiceData.invoiceNumber });
    }

    // Table Number
    if (invoiceData.tableNumber) {
      individualFields.push({ key: "Table", value: invoiceData.tableNumber });
    }

    // Guest Number
    if (invoiceData.guestNumber) {
      individualFields.push({ key: "Guests", value: String(invoiceData.guestNumber) });
    }

    // Payment Method
    if (invoiceData.payment.method) {
      const paymentMethodLabel = invoiceData.payment.method === "mobile_banking"
        ? "Mobile Banking"
        : invoiceData.payment.method.toUpperCase();
      individualFields.push({ key: "Payment Method", value: paymentMethodLabel });
    }

    // Payment Status
    if (invoiceData.payment.status) {
      individualFields.push({ key: "Payment Status", value: invoiceData.payment.status });
    }

    // Order Status
    if (invoiceData.orderStatus) {
      individualFields.push({ key: "Order Status", value: invoiceData.orderStatus });
    }

    // Tax ID
    if (invoiceData.businessInfo.taxId) {
      individualFields.push({ key: "Tax ID", value: invoiceData.businessInfo.taxId });
    }

    // Spec
    if (invoiceData.spec) {
      individualFields.push({ key: "Spec", value: invoiceData.spec });
    }

    // Remaining Amount (if partial payment)
    if (invoiceData.payment.remainingAmount > 0) {
      individualFields.push({
        key: "Remaining Amount",
        value: money.format(Number(invoiceData.payment.remainingAmount))
      });
    }

    // Special Notes as custom field
    if (invoiceData.specialNotes !== undefined &&
      invoiceData.specialNotes !== null &&
      String(invoiceData.specialNotes).trim() !== "") {
      individualFields.push({ key: "Special Notes", value: String(invoiceData.specialNotes) });
    }

    // Format custom fields into pairs with pipe separator (max 2 lines)
    // Each custom field entry will contain two field pairs separated by pipe
    const customFields: Array<{ key: string; value: string }> = [];

    // Group fields into pairs - each custom field entry = one line with 2 field pairs
    // Max 2 lines = max 4 fields total
    for (let i = 0; i < individualFields.length && i < 4; i += 2) {
      const field1 = individualFields[i];
      const field2 = individualFields[i + 1];

      if (field2) {
        // Two fields on one line: "Field1: Value1 | Field2: Value2"
        customFields.push({
          key: `${field1.key}: ${field1.value} | ${field2.key}: ${field2.value}`,
          value: ""
        });
      } else {
        // Single field on one line: "Field1: Value1"
        customFields.push({
          key: `${field1.key}: ${field1.value}`,
          value: ""
        });
      }
    }

    // If there are more than 4 fields, add remaining fields (but limit to 2 lines total)
    if (individualFields.length > 4) {
      // Start from field 4 (index 4) for the second line
      for (let i = 4; i < individualFields.length && i < 6; i += 2) {
        const field1 = individualFields[i];
        const field2 = individualFields[i + 1];

        if (field2) {
          customFields.push({
            key: `${field1.key}: ${field1.value} | ${field2.key}: ${field2.value}`,
            value: ""
          });
        } else {
          customFields.push({
            key: `${field1.key}: ${field1.value}`,
            value: ""
          });
        }
      }
    }

    // Build notes
    let notes = "";
    if (invoiceData.payment.isPartial) {
      notes = "⚠ Partial Payment";
    }

    if (!notes) {
      notes = "Thank you for your business!";
    }

    return {
      id: invoiceData.invoiceNumber,
      date: new Date(invoiceData.date).getTime(),
      items: invoiceData.items.map((item) => ({
        name: `${item.productName}${item.details ? ` - ${item.details}` : ""}`,
        price: toCents(item.unitPrice),
        quantity: item.quantity,
      })),
      subtotal: toCents(Number(invoiceData.summary.subtotal)),
      tax: toCents(Number(invoiceData.summary.tax)),
      total: toCents(Number(invoiceData.summary.total)),
      customer: {
        name: invoiceData.customer.name,
        address: invoiceData.businessInfo.address,
        phone: invoiceData.customer.phone,
        email: invoiceData.customer.email !== "N/A" ? invoiceData.customer.email : "",
      },
      customFields,
      notes,
    };
  }, [invoiceData]);

  // Print options for react-pos-engine
  const printOptions: PrintOptions = useMemo(() => ({
    layout: 2, // Layout 2: Detailed POS w/ Custom Fields
    alignment: 'center',
    primaryColor: '#000000',
    textColor: '#000000',
    borderColor: '#000000',
    headerBgColor: '#000000',
    baseFontSize: 10,
    paperSize: '80mm', // Standard 80mm receipt paper
    fontFamily: 'Arial',
    logoUrl: '',
    headerText: invoiceData?.businessInfo?.name || '',
    footerText: 'Thank you for your business!',
    sellerName: invoiceData?.businessInfo?.name || '',
    showSignature: false,
    showTaxBreakdown: true,
    customCss: '',
  }), [invoiceData]);

  // Initialize react-pos-engine print hook
  const { printReceipt } = useReceiptPrint(
    receiptOrder || {
      id: "",
      date: Date.now(),
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      customer: { name: "", address: "", phone: "", email: "" },
      customFields: [],
      notes: "",
    },
    printOptions
  );

  // Handle print button click
  const handlePrint = () => {
    if (receiptOrder && receiptOrder.items.length > 0) {
      printReceipt();
    } else {
      // Fallback to react-to-print if receipt order is not available
      reactToPrintFn();
    }
  };

  // Handle KOT print
  const handleKOTPrint = () => {
    kotPrintFn();
  };

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
                            className={`font-medium ${showOriginalPrice ? "text-red-600" : ""
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
                            className={`font-medium ${showOriginalPrice ? "text-red-600" : ""
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

        {/* KOT Receipt (Hidden, only for printing) */}
        <div style={{ display: 'none' }}>
          <div ref={kotRef} className="p-4 mx-auto" style={{
            width: '250px',
            // width: '210px',
            fontSize: '9px',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.2'
          }}>
            {/* KOT Header */}
            <div className="text-center mb-1">
              <p style={{ fontSize: '10px', margin: '0 0 2px 0', fontWeight: '500' }}>
                {invoiceData.businessInfo.name}
              </p>
              <h1 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, letterSpacing: '0.3px' }}>
                KITCHEN ORDER TICKET
              </h1>
            </div>

            {/* Table, Guest and Date Info */}
            <div className="mb-1" style={{ fontSize: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {invoiceData.tableNumber && (
                    <span style={{ fontWeight: 'bold' }}>Table: {invoiceData.tableNumber}</span>
                  )}
                  {invoiceData.tableNumber && invoiceData.guestNumber && (
                    <span style={{ margin: '0 4px' }}>|</span>
                  )}
                  {invoiceData.guestNumber && (
                    <span style={{ fontWeight: 'bold' }}>Guest: {invoiceData.guestNumber}</span>
                  )}
                </div>
                <span style={{ fontSize: '8px' }}>
                  {new Date(invoiceData.date).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            {/* <div className="mb-2 text-[11px]">
              <div>
                <span>Customer : {invoiceData.customer.name}</span>
              </div>
            </div> */}

            {/* Separator Line */}
            <div style={{ borderTop: '1px solid #000', margin: '4px 0' }}></div>

            {/* Items Table */}
            <div style={{ marginBottom: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000' }}>
                    <th style={{ textAlign: 'left', padding: '3px 2px', width: '30px', fontWeight: 'bold' }}>No.</th>
                    <th style={{ textAlign: 'left', padding: '3px 2px', fontWeight: 'bold' }}>Item Name</th>
                    <th style={{ textAlign: 'right', padding: '3px 2px', width: '35px', fontWeight: 'bold' }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index, arr) => (
                    <tr key={index} style={{ borderBottom: index === arr.length - 1 ? 'none' : '1px dashed #000' }}>
                      <td style={{ padding: '4px 2px', verticalAlign: 'top' }}>{index + 1}</td>
                      <td style={{ padding: '4px 2px', verticalAlign: 'top' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '500' }}>{item.productName}</p>
                          {item.details && (
                            <p style={{ margin: '1px 0 0 0', fontSize: '8px', color: '#666' }}>{item.details}</p>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '4px 2px', verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold' }}>
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dashed Separator */}
            <div style={{
              borderTop: '1px dashed #000',
              width: '100%',
              margin: '4px 0'
            }}></div>

            {/* Total Items */}
            <div style={{
              fontSize: '9px',
              textAlign: 'right',
              fontWeight: 'bold',
              padding: '2px 0'
            }}>
              <span>Total Items: {invoiceData.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>

            {/* Dashed Separator */}
            <div style={{
              borderTop: '1px dashed #000',
              width: '100%',
              margin: '4px 0'
            }}></div>

            {/* Special Instructions */}
            {invoiceData.specialNotes !== undefined &&
              invoiceData.specialNotes !== null &&
              String(invoiceData.specialNotes).trim() !== "" && (
                <div style={{
                  marginTop: '4px',
                  padding: '6px',
                  border: '1px solid #000',
                  borderRadius: '2px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <h3 style={{
                    fontWeight: 'bold',
                    fontSize: '9px',
                    marginBottom: '3px',
                    textTransform: 'uppercase'
                  }}>Special Instructions:</h3>
                  <p style={{
                    fontSize: '9px',
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                    lineHeight: '1.3'
                  }}>{String(invoiceData.specialNotes)}</p>
                </div>
              )}
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
          {user?.shopType === "restaurant" && <button
            onClick={handleKOTPrint}
            disabled={!invoiceData || invoiceData.items.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaUtensils className="w-4 h-4" />
            Print KOT
          </button>}
          <button
            onClick={handlePrint}
            disabled={!invoiceData || invoiceData.items.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPrint className="w-4 h-4" />
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
