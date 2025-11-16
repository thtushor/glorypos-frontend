// src/pages/payroll/ReleaseHistory.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_RELEASE_HISTORY } from "@/api/api";
import Spinner from "@/components/Spinner";
import { FaUser, FaCalendarAlt, FaUserCheck } from "react-icons/fa";

interface Release {
  id: number;
  userId: number;
  month: string;
  releasedAmount: string;
  details: any; // JSON object
  releaseDate: string;
  UserRole: { id: number; fullName: string; email: string; role: string };
  releaser: { fullName: string };
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

const ReleaseHistory = () => {
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    userId: "",
    month: "",
    startDate: "",
    endDate: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["release-history", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, String(v));
      });
      const res = await AXIOS.get(`${PAYROLL_RELEASE_HISTORY}?${params}`);
      return res.data.data;
    },
  });

  const history: Release[] = data?.history || [];
  const pagination: Pagination | undefined = data?.pagination;

  const formatDetails = (details: any) => {
    if (!details) return "—";
    try {
      const entries = Object.entries(details);
      return entries
        .map(([k, v]) => `${k}: ৳${Number(v).toLocaleString()}`)
        .join(" | ");
    } catch {
      return "—";
    }
  };

  return (
    <div className=" max-w-7xl mx-auto">
      {/* Filters */}
      <div className="bg-white pb-4 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            Month
          </label>
          <input
            type="month"
            value={filters.month}
            onChange={(e) =>
              setFilters({ ...filters, month: e.target.value, page: 1 })
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

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No salary release records found.</p>
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
                    Month
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Released On
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Released By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
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
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt size={12} />
                        {format(new Date(item.month + "-01"), "MMM yyyy")}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                      ৳{Number(item.releasedAmount).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {format(new Date(item.releaseDate), "MMM dd, yyyy HH:mm")}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        <FaUserCheck size={12} className="text-green-600" />
                        {item.releaser.fullName}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {formatDetails(item.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm">
              <p className="text-gray-600 mb-2 sm:mb-0">
                Showing {(filters.page - 1) * filters.pageSize + 1} to{" "}
                {Math.min(
                  filters.page * filters.pageSize,
                  pagination.totalCount
                )}{" "}
                of {pagination.totalCount} records
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                  disabled={filters.page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 border rounded bg-brand-primary text-white">
                  {filters.page}
                </span>
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                  disabled={!pagination.hasMore}
                  className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReleaseHistory;
