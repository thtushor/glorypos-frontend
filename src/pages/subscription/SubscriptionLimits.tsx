import { useQuery } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import Spinner from "@/components/Spinner";
import { format } from "date-fns";
import {
  FaBox,
  FaUsers,
  FaHdd,
  FaCrown,
  FaCalendarAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { SUBSCRIBE_LIMIT } from "@/api/api";
import { useNavigate } from "react-router-dom";

interface SubscriptionData {
  subscription: {
    plan: string;
    status: string;
    expiryDate: string;
  };
  products: UsageMetric;
  users: UsageMetric;
  storage: StorageMetric;
}

interface UsageMetric {
  used: number;
  limit: number;
  remaining: number;
  percentageUsed: number;
}

interface StorageMetric extends UsageMetric {
  unit: string;
}

interface ProgressBarProps {
  percentage: number;
  color: string;
}

const ProgressBar = ({ percentage, color }: ProgressBarProps) => (
  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
    <div
      className={`h-full ${color} transition-all duration-500 ease-in-out`}
      style={{ width: `${Math.min(percentage, 100)}%` }}
    />
  </div>
);

const SubscriptionLimits = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["subscriptionLimits"],
    queryFn: async () => {
      const response = await AXIOS.get(SUBSCRIBE_LIMIT);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner color="#32cd32" size="40px" />
      </div>
    );
  }

  const subscriptionData = data;

  if (!subscriptionData) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Subscription Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 mb-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FaCrown className="text-4xl text-yellow-300" />
            <div>
              <h1 className="text-2xl font-bold">
                {subscriptionData.subscription.plan}
              </h1>
              <div className="flex items-center mt-2 space-x-2">
                <FaCheckCircle className="text-green-300" />
                <span className="capitalize">
                  {subscriptionData.subscription.status}
                </span>
                <span className="mx-2">•</span>
                <FaCalendarAlt className="text-gray-300" />
                <span>
                  Expires{" "}
                  {format(
                    new Date(subscriptionData.subscription.expiryDate),
                    "MMM dd, yyyy"
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Card */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaBox className="text-xl text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Products</h3>
            </div>
            <span className="text-sm text-gray-500">
              {subscriptionData.products.used} /{" "}
              {subscriptionData.products.limit}
            </span>
          </div>
          <ProgressBar
            percentage={subscriptionData.products.percentageUsed}
            color="bg-blue-500"
          />
          <p className="mt-3 text-sm text-gray-600">
            {subscriptionData.products.remaining} products remaining
          </p>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaUsers className="text-xl text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Users</h3>
            </div>
            <span className="text-sm text-gray-500">
              {subscriptionData.users.used} / {subscriptionData.users.limit}
            </span>
          </div>
          <ProgressBar
            percentage={subscriptionData.users.percentageUsed}
            color="bg-purple-500"
          />
          <p className="mt-3 text-sm text-gray-600">
            {subscriptionData.users.remaining} users remaining
          </p>
        </div>

        {/* Storage Card */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaHdd className="text-xl text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Storage</h3>
            </div>
            <span className="text-sm text-gray-500">
              {subscriptionData.storage.used} / {subscriptionData.storage.limit}{" "}
              {subscriptionData.storage.unit}
            </span>
          </div>
          <ProgressBar
            percentage={subscriptionData.storage.percentageUsed}
            color="bg-green-500"
          />
          <p className="mt-3 text-sm text-gray-600">
            {subscriptionData.storage.remaining} {subscriptionData.storage.unit}{" "}
            remaining
          </p>
        </div>
      </div>

      {/* Upgrade CTA */}
      {subscriptionData.users.percentageUsed >= 90 && (
        <div className="mt-8 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-800">
                Running out of resources?
              </h3>
              <p className="text-orange-700 mt-1">
                Upgrade your plan to get more users, storage, and products.
              </p>
            </div>
            <button
              onClick={() => {
                navigate("/subscriptions");
              }}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionLimits;
