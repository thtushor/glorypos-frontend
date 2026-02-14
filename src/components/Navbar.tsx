import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { FaBars, FaBell, FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import AXIOS from "@/api/network/Axios";
import { useNavigate } from "react-router-dom";
import LogoSvg from "./icons/LogoSvg";
import { NOTIFICATIONS_UNREAD_COUNT_URL, NOTIFICATIONS_URL } from "@/api/api";
import Modal from "./Modal";
import Invoice from "./Invoice";
import { useSocket } from "@/context/SocketContext";
import { toast } from "react-toastify";


interface NavbarProps {
  toggleSidebar: () => void;
}

// interface StockAlert {
//   type: "variant";
//   productId: number;
//   variantId: number;
//   name: string;
//   sku: string;
//   currentStock: number;
//   alertQuantity: number;
//   status: "low_stock" | "out_of_stock";
//   message: string;
// }

// interface StockAlertResponse {
//   summary: {
//     totalAlerts: number;
//     outOfStock: number;
//     lowStock: number;
//   };
//   notifications: StockAlert[];
// }

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });

      if (data?.title) {
        toast.info(data.title, { position: "bottom-right", autoClose: 3000 });
      }
    };

    socket.on('new-notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [socket, queryClient]);

  // const hasAccessStaff = user?.child?.id ? true : false;

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // const [notifications] = useState([
  //   { id: 1, text: "New order received", time: "2 min ago" },
  //   { id: 2, text: "Product stock low", time: "1 hour ago" },
  //   { id: 3, text: "Daily report ready", time: "3 hours ago" },
  // ]);
  const [showNotifications, setShowNotifications] = useState(false);

  /* New Notifications Logic */
  const { data: unreadCountData } = useQuery({
    queryKey: ["notification-count"],
    refetchInterval: 30000,
    queryFn: async () => {
      const res: any = await AXIOS.get(NOTIFICATIONS_UNREAD_COUNT_URL);
      return res;
    }
  });

  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["notifications-preview"],
    refetchInterval: 30000,
    queryFn: async () => {
      const res: any = await AXIOS.get(NOTIFICATIONS_URL, {
        params: { is_read: false, limit: 5 }
      });
      return res;
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await AXIOS.patch(`${NOTIFICATIONS_URL}/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  const handleNotificationClick = (notif: any) => {
    // Mark as read immediately
    markAsReadMutation.mutate(notif.id);

    // Close dropdown
    setShowNotifications(false);

    // Open Invoice for order related notifications
    if (notif.reference_type === 'order' && notif.reference_id) {
      setSelectedOrderId(Number(notif.reference_id));
      return;
    }

    // Redirect to products for stock alerts
    if (notif.type === 'STOCK_LOW' || notif.type === 'STOCK_OUT' || notif.reference_type === 'product') {
      navigate("/inventory/products");
      return;
    }

    // Navigate
    if (notif.link) {
      navigate(notif.link);
    } else {
      navigate("/notifications");
    }
  };

  // Handle potential variations in response structure
  const unreadCount = (unreadCountData as any)?.count ?? (unreadCountData as any)?.data?.count ?? 0;
  const notifications = (notificationsData as any)?.notifications || (notificationsData as any)?.data?.notifications || [];

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
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[300px] sm:w-80 bg-white rounded-lg shadow-lg py-2 z-50 border max-h-[500px] flex flex-col">
                <div className="px-4 py-2 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => navigate("/notifications")}
                      className="text-xs text-brand-primary hover:underline"
                    >
                      View All
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto flex-1">
                  {isLoadingNotifications ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                      <FaBell className="text-gray-300 text-2xl mb-2" />
                      No unread notifications
                    </div>
                  ) : (
                    notifications.map((notif: any) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.type === "STOCK_OUT"
                              ? "bg-red-500"
                              : notif.type === "STOCK_LOW"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                              }`}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {/* We can use date-fns here if imported, or just basic JS date */}
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t px-4 py-2 text-center bg-gray-50">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate("/notifications");
                    }}
                    className="text-sm text-brand-primary hover:text-brand-hover font-medium"
                  >
                    View All Notifications
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
      {/* Invoice Modal */}
      <Modal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        title="View Invoice"
        className="lg:!max-w-[800px] !max-w-[95vw]"
      >
        {selectedOrderId && (
          <Invoice
            orderId={selectedOrderId}
            onClose={() => setSelectedOrderId(null)}
            onPrint={() => { }}
          />
        )}
      </Modal>
    </nav>
  );
};

export default Navbar;
