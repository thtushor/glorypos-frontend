import { useQuery } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import Spinner from "@/components/Spinner";
import { format } from "date-fns";
import {
  //   FaChartLine,
  FaUsers,
  FaClock,
  FaDollarSign,
  FaPercent,
  FaCheckCircle,
  FaCalendarAlt,
} from "react-icons/fa";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SUBSCRIBE_DASHBOARD } from "@/api/api";

interface AnalyticsData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    pendingSubscriptions: number;
    totalEarnings: number;
    totalDiscount: number;
  };
  pendingSubscriptions: Subscription[];
  activeSubscriptions: Subscription[];
  revenueByPlan: {
    [key: string]: {
      totalAmount: number;
      subscriptions: number;
      discount: number;
    };
  };
}

interface Subscription {
  id: number;
  user: {
    id: number;
    fullName: string;
    email: string;
    businessName: string;
  };
  plan: string;
  amount: string;
  startDate: string;
  endDate: string;
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </div>
      <div className={`p-4 ${color} rounded-full`}>
        <Icon className="text-white text-xl" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateRange, setDateRange] = useState({
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
  });

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["subscriptionAnalytics", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
      });
      const response = await AXIOS.get(`${SUBSCRIBE_DASHBOARD}?${params}`);
      return response.data;
    },
  });

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    setSearchParams(newDateRange);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner color="#32cd32" size="40px" />
      </div>
    );
  }

  const analytics = data;
  if (!analytics) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with Date Filters */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Subscription Analytics</h1>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-300" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                placeholder="Start Date"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-300" />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                placeholder="End Date"
                min={dateRange.startDate}
              />
            </div>
            <button
              onClick={() => {
                setDateRange({ startDate: "", endDate: "" });
                setSearchParams({});
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Date Range Display */}
        <div className="mt-4 text-sm text-white/80">
          {analytics.dateRange && (
            <div className="flex items-center gap-2">
              <span>Showing data from:</span>
              <span className="font-medium">
                {format(
                  new Date(analytics.dateRange.startDate),
                  "MMM dd, yyyy"
                )}
              </span>
              <span>to</span>
              <span className="font-medium">
                {format(new Date(analytics.dateRange.endDate), "MMM dd, yyyy")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Subscriptions"
          value={analytics.summary.totalSubscriptions}
          icon={FaUsers}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Subscriptions"
          value={analytics.summary.activeSubscriptions}
          icon={FaCheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Subscriptions"
          value={analytics.summary.pendingSubscriptions}
          icon={FaClock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Total Earnings"
          value={`$${analytics.summary.totalEarnings}`}
          icon={FaDollarSign}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Discount"
          value={`$${analytics.summary.totalDiscount}`}
          icon={FaPercent}
          color="bg-red-500"
        />
      </div>

      {/* Revenue by Plan */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Revenue by Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(analytics.revenueByPlan).map(([plan, data]) => (
            <div
              key={plan}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <h3 className="font-semibold text-lg mb-2">{plan}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-medium">${data.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subscriptions</span>
                  <span className="font-medium">{data.subscriptions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium">${data.discount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Subscriptions Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Active Subscriptions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  End Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.activeSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{sub.user.businessName}</div>
                      <div className="text-sm text-gray-500">
                        {sub.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{sub.plan}</td>
                  <td className="px-6 py-4">${sub.amount}</td>
                  <td className="px-6 py-4">
                    {format(new Date(sub.startDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    {format(new Date(sub.endDate), "MMM dd, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
