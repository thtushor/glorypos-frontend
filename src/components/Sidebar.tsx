import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaChevronDown, FaStore } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";

import { adminMenuItems, menuItems } from "../config/menuItems";
import LogoSvg from "./icons/LogoSvg";
import { useAuth } from "@/context/AuthContext";
import FallbackAvatar from "./shared/FallbackAvatar";
import AXIOS from "@/api/network/Axios";
import { SUB_SHOPS_URL } from "@/api/api";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();

  const { user } = useAuth();

  // Fetch total shops count for shop users
  const { data: shopCountData } = useQuery({
    queryKey: ["sub-shops-count"],
    queryFn: async () => {
      const response = await AXIOS.get(SUB_SHOPS_URL, {
        params: { page: 1, pageSize: 1 },
      });
      return response.data;
    },
    enabled: user?.accountType === "shop",
  });

  const totalShops = shopCountData?.pagination?.totalItems || 0;

  // Close sidebar on mobile when navigating screen sizes.
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, setIsOpen]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen bg-white shadow-lg w-sidebar">
      <div
        className={`${
          isOpen ? "h-auto" : "h-20"
        } flex flex-col items-center justify-center border-b border-gray-200/80 px-4 py-4 transition-all duration-300`}
      >
        {user?.accountType === "shop" ? (
          <div className="w-full flex flex-col items-center space-y-3">
            <div className="relative group">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300">
                <FallbackAvatar
                  src={user.image || null}
                  alt={user.businessName || "Shop Logo"}
                  className="w-full h-full"
                />
              </div>
            </div>
            <div className="w-full text-center space-y-2">
              {isOpen ? (
                <>
                  <h3 className="text-base font-bold text-gray-900 truncate px-2">
                    {user.businessName || "Shop Name"}
                  </h3>
                  {totalShops > 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-700 bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 rounded-lg px-4 py-2 border border-brand-primary/20">
                      <FaStore className="w-4 h-4 text-brand-primary" />
                      <span className="font-bold text-brand-primary">
                        {totalShops}
                      </span>
                      <span className="text-gray-600">
                        {totalShops === 1 ? "Sub Shop" : "Sub Shops"}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <FaStore className="w-4 h-4 text-brand-primary" />
                  </div>
                  {totalShops > 0 && (
                    <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 rounded-full w-6 h-6 flex items-center justify-center">
                      {totalShops}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hover:scale-105 transition-transform duration-300">
            <LogoSvg className="h-[80px] w-auto" />
          </div>
        )}
      </div>

      <nav className="mt-4 h-[calc(100vh-4rem)] overflow-y-auto">
        {(user?.accountType === "shop" ? menuItems : adminMenuItems).map(
          (item: {
            id: string;
            title: string;
            path: string;
            icon: JSX.Element;
            submenu?: Array<{
              id: string;
              title: string;
              path: string;
              icon: JSX.Element;
            }>;
          }) => (
            <div key={item.id}>
              {item.submenu ? (
                // Menu with submenu
                <div>
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200 ${
                      isMenuActive(item.path)
                        ? "text-brand-primary"
                        : "text-gray-700 hover:text-brand-primary hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-500">{item.icon}</span>
                      {isOpen && <span>{item.title}</span>}
                    </div>
                    {isOpen && (
                      <span
                        className={`transform transition-transform duration-200 text-gray-500 ${
                          expandedMenus.includes(item.id) ? "rotate-180" : ""
                        }`}
                      >
                        <FaChevronDown className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                  {/* Submenu with animation */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen && expandedMenus.includes(item.id)
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pl-4 py-2 space-y-1">
                      {item.submenu.map((subItem) => (
                        <NavLink
                          key={subItem.id}
                          to={subItem.path}
                          className={({ isActive }) =>
                            `flex items-center space-x-4 px-4 py-2 text-sm rounded-md transition-colors duration-200 ${
                              isActive
                                ? "text-brand-primary bg-brand-primary/10"
                                : "text-gray-700 hover:text-brand-primary hover:bg-gray-50"
                            }`
                          }
                        >
                          <span className="text-gray-500">{subItem.icon}</span>
                          <span>{subItem.title}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Single menu item
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-4 px-4 py-2 text-sm transition-colors duration-200 ${
                      isActive
                        ? "text-brand-primary bg-brand-primary/10"
                        : "text-gray-700 hover:text-brand-primary hover:bg-gray-50"
                    }`
                  }
                >
                  <span className="text-gray-500">{item.icon}</span>
                  {isOpen && <span>{item.title}</span>}
                </NavLink>
              )}
            </div>
          )
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
