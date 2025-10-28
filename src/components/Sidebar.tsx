import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";

import { adminMenuItems, menuItems } from "../config/menuItems";
import LogoSvg from "./icons/LogoSvg";
import { useAuth } from "@/context/AuthContext";
import FallbackAvatar from "./shared/FallbackAvatar";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();

  const { user } = useAuth();

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
      <div className="h-20 flex items-center justify-center border-b border-gray-200/80 px-4">
        {user?.accountType === "shop" ? (
          <div className="relative group">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300">
              <FallbackAvatar
                src={user.image || null}
                alt={user.businessName || "Shop Logo"}
                className="w-full h-full"
              />
            </div>

            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-800 text-white text-xs py-1 px-2 rounded-md pointer-events-none">
              {user.businessName}
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
