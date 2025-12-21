import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { checkPermission, checkAnyPermission } from "@/utils/permissionHelpers";

interface PermissionRouteProps {
    children: React.ReactNode;
    requiredPermission?: string;
    requiredAnyPermissions?: string[];
    redirectTo?: string;
}

/**
 * PermissionRoute component to protect routes based on permissions
 * Main shop users (user.child is empty) have all access
 * Child users need specific permissions
 */
const PermissionRoute: React.FC<PermissionRouteProps> = ({
    children,
    requiredPermission,
    requiredAnyPermissions,
    redirectTo = "/dashboard",
}) => {
    const { user } = useAuth();

    // Check single permission
    if (requiredPermission) {
        const hasAccess = checkPermission(user, requiredPermission);
        if (!hasAccess) {
            return <Navigate to={redirectTo} replace />;
        }
    }

    // Check any of multiple permissions
    if (requiredAnyPermissions && requiredAnyPermissions.length > 0) {
        const hasAccess = checkAnyPermission(user, requiredAnyPermissions);
        if (!hasAccess) {
            return <Navigate to={redirectTo} replace />;
        }
    }

    return <>{children}</>;
};

export default PermissionRoute;
