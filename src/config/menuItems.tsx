import {
  FaHome,
  FaShoppingCart,
  FaBoxOpen,
  FaWarehouse,
  FaUsers,
  FaCog,
  FaFileInvoice,
  // FaTruck,
  FaTags,
  FaRuler,
  FaPalette,
  FaRulerHorizontal,
  FaCrown,
  FaTicketAlt,
  FaUser,
  FaStore,
  FaMoneyCheckAlt,
  FaChartLine,
  FaCalculator,
} from "react-icons/fa";
import { MdSubscriptions } from "react-icons/md";
import { RiProfileFill } from "react-icons/ri";
import { PERMISSIONS } from "./permissions";
import { MenuItem } from "@/types/menu";

export const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    icon: <FaHome className="w-5 h-5" />,
    permission: PERMISSIONS.DASHBOARD.VIEW,
  },
  {
    id: "sales",
    title: "Sales",
    path: "/sales",
    icon: <FaShoppingCart className="w-5 h-5" />,
    permission: PERMISSIONS.SALES.VIEW_POS,
    submenu: [
      {
        id: "pos",
        title: "POS",
        path: "/sales/pos",
        icon: <FaFileInvoice className="w-5 h-5" />,
        permission: PERMISSIONS.SALES.VIEW_POS,
      },
      {
        id: "orders",
        title: "Orders",
        path: "/sales/orders",
        icon: <FaBoxOpen className="w-5 h-5" />,
        permission: PERMISSIONS.SALES.VIEW_ORDERS,
      },
      {
        id: "statement",
        title: "Product Statement",
        path: "/sales/product-statement",
        icon: <FaChartLine className="w-5 h-5" />,
        permission: PERMISSIONS.SALES.VIEW_PRODUCT_STATEMENT,
      },
      {
        id: "staff-commissions",
        title: "Staff Commissions",
        path: "/sales/staff-commissions",
        icon: <FaChartLine className="w-5 h-5" />,
        permission: PERMISSIONS.SALES.VIEW_STAFF_COMMISSIONS,
      },
      {
        id: "sales-report",
        title: "Sales Report",
        path: "/sales/sales-report",
        icon: <FaCalculator className="w-5 h-5" />,
        permission: PERMISSIONS.SALES.VIEW_SALES_REPORT,
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    path: "/inventory",
    icon: <FaWarehouse className="w-5 h-5" />,
    permission: PERMISSIONS.INVENTORY.VIEW_PRODUCTS,
    submenu: [
      {
        id: "products",
        title: "Products",
        path: "/inventory/products",
        icon: <FaBoxOpen className="w-5 h-5" />,
        permission: PERMISSIONS.INVENTORY.VIEW_PRODUCTS,
      },
      {
        id: "categories",
        title: "Categories",
        path: "/inventory/categories",
        icon: <FaTags className="w-5 h-5" />,
        permission: PERMISSIONS.INVENTORY.VIEW_CATEGORIES,
      },
      // {
      //   id: "suppliers",
      //   title: "Suppliers",
      //   path: "/inventory/suppliers",
      //   icon: <FaTruck className="w-5 h-5" />,
      // },
      {
        id: "brands",
        title: "Brands",
        path: "/inventory/brands",
        icon: <FaTags className="w-5 h-5" />,
        permission: PERMISSIONS.INVENTORY.VIEW_BRANDS,
      },
      {
        id: "units",
        title: "Units",
        path: "/inventory/units",
        icon: <FaRuler className="w-5 h-5" />,
        permission: PERMISSIONS.INVENTORY.VIEW_UNITS,
      },
      {
        id: "sizes",
        title: "Sizes",
        path: "/inventory/sizes",
        icon: <FaRulerHorizontal className="w-5 h-5" />,
        permission: PERMISSIONS.INVENTORY.VIEW_SIZES,
      },
      {
        id: "colors",
        title: "Colors",
        path: "/inventory/colors",
        icon: <FaPalette className="w-5 h-5" />,
        permission: PERMISSIONS.INVENTORY.VIEW_COLORS,
      },
    ],
  },
  {
    id: "Shops",
    title: "Other Shops",
    path: "/other-shops",
    icon: <FaStore className="w-5 h-5" />,
    permission: PERMISSIONS.SHOPS.VIEW_OTHER_SHOPS,
  },

  {
    id: "subscriptions",
    title: "Subscriptions",
    path: "/subscriptions",
    icon: <FaCrown className="w-5 h-5" />,
    permission: PERMISSIONS.SUBSCRIPTIONS.VIEW_SUBSCRIPTIONS,
  },
  {
    id: "users-child",
    title: "Role",
    path: "/users/child",
    icon: <FaUser className="w-5 h-5" />,
    permission: PERMISSIONS.USERS.VIEW_CHILD_USERS,
  },
  {
    id: "payroll", // Added
    title: "Payroll",
    path: "/payroll",
    icon: <FaMoneyCheckAlt className="w-5 h-5" />,
    permission: PERMISSIONS.PAYROLL.VIEW_PAYROLL,
  },
  {
    id: "edit-shop",
    title: "Edit Shop",
    path: "/edit-shop",
    icon: <RiProfileFill className="w-5 h-5" />,
    permission: PERMISSIONS.SETTINGS.EDIT_SHOP_PROFILE,
  },
  {
    id: "staff-profile",
    title: "Staff Profile",
    path: "/staff-profile/:staffId",
    icon: <RiProfileFill className="w-5 h-5" />,
    permission: PERMISSIONS.STAFF_PROFILE.VIEW_OWN_PROFILE,
  },
  {
    id: "settings",
    title: "Settings",
    path: "/settings",
    icon: <FaCog className="w-5 h-5" />,
    permission: PERMISSIONS.SETTINGS.VIEW_SETTINGS,
  },
];

export const adminMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    icon: <FaHome className="w-5 h-5" />,
  },

  {
    id: "users",
    title: "Users",
    path: "/users",
    icon: <FaUsers className="w-5 h-5" />,
  },
  {
    id: "user-subscriptions",
    title: "Users Plans",
    path: "/user-plans",
    icon: <MdSubscriptions className="w-5 h-5" />,
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    path: "/subscriptions",
    icon: <FaCrown className="w-5 h-5" />,
  },
  {
    id: "users-child",
    title: "Role",
    path: "/users/child",
    icon: <FaUser className="w-5 h-5" />,
  },
  {
    id: "coupons",
    title: "Coupons",
    path: "/coupons",
    icon: <FaTicketAlt className="w-5 h-5" />,
  },
  {
    id: "payroll", // Added
    title: "Payroll",
    path: "/payroll",
    icon: <FaMoneyCheckAlt className="w-5 h-5" />,
  },

  // {
  //   id: "reports",
  //   title: "Reports",
  //   path: "/reports",
  //   icon: <FaChartBar className="w-5 h-5" />,
  // },
  // {
  //   id: "settings",
  //   title: "Settings",
  //   path: "/settings",
  //   icon: <FaCog className="w-5 h-5" />,
  // },
];
