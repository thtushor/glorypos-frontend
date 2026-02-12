import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaSearch, FaEye, FaFilter, FaRegEdit } from "react-icons/fa";
import AXIOS from "@/api/network/Axios";
import { ORDERS_URL } from "@/api/api";
import Pagination from "@/components/Pagination";
import { toast } from "react-toastify";
import Modal from "@/components/Modal";
import Invoice from "@/components/Invoice";
// import { BiSpreadsheet } from "react-icons/bi";
import ProductStatement from "@/components/ProductStatement";
import Spinner from "@/components/Spinner";
import money from "@/utils/money";
import DashBoardProduct from "../DashBoardProduct";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";
import { useShopFilterOptions } from "@/hooks/useShopFilterOptions";

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: string;
  purchasePrice: string;
  subtotal: string;
  Product: {
    name: string;
    sku: string;
  };
  ProductVariant?: {
    sku: string;
    Color: {
      name: string;
    };
    Size: {
      name: string;
    };
  } | null;
}

interface Order {
  id: number;
  orderNumber: string;
  tableNumber?: string;
  specialNotes?: string;
  guestNumber?: number;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  orderDate: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  paymentMethod: "cash" | "card" | "mobile_banking";
  paymentStatus: "pending" | "completed" | "failed";
  orderStatus: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  UserId: number;
  commissions: any[];
  OrderItems: OrderItem[];
}

interface PaginationData {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface OrdersResponse {
  orders: Order[];
  pagination: PaginationData;
}

interface FilterParams {
  page: number;
  pageSize: number;
  searchKey?: string;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  shopId?: string;
}

const Orders: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [selectAllMatching, setSelectAllMatching] = useState(false);

  // Permission checks
  const canViewCostProfit = hasPermission(PERMISSIONS.SALES.VIEW_COST_PROFIT);
  const canEditOrder = hasPermission(PERMISSIONS.SALES.EDIT_ORDER);
  const canDeleteOrder = hasPermission(PERMISSIONS.SALES.DELETE_ORDER);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  // const getTodayDate = () => {
  //   const today = new Date();
  //   const year = today.getFullYear();
  //   const month = String(today.getMonth() + 1).padStart(2, '0');
  //   const day = String(today.getDate()).padStart(2, '0');
  //   return `${year}-${month}-${day}`;
  // };

  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    pageSize: 20,
    shopId: user?.id?.toString(),
    orderStatus: "",
    // orderStatus: user?.shopType === "restaurant" ? "processing" : "",
    // startDate: getTodayDate(),
    // endDate: getTodayDate()
  });

  const [isOpen, setIsOpen] = useState(false);
  const [adjustOrderModalOpen, setAdjustOrderModalOpen] = useState(false);

  const { shops, isLoading: isLoadingShops } = useShopFilterOptions();

  // Fetch Orders
  const {
    data: ordersData,
    isLoading,
    isFetching,
  } = useQuery<OrdersResponse>({
    queryKey: ["orders", filters],
    queryFn: async () => {
      try {
        const response = await AXIOS.get(ORDERS_URL, { params: filters });
        return response.data;
      } catch (error: any) {
        toast.error(error?.message || "Failed to fetch orders");
        return { orders: [], pagination: {} as PaginationData };
      }
    },
  });

  const queryClient = useQueryClient();

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await AXIOS.post(`${ORDERS_URL}/delete-many`, payload);
      return response;
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success((data as unknown as { message: string }).message);
        setSelectedOrderIds([]);
        setSelectAllMatching(false);
        // Refetch orders by invalidating the query
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else {
        toast.error((data as unknown as { message: string }).message || "Failed to delete orders");
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete orders");
    },
  });


  // Handle print invoice
  const handlePrintInvoice = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1, searchKey: searchQuery }));
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, page: 1, [name]: value }));
  };

  const handleSelectOrder = (orderId: number) => {
    setSelectAllMatching(false);
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = ordersData?.orders.map((o) => o.id) || [];
      setSelectedOrderIds(pageIds);
    } else {
      setSelectedOrderIds([]);
      setSelectAllMatching(false);
    }
  };

  const handleSelectAllMatching = () => {
    setSelectAllMatching(true);
    // Visual feedback handled by UI state
  };

  const handleDelete = () => {
    if (selectedOrderIds.length === 0 && !selectAllMatching) return;

    if (
      !confirm(
        selectAllMatching
          ? "Are you sure you want to delete ALL orders matching the current filters? This cannot be undone."
          : `Are you sure you want to delete ${selectedOrderIds.length} selected orders?`
      )
    ) {
      return;
    }

    const payload: any = {};
    if (selectAllMatching) {
      payload.all = true;
      payload.searchKey = searchQuery;
      payload.shopId = filters.shopId;
      payload.orderStatus = filters.orderStatus;
      payload.paymentStatus = filters.paymentStatus;
      payload.paymentMethod = filters.paymentMethod;
      payload.startDate = filters.startDate;
      payload.endDate = filters.endDate;
    } else {
      payload.ids = selectedOrderIds;
      payload.shopId = filters.shopId;
    }

    deleteMutation.mutate(payload);
  };

  // Helper function to calculate order totals
  const calculateOrderTotals = (order: Order) => {
    // Calculate total commission
    const totalCommission =
      order.commissions?.reduce((sum, commission) => {
        return sum + Number(commission.commissionAmount || 0);
      }, 0) || 0;

    // Calculate total cost (sum of purchasePrice * quantity for all items)
    const totalCost =
      order.OrderItems?.reduce((sum, item) => {
        return sum + Number(item.purchasePrice || 0) * item.quantity;
      }, 0) || 0;

    // Calculate total sales (order total)
    const totalSales = Number(order.total || 0);

    // Calculate profit/loss
    const profit = totalSales - totalCost;
    const isProfit = profit >= 0;
    const totalProfit = isProfit ? profit : 0;
    const totalLoss = isProfit ? 0 : Math.abs(profit);

    return {
      totalCommission,
      totalCost,
      totalSales,
      totalProfit,
      totalLoss,
      profit, // net profit (can be negative)
    };
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="flex gap-2 w-full md:w-auto items-center">
          {canDeleteOrder && (selectedOrderIds.length > 0 || selectAllMatching) && (
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Delete {selectAllMatching ? "All Matching" : `(${selectedOrderIds.length})`}
              {deleteMutation.isPending && "..."}
            </button>
          )}

          <form onSubmit={handleSearch} className="flex-1 md:w-80">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by order, customer name, phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <FaFilter className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow">
          {user?.shopType === "restaurant" && (
            <select
              value={filters.orderStatus || ""}
              onChange={(e) => handleFilterChange("orderStatus", e.target.value)}
              className="border rounded-lg p-2"
            >
              <option value="">All Order Status</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
          )}

          <select
            value={filters.paymentStatus || ""}
            onChange={(e) =>
              handleFilterChange("paymentStatus", e.target.value)
            }
            className="border rounded-lg p-2"
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filters.paymentMethod || ""}
            onChange={(e) =>
              handleFilterChange("paymentMethod", e.target.value)
            }
            className="border rounded-lg p-2"
          >
            <option value="">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile_banking">Mobile Banking</option>
          </select>

          {/* Shop Filter */}
          <select
            value={filters.shopId || ""}
            onChange={(e) =>
              handleFilterChange(
                "shopId",
                e.target.value
              )

            }
            disabled={isLoadingShops}
            className="border rounded-lg p-2"
          >
            <option value="">All Shops</option>
            {isLoadingShops ? (
              <option value="" disabled>
                Loading shops...
              </option>
            ) : (
              shops
                .filter((shop: any) => shop?.id != null)
                .map((shop: any) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.businessName || shop.fullName}
                  </option>
                ))
            )}
          </select>


          <div className="flex gap-2">
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="border rounded-lg p-2 w-1/2"
            />
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="border rounded-lg p-2 w-1/2"
            />
          </div>
        </div>
      )}

      {/* Select All Matching Message */}
      {selectedOrderIds.length > 0 && selectedOrderIds.length === ordersData?.orders.length && ordersData?.pagination.totalItems > ordersData?.orders.length && !selectAllMatching && (
        <div className="bg-blue-50 p-2 text-center text-blue-700 text-sm">
          All {selectedOrderIds.length} orders on this page are selected.
          <button
            onClick={handleSelectAllMatching}
            className="ml-2 font-bold underline hover:text-blue-900"
          >
            Select all {ordersData?.pagination.totalItems} orders matching current filters
          </button>
        </div>
      )}

      {selectAllMatching && (
        <div className="bg-blue-50 p-2 text-center text-blue-700 text-sm">
          All {ordersData?.pagination.totalItems} orders are selected.
          <button
            onClick={() => {
              setSelectAllMatching(false);
              setSelectedOrderIds([]);
            }}
            className="ml-2 font-bold underline hover:text-blue-900"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={
                      (ordersData?.orders?.length || 0) > 0 &&
                      selectedOrderIds.length === ordersData?.orders.length
                    }
                    onChange={handleSelectPage}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                {user?.shopType === "restaurant" &&
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Table No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Guest No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                  </>
                }
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Sales
                </th>
                {canViewCostProfit && (
                  <>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Profit/Loss
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={11} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center w-full">
                      <Spinner color="#32cd32" size="40px" />
                    </div>
                  </td>
                </tr>
              ) : ordersData?.orders?.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                ordersData?.orders.map((order: Order) => {
                  const totals = calculateOrderTotals(order);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectAllMatching || selectedOrderIds.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">
                          {order.orderNumber || "---"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-gray-900 text-sm">
                            {order.customerName || "Walk-in Customer"}
                          </span>
                          {order.customerPhone && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-blue-600">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                              </span>
                              <span className="text-xs text-gray-700 font-medium">
                                {order.customerPhone}
                              </span>
                            </div>
                          )}
                          {order.customerEmail && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-green-600">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                              </span>
                              <span className="text-xs text-gray-600 truncate max-w-[200px]" title={order.customerEmail || undefined}>
                                {order.customerEmail}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      {user?.shopType === "restaurant" &&
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order?.tableNumber || ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order?.guestNumber || ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order?.specialNotes || ""}
                          </td>
                        </>
                      }
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.orderDate
                          ? new Date(order.orderDate).toLocaleDateString()
                          : "---"}
                      </td>
                      {/* Seller Info */}
                      <td className="px-4 py-2 whitespace-nowrap">
                        {order.commissions?.[0]?.staff?.fullName ||
                          order.commissions?.[0]?.staff?.role ||
                          order?.commissions?.[0]?.staff?.parent?.businessName ? (
                          <div className="flex flex-col gap-0.5">
                            {order.commissions?.[0]?.staff?.fullName && (
                              <span className="text-sm font-medium text-gray-800">
                                {order.commissions?.[0]?.staff?.fullName}
                              </span>
                            )}
                            {order.commissions?.[0]?.staff?.role && (
                              <div>
                                <span className="text-xs text-gray-500 px-2 py-1 rounded-md bg-gray-100 inline-block">
                                  {order.commissions?.[0]?.staff?.role}
                                </span>
                              </div>
                            )}
                            {order?.commissions?.[0]?.staff?.parent
                              ?.businessName && (
                                <strong className="text-xs text-gray-500">
                                  shop:{" "}
                                  {order.commissions[0].staff.parent.businessName}
                                </strong>
                              )}
                          </div>
                        ) : (
                          <span className="text-gray-400">---</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.orderStatus ? (
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              order.orderStatus
                            )}`}
                          >
                            {order.orderStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400">---</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.paymentMethod ? (
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              order.paymentStatus
                            )}`}
                          >
                            {order.paymentMethod}
                          </span>
                        ) : (
                          <span className="text-gray-400">---</span>
                        )}
                      </td>
                      {/* Total Sales */}
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                        {totals.totalSales > 0
                          ? money.format(totals.totalSales)
                          : "---"}
                      </td>
                      {canViewCostProfit && (
                        <>
                          {/* Total Cost */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                            {totals.totalCost > 0
                              ? money.format(totals.totalCost)
                              : "---"}
                          </td>
                          {/* Total Commission */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {totals.totalCommission > 0 ? (
                              <span className="text-green-700 font-medium">
                                {money.format(totals.totalCommission)}
                              </span>
                            ) : (
                              <span className="text-gray-400">---</span>
                            )}
                          </td>
                          {/* Profit/Loss */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {totals.totalSales > 0 || totals.totalCost > 0 ? (
                              totals.profit >= 0 ? (
                                <span className="font-semibold text-green-600">
                                  {money.format(
                                    totals.totalProfit -
                                    Number(totals.totalCommission || 0)
                                  )}
                                </span>
                              ) : (
                                <span className="font-semibold text-red-600">
                                  -
                                  {money.format(
                                    totals.totalLoss +
                                    Number(totals.totalCommission || 0)
                                  )}
                                </span>
                              )
                            ) : (
                              <span className="text-gray-400">---</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowInvoice(true);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
                            title="View Order"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>

                          {canEditOrder && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setAdjustOrderModalOpen(true);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
                              title="Adjust Order"
                            >
                              <FaRegEdit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}

      <Pagination
        currentPage={filters.page}
        totalPages={ordersData?.pagination.totalPages || 1}
        totalItems={ordersData?.pagination.totalItems || 1}
        pageSize={filters.pageSize || 10}
        hasNextPage={ordersData?.pagination.hasNextPage || false}
        hasPreviousPage={ordersData?.pagination.hasPreviousPage || false}
        onPageChange={handlePageChange}
      />

      {/* Invoice Modal */}
      <Modal
        isOpen={showInvoice}
        onClose={() => {
          setShowInvoice(false);
          setSelectedOrder(null);
        }}
        title="Order Invoice"
        className="!max-w-[90vw] lg:!max-w-4xl"
      >
        {selectedOrder && (
          <Invoice
            orderId={selectedOrder?.id}
            onClose={() => {
              setShowInvoice(false);
              setSelectedOrder(null);
            }}
            onPrint={handlePrintInvoice}
          />
        )}
      </Modal>


      <Modal
        isOpen={adjustOrderModalOpen}
        onClose={() => {
          setAdjustOrderModalOpen(false);
        }}
        className="!max-w-[95vw]"
        titleContainerClassName="!mb-0"
      // useInnerModal={true}
      >
        <DashBoardProduct orderId={selectedOrder?.id} />
      </Modal>

      <ProductStatement
        isOpen={isOpen}
        startDate={filters?.startDate}
        endDate={filters?.endDate}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </div>
  );
};

export default Orders;
