// pages/payroll/PromotionHistory.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_PROMOTION_HISTORY } from "@/api/api";
import Spinner from "@/components/Spinner";
import { FaUser, FaCalendarAlt, FaDollarSign } from "react-icons/fa";

interface SalaryHistory {
  id: number;
  userId: number;
  salary: string;
  previousSalary: string | null;
  status: "initial" | "promotion" | "demotion";
  startDate: string; // DATEONLY → "YYYY-MM-DD"
  createdAt: string;
  notes?: string;
  UserRole: {
    id: number;
    fullName: string;
    email: string;
    role: string;
    baseSalary: string;
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

const PromotionHistory = () => {
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    status: "",
    userId: "",
    startDate: "",
    endDate: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["promotion-history", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, String(v));
      });
      const res = await AXIOS.get(`${PAYROLL_PROMOTION_HISTORY}?${params}`);
      console.log(res?.data);
      return res.data; // { history: [...], pagination: {...} }
    },
  });

  const history: SalaryHistory[] = data?.history || [];
  const pagination: Pagination | undefined = data?.pagination;

  const renderStatus = (status: string) => {
    const styles = {
      promotion: "bg-green-100 text-green-800",
      demotion: "bg-red-100 text-red-800",
      initial: "bg-blue-100 text-blue-800",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full capitalize ${
          styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"
        }`}
      >
        <FaDollarSign size={12} />
        {status}
      </span>
    );
  };

  return (
    <div className=" max-w-7xl mx-auto">
      {/* Filters */}
      <div className="bg-white pb-4 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, page: 1 })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary"
          >
            <option value="">All</option>
            <option value="promotion">Promotion</option>
            <option value="demotion">Demotion</option>
            <option value="initial">Initial</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee ID
          </label>
          <input
            type="number"
            placeholder="e.g. 10"
            value={filters.userId}
            onChange={(e) =>
              setFilters({ ...filters, userId: e.target.value, page: 1 })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value, page: 1 })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value, page: 1 })
            }
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* ────── Loading / Empty ────── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No salary change records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary Change
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorded
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-gray-400" size={14} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.UserRole.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.UserRole.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {item.previousSalary ? (
                        <span>
                          ৳{Number(item.previousSalary).toLocaleString()} →{" "}
                          <strong>
                            ৳{Number(item.salary).toLocaleString()}
                          </strong>
                        </span>
                      ) : (
                        <strong>৳{Number(item.salary).toLocaleString()}</strong>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt size={12} />
                        {format(new Date(item.startDate), "MMM dd, yyyy")}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {renderStatus(item.status)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {format(new Date(item.createdAt), "MMM dd, yyyy HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────── Pagination – identical to LeaveHistory ────── */}
      {pagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm">
          <p className="text-gray-600 mb-2 sm:mb-0">
            Showing {(filters.page - 1) * filters.pageSize + 1} to{" "}
            {Math.min(filters.page * filters.pageSize, pagination.totalCount)}{" "}
            of {pagination.totalCount} records
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 border rounded bg-brand-primary text-white">
              {filters.page}
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={!pagination.hasMore}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionHistory;
