import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { FaPrint } from "react-icons/fa";
import Modal from "./Modal";
import AXIOS from "@/api/network/Axios";
import { useReactToPrint } from "react-to-print";
// import LogoSvg from "./icons/LogoSvg";
import Spinner from "./Spinner";

import LogoSvg from "./icons/LogoSvg";
import money from "@/utils/money";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

interface StatementItem {
  id: number;
  quantity: number;
  unitPrice: string;
  purchasePrice: string;
  subtotal: string;
  tax: string;
  ProductId: number;
  ProductVariantId: number | null;
  Product: {
    id: number;
    name: string;
    sku: string;
    productImage?: string;
    UserId: number;
    User?: {
      id: number;
      businessName: string;
      fullName: string;
    };
  };
  ProductVariant?: {
    sku: string;
    imageUrl?: string;
    Color: {
      name: string;
    };
    Size: {
      name: string;
    };
  } | null;
  Order: {
    id: number;
    orderNumber: string;
    orderDate: string;
    customerName: string;
    total: string;
    subtotal: string;
    tax: string;
    paymentMethod: string;
    paymentStatus: string;
    UserId: number;
    User?: {
      id: number;
      businessName: string;
      fullName: string;
    };
    commissions?: Array<{
      id: number;
      commissionAmount: string;
      commissionPercentage: string;
      staff?: {
        id: number;
        fullName: string;
        email: string;
        role: string;
        parent?: {
          id: number;
          businessName: string;
          fullName: string;
        };
      };
    }>;
  };
}

interface SummaryData {
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalLoss: number;
  profitMargin: number;
  netProfit: number;
}

interface StatementResponse {
  statements: StatementItem[];
  summary: SummaryData;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ProductStatementProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: number;
  productVariantId?: number;
  startDate?: string;
  endDate?: string;
  productUserId?: number;
  userRoleId?: number;
  orderStartDate?: string;
  orderEndDate?: string;
  searchKey?: string;
}

const ProductStatement: React.FC<ProductStatementProps> = ({
  isOpen,
  onClose,
  productId,
  productVariantId,
  startDate,
  endDate,
  productUserId,
  userRoleId,
  orderStartDate,
  orderEndDate,
  searchKey,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { hasPermission } = usePermission();
  const canViewCostAndProfit = hasPermission(PERMISSIONS.SALES.VIEW_COST_PROFIT);

  // Build query parameters using useMemo (similar to POS.tsx)
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};

    if (productId) params.productId = productId;
    if (productVariantId) params.productVariantId = productVariantId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (productUserId) params.productUserId = productUserId;
    if (userRoleId) params.userRoleId = userRoleId;
    if (orderStartDate) params.orderStartDate = orderStartDate;
    if (orderEndDate) params.orderEndDate = orderEndDate;
    if (searchKey) params.searchKey = searchKey;

    return params;
  }, [
    productId,
    productVariantId,
    startDate,
    endDate,
    productUserId,
    userRoleId,
    orderStartDate,
    orderEndDate,
    searchKey,
  ]);

  // Fetch statement data
  const { data: statementData, isLoading } = useQuery<StatementResponse>({
    queryKey: ["product-statement", queryParams],
    queryFn: async () => {
      const response = await AXIOS.get("/statement/products", {
        params: queryParams,
      });
      return response.data;
    },
    enabled: isOpen,
  });

  // Extract statements array from response
  const statements = statementData?.statements || [];

  // Calculate totals for table footer
  const totals = statements?.reduce(
    (acc: any, item: StatementItem) => {
      acc.quantity += item.quantity;
      acc.sales += Number(item.subtotal);
      acc.cost += Number(item.purchasePrice) * item.quantity;
      return acc;
    },
    { quantity: 0, sales: 0, cost: 0 }
  );

  // Use API summary data
  const apiSummary = statementData?.summary;

  // Calculate tax from statements if needed (since it's not in summary)
  const calculatedTax =
    statements?.reduce((acc: number, item: StatementItem) => {
      const orderTax = Number(item?.Order?.tax) || 0;
      const orderSubtotal = Number(item?.Order?.subtotal) || 1;
      const itemSubtotal = Number(item?.subtotal) || 0;
      const tax = Number(
        (orderTax * (itemSubtotal / orderSubtotal) || 0).toFixed(2)
      );
      return acc + tax;
    }, 0) || 0;

  const summary = apiSummary
    ? {
      totalSales: apiSummary.totalRevenue,
      totalProfit: apiSummary.totalProfit,
      totalLoss: apiSummary.totalLoss,
      totalTax: calculatedTax,
    }
    : {
      totalSales: 0,
      totalProfit: 0,
      totalLoss: 0,
      totalTax: 0,
    };

  // Helper function to determine if order is Self or Shop
  const getSaleType = (
    item: StatementItem
  ): { type: "Self" | "Shop"; name: string } => {
    if (item.Order.UserId === item.Product.UserId) {
      return {
        type: "Self",
        name: `${item.Order?.User?.businessName ||
          item.Order?.User?.fullName ||
          "Unknown Shop"
          }`,
      };
    }
    return {
      type: "Shop",
      name: `${item.Order?.User?.businessName ||
        item.Order?.User?.fullName ||
        "Unknown Shop"
        }`,
    };
  };

  // Handle print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  }) as () => void;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Statement"
      className="!max-w-[90vw] lg:!max-w-[80vw]"
    >
      <div className="space-y-6">
        {/* Print Button */}
        <div className="flex justify-end print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-white bg-brand-primary rounded-lg hover:bg-brand-hover"
          >
            <FaPrint className="w-4 h-4" />
            Print Statement
          </button>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="p-6 bg-white">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Spinner color="#32cd32" size="24px" />
            </div>
          ) : (
            <div className="print:!p-0">
              {/* Header */}
              <div className="text-center mb-6">
                <LogoSvg className="h-[90px] mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Product Statement</h2>
                {startDate && endDate && (
                  <p className="text-gray-600 text-sm">
                    {new Date(startDate).toLocaleDateString()} -{" "}
                    {new Date(endDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Summary Cards */}
              <div className={`grid ${canViewCostAndProfit ? 'grid-cols-4' : 'grid-cols-2'} gap-4 mb-6 print:gap-8`}>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-700">
                    Total Sales
                  </h3>
                  <p className="text-2xl print:!text-base font-bold text-blue-800">
                    {money.format(summary?.totalSales || 0)}
                  </p>
                </div>
                {canViewCostAndProfit && (
                  <>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-700">
                        Total Profit
                      </h3>
                      <p className="text-2xl print:!text-base font-bold text-green-800">
                        {money.format(summary?.totalProfit || 0)}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-red-700">
                        Total Loss
                      </h3>
                      <p className="text-2xl print:!text-base font-bold text-red-800">
                        {money.format(summary?.totalLoss || 0)}
                      </p>
                    </div>
                  </>
                )}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-700">
                    Total Tax
                  </h3>
                  <p className="text-2xl print:!text-base font-bold text-purple-800">
                    {money.format(summary?.totalTax || 0)}
                  </p>
                </div>
              </div>

              {/* Statement Table */}
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-xs print:text-[8pt]">
                  <thead>
                    <tr className="bg-gray-50 print:bg-gray-100">
                      <th className="px-2 py-1.5 text-left print:px-1">Date</th>
                      <th className="px-2 py-1.5 text-left print:px-1">
                        Order #
                      </th>
                      <th className="px-2 py-1.5 text-left print:px-1 print:w-1/4">
                        Product
                      </th>
                      <th className="px-2 py-1.5 text-left print:px-1">
                        Sold By
                      </th>
                      <th className="px-2 py-1.5 text-left print:px-1">
                        Commission
                      </th>
                      <th className="px-2 py-1.5 text-right print:px-1">Qty</th>
                      {canViewCostAndProfit && (
                        <th className="px-2 py-1.5 text-right print:px-1">
                          Cost Price
                        </th>
                      )}
                      <th className="px-2 py-1.5 text-right print:px-1">
                        Unit Price
                      </th>
                      <th className="px-2 py-1.5 text-right print:px-1">
                        Sales Price
                      </th>
                      {canViewCostAndProfit && (
                        <th className="px-2 py-1.5 text-right print:px-1">
                          Profit
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {!statements || statements.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-2 py-6 text-center text-gray-500"
                        >
                          No statement data available
                        </td>
                      </tr>
                    ) : (
                      statements.map((item: StatementItem) => {
                        const cost = Number(item.purchasePrice) * item.quantity;
                        const sales = Number(item.subtotal);
                        const profit = sales - cost;
                        const saleType = getSaleType(item);
                        const commissions = item.Order.commissions || [];

                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              {new Date(
                                item.Order.orderDate
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-2 py-1.5 whitespace-nowrap">
                              {item.Order.orderNumber}
                            </td>
                            <td className="px-2 py-1.5">
                              <div>
                                <span className="font-medium">
                                  {item.Product.name}
                                  {item.ProductVariant && (
                                    <span className="text-gray-500">
                                      {" "}
                                      - {item.ProductVariant.Color.name},{" "}
                                      {item.ProductVariant.Size.name}
                                    </span>
                                  )}
                                </span>
                                <br />
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <span className="text-gray-500 text-[10px] print:text-[7pt]">
                                    SKU:{" "}
                                    {item.ProductVariant?.sku ||
                                      item.Product.sku}
                                  </span>
                                  {item.Product?.User && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] print:text-[6pt] font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                      {item.Product?.User?.businessName ||
                                        item.Product?.User?.fullName ||
                                        "Unknown Owner"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-1.5">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] print:text-[7pt] font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-200">
                                {saleType.name}
                              </span>
                            </td>
                            <td className="px-2 py-1.5">
                              {commissions.length > 0 ? (
                                <div className="space-y-0.5">
                                  {commissions.map((commission) => (
                                    <div
                                      key={commission.id}
                                      className="text-[10px] print:text-[7pt]"
                                    >
                                      <div className="font-medium text-gray-900">
                                        <span>
                                          <strong>Staff: </strong>
                                          {commission.staff?.fullName || "N/A"}
                                        </span>
                                      </div>
                                      <div className="font-medium text-gray-900">
                                        <span>
                                          <strong>Shop: </strong>
                                          {commission.staff?.parent
                                            ?.businessName ||
                                            commission.staff?.parent
                                              ?.fullName ||
                                            "N/A"}
                                        </span>
                                      </div>
                                      <div className="text-gray-500">
                                        {money.format(
                                          Number(commission.commissionAmount)
                                        )}{" "}
                                        ({commission.commissionPercentage}%)
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-[10px] print:text-[7pt]">
                                  No commission
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              {item.quantity}
                            </td>
                            {canViewCostAndProfit && (
                              <td className="px-2 py-1.5 text-right whitespace-nowrap">
                                {money.format(cost)}
                              </td>
                            )}
                            <td className="px-2 py-1.5 text-right whitespace-nowrap">
                              {money.format(Number(item.unitPrice))}
                            </td>
                            <td className="px-2 py-1.5 text-right whitespace-nowrap">
                              {money.format(sales)}
                            </td>
                            {canViewCostAndProfit && (
                              <td className="px-2 py-1.5 text-right whitespace-nowrap">
                                <span
                                  className={
                                    profit >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {money.format(profit)}
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200 font-semibold print:border-t">
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-right">
                        Totals:
                      </td>
                      <td className="pl-4 pr-2 py-2 text-right">
                        {totals?.quantity || 0}
                      </td>
                      {canViewCostAndProfit && (
                        <td className="pl-4 pr-2 py-2 text-right">
                          {money.format(totals?.cost || 0)}
                        </td>
                      )}
                      <td className="px-4 py-2"></td>
                      <td className="pl-4 pr-2 py-2 text-right">
                        {money.format(totals?.sales || 0)}
                      </td>
                      {canViewCostAndProfit && (
                        <td className="pl-4 pr-2 py-2 text-right">
                          <span
                            className={
                              totals?.sales - totals?.cost >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {money.format(
                              (totals?.sales || 0) - (totals?.cost || 0)
                            )}
                          </span>
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProductStatement;
