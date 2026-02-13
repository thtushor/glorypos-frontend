import React, { useRef, useMemo, useState } from "react";
import {
  FaPrint,
  FaMoneyBill,
  FaCreditCard,
  FaWallet,
  FaUtensils,
  FaDownload,
} from "react-icons/fa";
import Modal from "./Modal";
import html2canvas from "html2canvas";
// import LogoSvg from "./icons/LogoSvg";
import { getExpiryDate } from "@/utils/utils";
import { useQuery } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import { ORDERS_URL } from "@/api/api";
import Spinner from "./Spinner";
import { toast } from "react-toastify";
import { useReactToPrint } from "react-to-print";
import LogoSvg from "@/assets/invoice-logo.png";
import money from "@/utils/money";
import {
  useReceiptPrint,
  type Order,
  type PrintOptions,
} from "react-pos-engine";
import { useAuth } from "@/context/AuthContext";
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import { useWebViewPrint } from "@/hooks/useWebViewPrint";

const WIDTH = 32;

function twoColumn(left: string, right: string) {
  const space = Math.max(WIDTH - left.length - right.length, 1);
  return left + " ".repeat(space) + right;
}

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
  const standardLine = "--------------------------------";
  const [printing, setPrinting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const kotRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
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
    `,
  });

  const { user } = useAuth();
  const { isWebView, sendPrintSignal } = useWebViewPrint();

  const { data: invoiceData, isLoading } = useQuery<InvoiceData>({
    queryKey: ["invoice", orderId],
    queryFn: async () => {
      try {
        const response = await AXIOS.get(
          `${ORDERS_URL}/${Number(orderId || 0)}/invoice`,
        );
        return response.data;
      } catch (error: any) {
        toast.error(error?.message || "Failed to fetch invoice");
        return null;
      }
    },
    enabled: !!orderId,
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
      individualFields.push({
        key: "Invoice #",
        value: invoiceData.invoiceNumber,
      });
    }

    // Table Number
    if (invoiceData.tableNumber) {
      individualFields.push({ key: "Table", value: invoiceData.tableNumber });
    }

    // Guest Number
    if (invoiceData.guestNumber) {
      individualFields.push({
        key: "Guests",
        value: String(invoiceData.guestNumber),
      });
    }

    // Payment Method
    if (invoiceData.payment.method) {
      const paymentMethodLabel =
        invoiceData.payment.method === "mobile_banking"
          ? "Mobile Banking"
          : invoiceData.payment.method.toUpperCase();
      individualFields.push({
        key: "Payment Method",
        value: paymentMethodLabel,
      });
    }

    // Payment Status
    if (invoiceData.payment.status) {
      individualFields.push({
        key: "Payment Status",
        value: invoiceData.payment.status,
      });
    }

    // Order Status
    if (invoiceData.orderStatus) {
      individualFields.push({
        key: "Order Status",
        value: invoiceData.orderStatus,
      });
    }

    // Tax ID
    if (invoiceData.businessInfo.taxId) {
      individualFields.push({
        key: "Tax ID",
        value: invoiceData.businessInfo.taxId,
      });
    }

    // Spec
    if (invoiceData.spec) {
      individualFields.push({ key: "Spec", value: invoiceData.spec });
    }

    // Remaining Amount (if partial payment)
    if (invoiceData.payment.remainingAmount > 0) {
      individualFields.push({
        key: "Remaining Amount",
        value: money.format(Number(invoiceData.payment.remainingAmount)),
      });
    }

    // Special Notes as custom field
    if (
      invoiceData.specialNotes !== undefined &&
      invoiceData.specialNotes !== null &&
      String(invoiceData.specialNotes).trim() !== ""
    ) {
      individualFields.push({
        key: "Special Notes",
        value: String(invoiceData.specialNotes),
      });
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
          value: "",
        });
      } else {
        // Single field on one line: "Field1: Value1"
        customFields.push({
          key: `${field1.key}: ${field1.value}`,
          value: "",
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
            value: "",
          });
        } else {
          customFields.push({
            key: `${field1.key}: ${field1.value}`,
            value: "",
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
        email:
          invoiceData.customer.email !== "N/A"
            ? invoiceData.customer.email
            : "",
      },
      customFields,
      notes,
    };
  }, [invoiceData]);

  // Print options for react-pos-engine
  const printOptions: PrintOptions = useMemo(
    () => ({
      layout: 2, // Layout 2: Detailed POS w/ Custom Fields
      alignment: "center",
      primaryColor: "#000000",
      textColor: "#000000",
      borderColor: "#000000",
      headerBgColor: "#000000",
      baseFontSize: 10,
      paperSize: "80mm", // Standard 80mm receipt paper
      fontFamily: "Arial",
      logoUrl: "",
      headerText: invoiceData?.businessInfo?.name || "",
      footerText: "Thank you for your business!",
      sellerName: invoiceData?.businessInfo?.name || "",
      showSignature: false,
      showTaxBreakdown: true,
      customCss: "",
    }),
    [invoiceData],
  );

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
    printOptions,
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

  // USB Printer utility
  const getPrinter = async () => {
    try {
      // Try previously authorized devices
      const devices = await (navigator as any).usb.getDevices();
      if (devices.length > 0) return devices[0];

      // First-time setup
      return await (navigator as any).usb.requestDevice({
        filters: [{ classCode: 7 }], // Printer class
      });
    } catch (err) {
      throw new Error("Printer not connected or permission denied");
    }
  };

  const WIDTH = 32; // total characters per line
  const QTY_WIDTH = 5; // "QTY "
  const ITEM_WIDTH_KOT = WIDTH - QTY_WIDTH - 2;

  const TOTAL_WIDTH = 10; // "  TOTAL"
  const ITEM_WIDTH = WIDTH - QTY_WIDTH - TOTAL_WIDTH;

  function centerText(text: string, width: number) {
    const clean = text.trim();
    const totalSpace = Math.max(width - clean.length - 2, 0); // 2 for spaces
    const leftDots = Math.floor(totalSpace / 2);

    return "-" + " ".repeat(leftDots) + " " + clean;
  }

  function wrapText(text: string, maxChars: number) {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if ((currentLine + (currentLine ? " " : "") + word).length <= maxChars) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }
  // Handle KOT print with encoding
  const handleKOTPrint = async () => {
    setPrinting(true);
    setError(null);

    try {
      if (!invoiceData) return;

      if (isWebView) {
        sendPrintSignal("KOT", invoiceData);
        // toast.success("KOT print signal sent to app");
        onClose();
        setPrinting(false);
        return;
      }

      const device = await getPrinter();

      await device.open();
      if (!device.configuration) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);

      const encoder = new ReceiptPrinterEncoder();

      let receipt = encoder
        .initialize()

        .align("left")
        .bold(true)
        .line(centerText(invoiceData.businessInfo.name, WIDTH))
        .bold(true)
        .line(centerText("KITCHEN ORDER TICKET", WIDTH))
        .align("left")
        .line(
          `${centerText(String(new Date(invoiceData.date).toLocaleString()), WIDTH)}`,
        )
        .text(standardLine)
        .align("left");
      if (invoiceData.tableNumber) {
        receipt = receipt
          .bold(false)
          .line(`Table : ${String(invoiceData.tableNumber || "demo")}`)
          .bold(false);
      }
      if (invoiceData.guestNumber) {
        receipt = receipt
          .bold(false)
          .line(`Guests: ${String(invoiceData.guestNumber)}`)
          .bold(false);
      }

      // Add items
      receipt = receipt
        .line(standardLine)
        .bold(true)
        .text("QTY ".padEnd(QTY_WIDTH) + "ITEM".padEnd(ITEM_WIDTH_KOT) + "\n")
        .bold(false);

      // ===== ITEMS =====

      invoiceData.items.forEach((item) => {
        const qty = String(item.quantity + "x").padEnd(QTY_WIDTH);

        const wrappedNames = wrapText(item.productName, ITEM_WIDTH_KOT);

        // First line → qty + first part of name
        receipt = receipt.line(qty + wrappedNames[0].padEnd(ITEM_WIDTH_KOT));

        // Remaining lines → name only (aligned under item name)
        for (let i = 1; i < wrappedNames.length; i++) {
          receipt = receipt.line(
            "-" +
              " ".repeat(QTY_WIDTH - 1) +
              wrappedNames[i].padEnd(ITEM_WIDTH_KOT),
          );
        }

        if (item.details) {
          const detailsLine = item.details.slice(0, WIDTH - 4);

          receipt = receipt.line("-    " + detailsLine);
        }
      });

      receipt = receipt.line(standardLine);

      receipt = receipt
        .bold(true)
        .align("left")
        .text(
          `Total Items:    ${invoiceData.items.reduce((sum, item) => sum + item.quantity, 0)}`,
        );

      // Special notes
      if (
        invoiceData.specialNotes &&
        String(invoiceData.specialNotes).trim() !== ""
      ) {
        receipt = receipt
          .line("")
          .align("left")
          .bold(true)
          .line("SPECIAL INSTRUCTIONS:")
          .bold(false);

        wrapText(String(invoiceData.specialNotes), 30).forEach((line) => {
          receipt = receipt.line(line);
        });
      }

      const encoded = receipt.newline().newline().cut().encode();

      // Endpoint 1 is common for ESC/POS printers
      await device.transferOut(1, encoded);

      await device.releaseInterface(0);
      await device.close();

      // toast.success("KOT printed successfully");
    } catch (err: any) {
      console.error("❌ KOT print failed:", err);
      setError(err?.message || "Printer not connected or permission denied");
      // toast.error(err?.message || "Failed to print KOT");
    } finally {
      setPrinting(false);
    }
  };

  // Handle Invoice print (80mm POS thermal) with encoding
  const handleInvoicePrint = async () => {
    setPrinting(true);
    setError(null);

    try {
      if (!invoiceData) return;

      if (isWebView) {
        sendPrintSignal("INVOICE", invoiceData);
        // toast.success("Invoice print signal sent to app");
        onClose();
        setPrinting(false);
        return;
      }

      const device = await getPrinter();

      await device.open();
      if (!device.configuration) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);

      const encoder = new ReceiptPrinterEncoder();

      let receipt = encoder
        .initialize()

        // ===== HEADER =====
        .align("left")
        .bold(true)
        .line(centerText(invoiceData.businessInfo.name, WIDTH))
        .bold(false)
        .line(centerText(invoiceData.businessInfo.address, WIDTH))
        .line(centerText(`Tel: ${invoiceData.businessInfo.phone}`, WIDTH))
        .text(standardLine)

        .bold(true)
        .line("INVOICE")
        .bold(false)

        // ===== META =====
        .align("left")
        .line(`Invoice : #${invoiceData.invoiceNumber}`)
        .align("left")
        .line(`Date    : ${new Date(invoiceData.date).toLocaleString()}`)
        .align("left");

      if (invoiceData.tableNumber) {
        receipt = receipt
          .bold(false)
          .line(`Table   : ${String(invoiceData.tableNumber || "demo")}`)
          .bold(false);
      }
      if (invoiceData.guestNumber) {
        receipt = receipt
          .bold(false)
          .line(`Guests  : ${String(invoiceData.guestNumber)}`)
          .bold(false);
      }

      receipt = receipt
        .bold(false)
        .line(`Customer: ${invoiceData.customer.name}`)
        .bold(false)
        .line(`Phone   : ${invoiceData.customer.phone}`)
        .line(standardLine);

      // ===== ITEMS HEADER =====
      receipt = receipt
        .bold(true)
        .text(
          "QTY ".padEnd(QTY_WIDTH) +
            "ITEM".padEnd(ITEM_WIDTH) +
            "TOTAL".padStart(TOTAL_WIDTH) +
            "\n",
        )
        .bold(false);

      // ===== ITEMS =====
      invoiceData.items.forEach((item) => {
        const qty = String(item.quantity + "x").padEnd(QTY_WIDTH);
        const formatMoney = (amount: number) =>
          `${Math.round(amount).toString()}`;
        const total = formatMoney(item.subtotal).padStart(TOTAL_WIDTH - 2);

        // Item name: single line only
        const itemName = item.productName.slice(0, ITEM_WIDTH);

        // Main item line
        receipt = receipt.line(
          qty + itemName.padEnd(ITEM_WIDTH - 1) + ".." + total,
        );

        // Details: start from LEFT with "-   "
        if (item.details) {
          const detailsLine = item.details.slice(0, WIDTH - 4);

          receipt = receipt.line("-    " + detailsLine);
        }

        receipt = receipt;
      });

      receipt = receipt.text(standardLine);

      // ===== TOTAL =====
      // receipt = receipt
      //   .text(
      //     twoColumn(
      //       "Subtotal:",
      //       money.format(Number(invoiceData.summary.subtotal)),
      //     ),
      //   )
      //   .text(standardLine);

      receipt = receipt
        .text("")
        .bold(true)
        .text(twoColumn("TOTAL:", `${Number(invoiceData.summary.total)}`))
        .bold(false);

      // Payment info
      const paymentMethod =
        invoiceData.payment.method === "mobile_banking"
          ? "Mobile Banking"
          : invoiceData.payment.method;

      receipt = receipt
        .text("")
        .line(twoColumn("Payment Method:", paymentMethod))
        .line(twoColumn("Payment Status:", invoiceData.payment.status))
        .bold(true)
        .text(
          twoColumn(
            "Paid Amount:",
            `${Number(invoiceData.payment.paidAmount)}`,
          ),
        );

      if (invoiceData.payment.remainingAmount > 0) {
        receipt = receipt.text(
          twoColumn(
            "Remaining:",
            `${Number(invoiceData.payment.remainingAmount || 0)}`,
          ),
        );
      }
      // ===== FOOTER =====
      receipt = receipt
        .line(standardLine)
        .align("left")
        .bold(true)
        .text("...........THANK YOU!...........");

      const encoded = receipt.cut().encode();

      // Endpoint 1 is common for ESC/POS printers
      await device.transferOut(1, encoded);

      await device.releaseInterface(0);
      await device.close();

      // toast.success("Invoice printed successfully");
    } catch (err: any) {
      console.error("❌ Invoice print failed:", err);
      setError(err?.message || "Printer not connected or permission denied");
      // toast.error(err?.message || "Failed to print invoice");
    } finally {
      setPrinting(false);
    }
  };

  // Handle KOT download as image
  const handleKOTDownload = async () => {
    if (!kotRef.current || !invoiceData) {
      toast.error("Invoice data not available");
      return;
    }

    try {
      const element = kotRef.current;

      // Wait a bit to ensure everything is rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `KOT-${invoiceData.invoiceNumber}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success("KOT downloaded successfully");
        }
      }, "image/png");
    } catch (error) {
      console.error("KOT download failed:", error);
      toast.error("Failed to download KOT");
    }
  };

  // Handle Invoice download as image
  const handleInvoiceDownload = async () => {
    if (!invoiceRef.current || !invoiceData) {
      toast.error("Invoice data not available");
      return;
    }

    try {
      const element = invoiceRef.current;

      // Wait a bit to ensure everything is rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `Invoice-${invoiceData.invoiceNumber}-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success("Invoice downloaded successfully");
        }
      }, "image/png");
    } catch (error) {
      console.error("Invoice download failed:", error);
      toast.error("Failed to download invoice");
    }
  };

  // Handle View in full screen modal
  // const handleView = async () => {
  //   if (!invoiceRef.current || !invoiceData) {
  //     toast.error("Invoice data not available");
  //     return;
  //   }

  //   try {
  //     const element = invoiceRef.current;

  //     // Wait a bit to ensure everything is rendered
  //     await new Promise((resolve) => setTimeout(resolve, 100));

  //     const canvas = await html2canvas(element, {
  //       backgroundColor: "#ffffff",
  //       scale: 3,
  //       useCORS: true,
  //       allowTaint: true,
  //       logging: false,
  //     });

  //     const imageUrl = canvas.toDataURL("image/png");
  //     setPreviewImage(imageUrl);
  //     setShowPreviewModal(true);
  //   } catch (error) {
  //     console.error("View failed:", error);
  //     toast.error("Failed to generate preview");
  //   }
  // };

  console.log({ handlePrint });

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
        <div className="" id="invoice-print" ref={contentRef}>
          {/* Business Info */}
          <div className="text-center mb-4 bg-brand-primary/20 rounded-lg p-4 mt-[-10px]">
            <div className="flex justify-center mb-3">
              {/* <LogoSvg className="h-[90px]" /> */}
              <img src={LogoSvg} className="h-[50px]" />
            </div>
            <h2 className="text-lg md:text-xl font-bold">
              {invoiceData.businessInfo.name}
            </h2>
            <p className="text-gray-500 text-sm">
              {invoiceData.businessInfo.address}
            </p>
            <p className="text-gray-500 text-sm">
              {invoiceData.businessInfo.phone} <div className="block " />{" "}
              {invoiceData.businessInfo.email}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              #{invoiceData.invoiceNumber} •{" "}
              {new Date(invoiceData.date).toLocaleString()}
            </p>
          </div>

          {/* Customer Info */}
          <div className="mb-2 text-sm">
            <h3 className="font-bold text-base">Customer Information</h3>
            <p>Name: {invoiceData.customer.name}</p>
            <p>Phone: {invoiceData.customer.phone}</p>
            {invoiceData.customer.email !== "N/A" && (
              <p>Email: {invoiceData.customer.email}</p>
            )}
            {(invoiceData.guestNumber || invoiceData.tableNumber) && (
              <div className="mt-1 pt-1 border-t">
                {invoiceData.tableNumber && (
                  <p className="font-medium">
                    Table: {invoiceData.tableNumber}
                  </p>
                )}
                {invoiceData.guestNumber && (
                  <p className="font-medium">
                    Guests: {invoiceData.guestNumber}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-2  overflow-x-auto border px-2">
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
              <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="font-medium text-sm mb-1 text-yellow-800">
                  Special Notes
                </h3>
                <p className="text-sm text-yellow-700 whitespace-pre-wrap">
                  {String(invoiceData.specialNotes)}
                </p>
              </div>
            )}

          {/* Summary */}
          <div className="space-y-[6px] text-sm">
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
            <div className="flex justify-between font-bold text-base md:text-lg">
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

          <p className="mt-3 bg-brand-primary/20 w-fit rounded-full px-3 py-[1px] font-semibold mx-auto text-center text-sm text-gray-500">
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
          <div className="mt-2 uppercase text-center text-xs text-gray-500 bg-brand-primary/20 rounded-lg p-4 py-2 mb-3">
            <p>Tax ID: {invoiceData.businessInfo.taxId}</p>
            <p className="text-xs font-semibold text-black">GLORY POS</p>
            <p className="mt-1">
              VALID TILL: {getExpiryDate(invoiceData.date)}
            </p>
          </div>
        </div>

        {/* KOT Receipt (Hidden, only for downloading) */}
        <div
          style={{ position: "fixed", left: "-9999px", top: "0", zIndex: -1 }}
        >
          <div
            ref={kotRef}
            id="kot-print-content"
            style={{
              width: "220px",
              maxWidth: "220px",
              fontSize: "11px",
              fontFamily: "Arial, sans-serif",
              lineHeight: "1.4",
              padding: "8px",
              boxSizing: "border-box",
              backgroundColor: "#ffffff",
              color: "#000000",
            }}
          >
            {/* KOT Header */}
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <p
                style={{
                  fontSize: "13px",
                  margin: "0 0 4px 0",
                  fontWeight: "bold",
                }}
              >
                {invoiceData.businessInfo.name}
              </p>
              <h1
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: 0,
                  letterSpacing: "0.5px",
                }}
              >
                KITCHEN ORDER TICKET
              </h1>
            </div>

            {/* Table, Guest and Date Info */}
            <div style={{ marginBottom: "8px", fontSize: "11px" }}>
              <div style={{ marginBottom: "4px" }}>
                {invoiceData.tableNumber && (
                  <div style={{ fontWeight: "bold" }}>
                    Table: {invoiceData.tableNumber}
                  </div>
                )}
                {invoiceData.guestNumber && (
                  <div style={{ fontWeight: "bold" }}>
                    Guests: {invoiceData.guestNumber}
                  </div>
                )}
                <div style={{ fontSize: "10px", marginTop: "4px" }}>
                  {new Date(invoiceData.date).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
              </div>
            </div>

            {/* Separator Line */}
            <div style={{ borderTop: "2px solid #000", margin: "8px 0" }}></div>

            {/* Items Table */}
            <div style={{ marginBottom: "8px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "11px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #000" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "6px 4px",
                        width: "30px",
                        fontWeight: "bold",
                      }}
                    >
                      No.
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "6px 4px",
                        fontWeight: "bold",
                      }}
                    >
                      Item Name
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "6px 4px",
                        width: "40px",
                        fontWeight: "bold",
                      }}
                    >
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index, arr) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom:
                          index === arr.length - 1 ? "none" : "1px dashed #000",
                      }}
                    >
                      <td style={{ padding: "6px 4px", verticalAlign: "top" }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: "6px 4px", verticalAlign: "top" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: "600" }}>
                            {item.productName}
                          </p>
                          {item.details && (
                            <p
                              style={{
                                margin: "2px 0 0 0",
                                fontSize: "10px",
                                color: "#666",
                              }}
                            >
                              {item.details}
                            </p>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "6px 4px",
                          verticalAlign: "top",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dashed Separator */}
            <div
              style={{
                borderTop: "2px dashed #000",
                width: "100%",
                margin: "8px 0",
              }}
            ></div>

            {/* Total Items */}
            <div
              style={{
                fontSize: "12px",
                textAlign: "right",
                fontWeight: "bold",
                padding: "4px 0",
              }}
            >
              <span>
                Total Items:{" "}
                {invoiceData.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                )}
              </span>
            </div>

            {/* Special Instructions */}
            {invoiceData.specialNotes !== undefined &&
              invoiceData.specialNotes !== null &&
              String(invoiceData.specialNotes).trim() !== "" && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "8px",
                    border: "2px solid #000",
                    borderRadius: "4px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <h3
                    style={{
                      fontWeight: "bold",
                      fontSize: "11px",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    Special Instructions:
                  </h3>
                  <p
                    style={{
                      fontSize: "11px",
                      whiteSpace: "pre-wrap",
                      margin: 0,
                      lineHeight: "1.4",
                    }}
                  >
                    {String(invoiceData.specialNotes)}
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Invoice Receipt (Hidden, only for downloading) - 80mm POS thermal */}
        <div
          style={{ position: "fixed", left: "-9999px", top: "0", zIndex: -1 }}
        >
          <div
            ref={invoiceRef}
            id="invoice-print-content"
            style={{
              width: "300px",
              maxWidth: "300px",
              fontSize: "12px",
              fontFamily: "Arial, sans-serif",
              lineHeight: "1.4",
              padding: "16px",
              boxSizing: "border-box",
              backgroundColor: "#ffffff",
              color: "#000000",
            }}
          >
            {/* Header - Business Name */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "0 0 8px 0",
                  textTransform: "uppercase",
                }}
              >
                {invoiceData.businessInfo.name}
              </h1>
              <p style={{ fontSize: "11px", margin: "4px 0", color: "#333" }}>
                {invoiceData.businessInfo.address}
              </p>
              <p style={{ fontSize: "11px", margin: "4px 0", color: "#333" }}>
                Tel: {invoiceData.businessInfo.phone}
              </p>
            </div>

            {/* Separator */}
            <div
              style={{ borderTop: "2px solid #000", margin: "12px 0" }}
            ></div>

            {/* Invoice Title */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: "0 0 8px 0",
                }}
              >
                INVOICE
              </h2>
              <p style={{ fontSize: "11px", margin: "2px 0" }}>
                Invoice #: {invoiceData.invoiceNumber}
              </p>
              <p style={{ fontSize: "11px", margin: "2px 0" }}>
                Date: {new Date(invoiceData.date).toLocaleString()}
              </p>
            </div>

            {/* Invoice Info */}
            <div style={{ fontSize: "11px", marginBottom: "12px" }}>
              {invoiceData.tableNumber && (
                <p style={{ margin: "2px 0" }}>
                  <strong>Table:</strong> {invoiceData.tableNumber}
                </p>
              )}
              {invoiceData.guestNumber && (
                <p style={{ margin: "2px 0" }}>
                  <strong>Guests:</strong> {invoiceData.guestNumber}
                </p>
              )}
              <p style={{ margin: "2px 0" }}>
                <strong>Customer:</strong> {invoiceData.customer.name}
              </p>
              <p style={{ margin: "2px 0" }}>
                <strong>Phone:</strong> {invoiceData.customer.phone}
              </p>
            </div>

            {/* Separator */}
            <div
              style={{ borderTop: "2px solid #000", margin: "12px 0" }}
            ></div>

            {/* Items Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: "12px",
                padding: "6px 0",
                borderBottom: "2px solid #000",
              }}
            >
              <span style={{ width: "40px" }}>QTY</span>
              <span style={{ flex: 1, paddingLeft: "8px" }}>ITEM</span>
              <span style={{ width: "70px", textAlign: "right" }}>TOTAL</span>
            </div>

            {/* Items */}
            <div style={{ marginBottom: "12px" }}>
              {invoiceData.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    padding: "6px 0",
                    borderBottom:
                      index < invoiceData.items.length - 1
                        ? "1px dashed #ccc"
                        : "none",
                  }}
                >
                  <span style={{ width: "40px", color: "#000" }}>
                    {item.quantity}
                  </span>
                  <span style={{ flex: 1, paddingLeft: "8px" }}>
                    {item.productName}
                    {item.details && (
                      <span
                        style={{
                          color: "#666",
                          fontSize: "10px",
                          display: "block",
                        }}
                      >
                        {item.details}
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      width: "70px",
                      textAlign: "right",
                      fontWeight: "500",
                    }}
                  >
                    {money.format(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Separator */}
            <div
              style={{ borderTop: "2px solid #000", margin: "12px 0" }}
            ></div>

            {/* Summary */}
            <div style={{ fontSize: "12px", marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                }}
              >
                <span>Subtotal:</span>
                <span>
                  {money.format(Number(invoiceData.summary.subtotal))}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                }}
              >
                <span>Tax ({invoiceData.summary.taxRate}):</span>
                <span>{money.format(Number(invoiceData.summary.tax))}</span>
              </div>
              {Number(invoiceData.summary.discount) > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0",
                    color: "#c00",
                  }}
                >
                  <span>Discount ({invoiceData.summary.discountRate}):</span>
                  <span>
                    -{money.format(Number(invoiceData.summary.discount))}
                  </span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div
              style={{
                borderTop: "2px solid #000",
                borderBottom: "2px solid #000",
                padding: "10px 0",
                margin: "12px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                <span>GRAND TOTAL:</span>
                <span>{money.format(Number(invoiceData.summary.total))}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div style={{ fontSize: "11px", marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                }}
              >
                <span>Payment Method:</span>
                <span>
                  {invoiceData.payment.method === "mobile_banking"
                    ? "Mobile Banking"
                    : invoiceData.payment.method.toUpperCase()}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                }}
              >
                <span>Payment Status:</span>
                <span>{invoiceData.payment.status}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                }}
              >
                <span>Paid Amount:</span>
                <span style={{ color: "#0a0", fontWeight: "bold" }}>
                  {money.format(Number(invoiceData.payment.paidAmount))}
                </span>
              </div>
              {invoiceData.payment.remainingAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "2px 0",
                    color: "#c00",
                  }}
                >
                  <span>Remaining:</span>
                  <span style={{ fontWeight: "bold" }}>
                    {money.format(Number(invoiceData.payment.remainingAmount))}
                  </span>
                </div>
              )}
            </div>

            {/* Separator */}
            <div
              style={{ borderTop: "1px dashed #000", margin: "12px 0" }}
            ></div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <p
                style={{ fontSize: "12px", fontWeight: "600", margin: "6px 0" }}
              >
                Thank you for your business!
              </p>
              <p style={{ fontSize: "10px", margin: "4px 0", color: "#666" }}>
                {invoiceData.businessInfo.email}
              </p>
              <p style={{ fontSize: "10px", margin: "4px 0", color: "#666" }}>
                Tax ID: {invoiceData.businessInfo.taxId}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t py-3 grid grid-cols-2 sm:flex sm:flex-wrap justify-end gap-2">
          {user?.shopType === "restaurant" && (
            <>
              <button
                onClick={handleKOTDownload}
                disabled={!invoiceData || invoiceData.items.length === 0}
                className="px-3 py-1.5 text-xs font-medium text-orange-600 border border-orange-600 hover:bg-orange-50 rounded-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaDownload className="w-3 h-3" />
                <span className="inline">Download KOT</span>
              </button>
              <button
                onClick={handleKOTPrint}
                disabled={
                  !invoiceData || invoiceData.items.length === 0 || printing
                }
                className="px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaUtensils className="w-3 h-3" />
                <span className="inline">
                  {printing ? "Printing..." : "Print KOT"}
                </span>
              </button>
            </>
          )}

          {/* <button
            onClick={handleView}
            disabled={!invoiceData || invoiceData.items.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-teal-600 border border-teal-600 hover:bg-teal-50 rounded-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaEye className="w-3 h-3" />
            <span className="inline">View Invoice</span>
          </button> */}
          <button
            onClick={handleInvoiceDownload}
            disabled={!invoiceData || invoiceData.items.length === 0}
            className="px-3 py-1.5 text-xs font-medium text-brand-primary border border-brand-primary hover:bg-brand-primary/10 rounded-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaDownload className="w-3 h-3" />
            <span className="inline">Download Invoice</span>
          </button>
          <button
            onClick={handleInvoicePrint}
            disabled={
              !invoiceData || invoiceData.items.length === 0 || printing
            }
            className="px-3 py-1.5 text-xs font-medium text-white bg-brand-primary hover:bg-brand-hover rounded-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPrint className="w-3 h-3" />
            <span className="inline">
              {printing ? "Printing..." : "Print Invoice"}
            </span>
          </button>
          <button
            onClick={onClose}
            className="px-3 col-span-full bg-black/10 py-1.5 text-xs font-medium border text-gray-700 border-black/30 rounded-md"
          >
            Close
          </button>

          {error && (
            <p className="text-xs text-red-500 w-full mt-1 col-span-full text-center">
              {error}
            </p>
          )}
        </div>
      </div>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Invoice Preview"
        maxWidth="4xl"
      >
        <div className="flex justify-center bg-gray-100 p-4 rounded min-h-[50vh]">
          {previewImage ? (
            <img
              src={previewImage}
              alt="Invoice Preview"
              className="max-w-full h-auto shadow-lg border"
              style={{ maxHeight: "80vh" }}
            />
          ) : (
            <div className="flex items-center justify-center p-12">
              <Spinner color="#32cd32" size="40px" />
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              if (previewImage) {
                const link = document.createElement("a");
                link.href = previewImage;
                link.download = `Invoice-${invoiceData?.invoiceNumber || "preview"}.png`;
                link.click();
              }
            }}
            className="px-4 py-2 text-white bg-brand-primary hover:bg-brand-hover rounded transition-colors text-sm font-medium flex items-center gap-2"
          >
            <FaDownload /> Download Image
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Invoice;
