"use client";

import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import { IoMdPrint } from "react-icons/io";
import { useState } from "react";

const WIDTH = 32;

function twoColumn(left: string, right: string) {
  const space = Math.max(WIDTH - left.length - right.length, 1);
  return left + " ".repeat(space) + right + "\n";
}

function modifier(text: string) {
  return "  " + text + "\n";
}

export default function TEST_INVOICE_PRINT() {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPrinter = async () => {
    // Try previously authorized devices
    const devices = await (navigator as any).usb.getDevices();
    if (devices.length > 0) return devices[0];

    // First-time setup
    return await (navigator as any).usb.requestDevice({
      filters: [{ classCode: 7 }], // Printer class
    });
  };

  const printInvoice = async () => {
    setPrinting(true);
    setError(null);

    try {
      const device = await getPrinter();

      await device.open();
      if (!device.configuration) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);

      const encoder = new ReceiptPrinterEncoder();

      const receipt = encoder
        .initialize()

        // ===== HEADER =====
        .align("center")
        .bold(true)
        .text("FG RESTAURANT")
        .bold(false)
        .newline()
        .text("Fast • Fresh • Tasty")
        .newline()
        .text(new Date().toLocaleString())
        .newline()
        .newline()

        .bold(true)
        .text("RECEIPT")
        .bold(false)
        .newline()

        // ===== META =====
        .align("left")
        .line("Token     : #15")
        .line("Tracking  : #CF-98765")
        .line("Customer  : Walk-in")
        .line("Items     : 3")

        .text("────────────────────────────────\n")

        // ===== ITEMS =====
        .text(twoColumn("2 x Chicken Burger", "24.00"))
        .text(modifier("Extra Cheese +2.00"))
        .text(twoColumn("1 x French Fries", "10.00"))

        .text("────────────────────────────────\n")

        // ===== TOTAL =====
        .text(twoColumn("Subtotal", "34.00"))
        .text(twoColumn("Discount", "-4.00"))
        .text(twoColumn("Service Fee", "2.00"))
        .text(twoColumn("VAT (5%)", "1.60"))

        .text("────────────────────────────────\n")
        .bold(true)
        .text(twoColumn("TOTAL", "33.60"))
        .bold(false)

        // ===== FOOTER =====
        .newline()
        .align("center")
        .text("Thank you for ordering!")
        .newline()
        .text("sales@fgrestaurant.com")
        .newline()
        .text("All prices in TBH")
        .newline()
        .newline()

        .cut()
        .encode();

      // Endpoint 1 is common for ESC/POS printers
      await device.transferOut(1, receipt);

      await device.releaseInterface(0);
      await device.close();

      console.log("✅ Printed successfully");
    } catch (err: any) {
      console.error("❌ Print failed:", err);
      setError("Printer not connected or permission denied");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={printInvoice}
        disabled={printing}
        className="flex items-center gap-2 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        <IoMdPrint size={18} />
        {printing ? "Printing..." : "Print Invoice"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
