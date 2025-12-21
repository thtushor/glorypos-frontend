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

export const menuItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    icon: <FaHome className="w-5 h-5" />,
  },
  {
    id: "sales",
    title: "Sales",
    path: "/sales",
    icon: <FaShoppingCart className="w-5 h-5" />,
    submenu: [
      {
        id: "pos",
        title: "POS",
        path: "/sales/pos",
        icon: <FaFileInvoice className="w-5 h-5" />,
      },
      {
        id: "orders",
        title: "Orders",
        path: "/sales/orders",
        icon: <FaBoxOpen className="w-5 h-5" />,
      },
      {
        id: "statement",
        title: "Product Statement",
        path: "/sales/product-statement",
        icon: <FaChartLine className="w-5 h-5" />,
      },
      {
        id: "staff-commissions",
        title: "Staff Commissions",
        path: "/sales/staff-commissions",
        icon: <FaChartLine className="w-5 h-5" />,
      },
      {
        id: "sales-report",
        title: "Sales Report",
        path: "/sales/sales-report",
        icon: <FaCalculator className="w-5 h-5" />,
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    path: "/inventory",
    icon: <FaWarehouse className="w-5 h-5" />,
    submenu: [
      {
        id: "products",
        title: "Products",
        path: "/inventory/products",
        icon: <FaBoxOpen className="w-5 h-5" />,
      },
      {
        id: "categories",
        title: "Categories",
        path: "/inventory/categories",
        icon: <FaTags className="w-5 h-5" />,
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
      },
      {
        id: "units",
        title: "Units",
        path: "/inventory/units",
        icon: <FaRuler className="w-5 h-5" />,
      },
      {
        id: "sizes",
        title: "Sizes",
        path: "/inventory/sizes",
        icon: <FaRulerHorizontal className="w-5 h-5" />,
      },
      {
        id: "colors",
        title: "Colors",
        path: "/inventory/colors",
        icon: <FaPalette className="w-5 h-5" />,
      },
    ],
  },
  {
    id: "Shops",
    title: "Other Shops",
    path: "/other-shops",
    icon: <FaStore className="w-5 h-5" />,
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
    id: "payroll", // Added
    title: "Payroll",
    path: "/payroll",
    icon: <FaMoneyCheckAlt className="w-5 h-5" />,
  },
  {
    id: "edit-shop",
    title: "Edit Shop",
    path: "/edit-shop",
    icon: <RiProfileFill className="w-5 h-5" />,
  },
  {
    id: "staff-profile",
    title: "Staff Profile",
    path: "/staff-profile",
    icon: <RiProfileFill className="w-5 h-5" />,
  },
  {
    id: "settings",
    title: "Settings",
    path: "/settings",
    icon: <FaCog className="w-5 h-5" />,
  },
];

export const adminMenuItems = [
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
