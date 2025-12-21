import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import POS from "../pages/sales/POS";
import Orders from "../pages/sales/Orders";
import ProductStatementPage from "../pages/sales/ProductStatementPage";
import StaffCommissionsPage from "../pages/sales/StaffCommissionsPage";
import Products from "../pages/inventory/Products";
import Suppliers from "../pages/inventory/Suppliers";
import Reports from "../pages/Reports";
// import Settings from "../pages/Settings";
import Register from "../pages/Register";
// import Purchase from "../pages/Purchase";
import Layout from "@/components/Layout";
// import Customers from "@/pages/Customers";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import Categories from "../pages/inventory/Categories";
import Brands from "../pages/inventory/Brands";
import Units from "../pages/inventory/Units";
import Sizes from "../pages/inventory/Sizes";
import Colors from "../pages/inventory/Colors";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Users from "@/pages/users/Users";
import NotFound from "@/pages/NotFound";
import AuthorizedRoute from "../components/AuthorizedRoute";
import SubscriptionPlans from "@/pages/admin/SubscriptionPlans";
import Coupons from "@/pages/admin/Coupons";
import UserSubscriptions from "@/pages/admin/UserSubscriptions";
import ChildUsers from "@/pages/users/ChildUsers";
import SubscriptionLimits from "@/pages/subscription/SubscriptionLimits";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ProfilePage from "@/pages/profile/ProfilePage";
import StaffProfilePage from "@/pages/profile/StaffProfilePage";
import OtherShops from "@/pages/OtherShops";
import Payroll from "@/pages/payroll/Payroll";
import BarcodeScannerTest from "@/pages/BarcodeScannerTest";
import LeaveHistory from "@/pages/payroll/LeaveHistory";
import PromotionHistory from "@/pages/payroll/PromotionHistory";
import PayrollMain from "@/pages/payroll/PayrollMain";
import ReleaseHistory from "@/pages/payroll/ReleaseHistory";
import HolidayHistory from "@/pages/payroll/HolidayHistory";
import AdvanceSalaryHistory from "@/pages/payroll/AdvanceSalaryHistory";
import money, { CurrencyPresets } from "@/utils/money";
import { useEffect } from "react";
import SalesReportPage from "@/pages/SalesReportPage";

const AppRoutes = () => {
  const { isLoadingProfile, user } = useAuth();
  useEffect(() => {
    money.configure({ ...CurrencyPresets.thailand });
  }, []);

  if (isLoadingProfile) {
    return (
      <div className="w-full flex justify-center items-center h-screen bg-white">
        <Spinner color="#32cd32" size="40px" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="/barcode-scanner-test" element={<BarcodeScannerTest />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          element={<AuthorizedRoute allowedRoles={["shop", "super admin"]} />}
        >
          <Route
            path="dashboard"
            element={
              user?.accountType === "super admin" ? (
                <AdminDashboard />
              ) : (
                <Dashboard />
              )
            }
          />
          <Route path="payroll" element={<Payroll />}>
            <Route index element={<PayrollMain />} />
            <Route path="leave-history" element={<LeaveHistory />} />
            <Route path="holiday-history" element={<HolidayHistory />} />
            <Route path="promotion-history" element={<PromotionHistory />} />
            <Route path="salary-history" element={<ReleaseHistory />} />
            <Route
              path="advance-salary-history"
              element={<AdvanceSalaryHistory />}
            />
          </Route>
        </Route>

        {/* Shop Only Routes */}
        <Route element={<AuthorizedRoute allowedRoles={["shop"]} />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="other-shops" element={<OtherShops />} />
          <Route path="sales">
            <Route path="pos" element={<POS />} />
            <Route path="orders" element={<Orders />} />
            <Route
              path="product-statement"
              element={<ProductStatementPage />}
            />
            <Route
              path="staff-commissions"
              element={<StaffCommissionsPage />}
            />
            <Route path="sales-report" element={<SalesReportPage />} />
          </Route>
          <Route path="inventory">
            <Route path="products" element={<Products />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="categories" element={<Categories />} />
            <Route path="brands" element={<Brands />} />
            <Route path="units" element={<Units />} />
            <Route path="sizes" element={<Sizes />} />
            <Route path="colors" element={<Colors />} />
          </Route>
          <Route path="reports" element={<Reports />} />
          {/* <Route path="settings" element={<Settings />} /> */}
          <Route path="settings" element={<SubscriptionLimits />} />
        </Route>

        {/* Admin Only Routes */}
        <Route
          element={<AuthorizedRoute allowedRoles={["super admin", "shop"]} />}
        >
          <Route path="subscriptions" element={<SubscriptionPlans />} />
          <Route path="users/child" element={<ChildUsers />} />
          <Route path="edit-shop" element={<ProfilePage />} />
          <Route path="staff-profile/:staffId" element={<StaffProfilePage />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<div />} />
            <Route path="salary-history" element={<ReleaseHistory />} />
            <Route path="advance-salary-history" element={<AdvanceSalaryHistory />} />
            <Route path="promotion-history" element={<PromotionHistory />} />
            <Route path="leave-history" element={<LeaveHistory />} />
            <Route path="orders" element={<Orders />} />
            <Route path="product-statement" element={<ProductStatementPage />} />
            <Route path="staff-commissions" element={<StaffCommissionsPage />} />
          </Route>
        </Route>

        {/* Super Admin Only Routes */}
        <Route element={<AuthorizedRoute allowedRoles={["super admin"]} />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/child" element={<ChildUsers />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="user-plans" element={<UserSubscriptions />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
