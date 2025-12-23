import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { checkPermission, checkAnyPermission } from "@/utils/permissionHelpers";
import { FaLock, FaHome, FaExclamationTriangle } from "react-icons/fa";

interface PermissionRouteProps {
    children: React.ReactNode;
    requiredPermission?: string;
    requiredAnyPermissions?: string[];
    redirectTo?: string;
    allowedRoles?: ("shop" | "super admin" | "admin")[];
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
    allowedRoles
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();


    if (!user || (allowedRoles && allowedRoles?.length > 0 && !allowedRoles.includes(user.accountType as any))) {
        return <Navigate to={"/404"} replace />;
    }

    // Check single permission
    if (requiredPermission) {
        const hasAccess = checkPermission(user, requiredPermission);
        if (!hasAccess) {
            return <AccessDenied redirectTo={redirectTo} navigate={navigate} />;
        }
    }

    // Check any of multiple permissions
    if (requiredAnyPermissions && requiredAnyPermissions.length > 0) {
        const hasAccess = checkAnyPermission(user, requiredAnyPermissions);
        if (!hasAccess) {
            return <AccessDenied redirectTo={redirectTo} navigate={navigate} />;
        }
    }

    return <>{children}</>;
};

// Access Denied Component
const AccessDenied: React.FC<{ redirectTo: string; navigate: any }> = ({ redirectTo, navigate }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                                <FaLock className="w-12 h-12 text-red-600" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                                <FaExclamationTriangle className="w-4 h-4 text-yellow-900" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Access Denied
                        </h1>
                        <p className="text-lg text-gray-600">
                            You don't have permission to access this page
                        </p>
                    </div>

                    {/* Message */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800 leading-relaxed">
                            This action requires special permissions. Please contact your shop owner or administrator to request access.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={() => navigate(redirectTo)}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition-colors font-medium shadow-md hover:shadow-lg"
                        >
                            <FaHome className="w-5 h-5" />
                            Go to Dashboard
                        </button>

                        <button
                            onClick={() => navigate(-1)}
                            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Go Back
                        </button>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            Need help? Contact your administrator for assistance.
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Error Code: <span className="font-mono font-semibold text-gray-800">403 - Forbidden</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PermissionRoute;
