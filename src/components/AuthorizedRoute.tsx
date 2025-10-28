import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface AuthorizedRouteProps {
  allowedRoles: ("shop" | "super admin" | "admin")[];
}

const AuthorizedRoute: React.FC<AuthorizedRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.accountType as any)) {
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
};

export default AuthorizedRoute;
