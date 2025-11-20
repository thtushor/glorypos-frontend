// src/pages/payroll/ReleaseHistory.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_RELEASE_HISTORY } from "@/api/api";
import Spinner from "@/components/Spinner";
import { FaCalendarAlt, FaUserCheck } from "react-icons/fa";

interface Release {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  period: string;
  releasedAmount: number;
  releasedOn: string;
  releaserId: number;
  releaserFullname: string;
  details: string | object;
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
    periodStart: "",
    periodEnd: "",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["release-history", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      const res = await AXIOS.get(`${PAYROLL_RELEASE_HISTORY}?${params}`);
      return res.data;
    },
  });

  const history: Release[] = data?.history || [];
  const pagination: Pagination | undefined = data?.pagination;

  return (
    <div className=" max-w-7xl mx-auto">
      {/* Filters */}
      <div className="bg-white pb-4 rounded-lg shadow-sm gap-4 grid grid-cols-1 sm:grid-cols-3">
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
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Period Start
          </label>
          <input
            type="date"
            value={filters.periodStart}
            onChange={(e) =>
              setFilters({ ...filters, periodStart: e.target.value, page: 1 })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Period End
          </label>
          <input
            type="date"
            value={filters.periodEnd}
            onChange={(e) =>
              setFilters({ ...filters, periodEnd: e.target.value, page: 1 })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Loading / Error / Empty */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          Failed to load history
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-lg">
          No salary records found
        </div>
      ) : (
        /* Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Specify
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Released On
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Released By
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-emerald-50 transition duration-200"
                  >
                    {/* Employee */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            ID: {item.userId}
                          </div>
                          <div className="text-[14px] font-bold text-gray-800">
                            NAME: {item.fullName}
                          </div>
                          <div className="text-sm text-gray-600 text-nowrap flex items-center gap-1">
                            EMAIL: {item.email}
                          </div>
                          <div className="text-xs font-semibold text-emerald-600">
                            ROLE: {item.role}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Period */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2  text-nowrap text-sm font-medium">
                        <FaCalendarAlt className="text-emerald-600" />
                        {item.period}
                      </div>
                    </td>

                    {/* Details */}
                    <td className="px-6 py-5 text-sm  text-nowrap">
                      <span className="px-3 py-1 bg-emerald-100  text-nowrap text-emerald-800 rounded-full text-xs font-medium">
                        {typeof item.details === "string"
                          ? item.details
                          : "Custom Period"}
                      </span>
                    </td>

                    {/* Amount – Fixed locale (choose your currency) */}
                    <td className="px-6 py-5">
                      <div className="text-base  text-nowrap font-bold text-emerald-600 flex items-center gap-1">
                        {/* Thai Baht */}฿
                        {item.releasedAmount.toLocaleString("th-TH")}
                        {/* Indian Rupee → ₹{item.releasedAmount.toLocaleString("en-IN")} */}
                        {/* USD → ${item.releasedAmount.toLocaleString("en-US")} */}
                      </div>
                    </td>

                    {/* Released On */}
                    <td className="px-6 py-5 text-sm text-nowrap text-gray-700 font-medium">
                      {item.releasedOn}
                    </td>

                    {/* Released By */}
                    <td className="px-6 py-5">
                      <div className="flex items-center text-nowrap gap-2 text-[14px] font-semibold">
                        <FaUserCheck className="text-green-600" />
                        {item.releaserFullname}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-700">
                Showing {(filters.page - 1) * filters.pageSize + 1}–{" "}
                {Math.min(
                  filters.page * filters.pageSize,
                  pagination.totalCount
                )}{" "}
                of {pagination.totalCount} records
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={filters.page === 1}
                  className="px-5 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  Previous
                </button>

                <span className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold">
                  {filters.page}
                </span>

                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={!pagination.hasMore}
                  className="px-5 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
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
