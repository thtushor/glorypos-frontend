// pages/payroll/HolidayHistory.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import AXIOS from "@/api/network/Axios";
import { PAYROLL_HOLIDAYS } from "@/api/api";
import Spinner from "@/components/Spinner";
import { FaCalendarAlt, FaUser } from "react-icons/fa";

interface Holiday {
  id: number;
  startDate: string;
  endDate: string;
  description: string;
  createdAt: string;
  creator: {
    id: number;
    fullName: string;
    email?: string;
  };
}

const HolidayHistory = () => {
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 15,
    year: new Date().getFullYear().toString(),
    startDate: "",
    endDate: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["holidays", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      const res = await AXIOS.get(`${PAYROLL_HOLIDAYS}?${params}`);
      return res.data; // আপনার API → data.data
    },
  });

  const holidays: Holiday[] = data?.holidays || [];
  const pagination = data?.pagination;

  const getDayCount = (start: string, end: string) => {
    const days = differenceInDays(new Date(end), new Date(start)) + 1;
    return days === 1 ? "1 day" : `${days} days`;
  };

  return (
    <div className=" max-w-7xl mx-auto">
      {/* Filters */}
      <div className="bg-white pb-4 rounded-lg shadow-sm gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) =>
                setFilters({ ...filters, year: e.target.value, page: 1 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
            >
              {[2030, 2029, 2028, 2027, 2026, 2025].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value, page: 1 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value, page: 1 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({ ...filters, startDate: "", endDate: "", page: 1 })
              }
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Empty State */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {!isLoading && holidays.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <FaCalendarAlt className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-xl text-gray-500">No holidays found</p>
          <p className="text-gray-400 mt-2">Try selecting a different year</p>
        </div>
      )}

      {/* Holidays Table */}
      {!isLoading && holidays.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Holiday Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Added On
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-gray-50 transition">
                    {/* 1. Holiday Period – এখানে Start & End Date দেখাবে */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        {getDayCount(holiday.startDate, holiday.endDate)} Days
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(holiday.startDate), "dd MMM")} –{" "}
                        {format(new Date(holiday.endDate), "dd MMM yyyy")}
                      </div>
                    </td>

                    {/* 2. Event Name */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-brand-primary">
                        {holiday.description}
                      </div>
                    </td>

                    {/* 3. Duration */}
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getDayCount(holiday.startDate, holiday.endDate)}
                      </span>
                    </td>

                    {/* 4. Added By */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FaUser className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {holiday.creator.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {holiday.creator.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 5. Added On */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(holiday.createdAt), "dd MMM yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-sm">
              <p className="text-gray-700 mb-3 sm:mb-0">
                Showing {holidays.length} of {pagination.totalCount} holidays
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                  disabled={filters.page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-white"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-brand-primary text-white rounded font-medium">
                  {filters.page}
                </span>
                <button
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                  disabled={!pagination.hasMore}
                  className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-white"
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

export default HolidayHistory;
