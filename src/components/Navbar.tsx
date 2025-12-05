import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FaBars, FaBell, FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import AXIOS from "@/api/network/Axios";
import LogoSvg from "./icons/LogoSvg";

interface NavbarProps {
  toggleSidebar: () => void;
}

interface StockAlert {
  type: "variant";
  productId: number;
  variantId: number;
  name: string;
  sku: string;
  currentStock: number;
  alertQuantity: number;
  status: "low_stock" | "out_of_stock";
  message: string;
}

interface StockAlertResponse {
  summary: {
    totalAlerts: number;
    outOfStock: number;
    lowStock: number;
  };
  notifications: StockAlert[];
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // const [notifications] = useState([
  //   { id: 1, text: "New order received", time: "2 min ago" },
  //   { id: 2, text: "Product stock low", time: "1 hour ago" },
  //   { id: 3, text: "Daily report ready", time: "3 hours ago" },
  // ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: stockAlerts } = useQuery<StockAlertResponse>({
    queryKey: ["stock-alerts"],
    refetchInterval: 1000 * 30,
    queryFn: async () => {
      const response = await AXIOS.get("/notifications/stock-alerts");
      return response.data;
    },
  });

  return (
    <nav className="bg-white shadow-sm h-16 flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 md:hidden"
        >
          <FaBars className="h-5 w-5 text-gray-500" />
        </button>

        {/* console name */}

        <div className="flex items-center">
          {user?.accountType === "shop" && (
            <LogoSvg className={"!w-[60px] sm:!w-[80px]"} />
          )}
          <p className="text-[14px] whitespace-nowrap md:text-lg font-semibold">
            {user?.accountType === "shop" ? "Shop Console" : "Admin Console"}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        {user?.accountType === "shop" && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-gray-100 relative"
            >
              <FaBell className="h-5 w-5 text-gray-500" />
              {stockAlerts?.notifications &&
                stockAlerts?.notifications?.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && stockAlerts && (
              <div className="absolute right-0 mt-2 w-[250px] sm:w-80 bg-white rounded-lg shadow-lg py-2 z-50 border">
                <div className="px-4 py-2 border-b">
                  <h3 className="text-sm font-semibold">Stock Alerts</h3>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Out of Stock ({stockAlerts.summary.outOfStock})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      Low Stock ({stockAlerts.summary.lowStock})
                    </span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {stockAlerts.notifications.map((alert) => (
                    <div
                      key={`${alert.productId}-${alert.variantId}`}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                            alert.status === "out_of_stock"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {alert.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            SKU: {alert.sku}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                alert.status === "out_of_stock"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {alert.currentStock} in stock
                            </span>
                            <span className="text-xs text-gray-500">
                              Alert at: {alert.alertQuantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t px-4 py-2 text-center">
                  <button className="text-sm text-brand-primary hover:text-brand-hover">
                    View All Stock Alerts
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100"
          >
            <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <FaUser className="h-4 w-4 text-brand-primary" />
            </div>
            <span className="text-sm text-gray-700 hidden md:inline">
              {user?.child ? user?.child?.email : user?.email}
            </span>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border">
              <button className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <FaCog className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={logout}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
              >
                <FaSignOutAlt className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
