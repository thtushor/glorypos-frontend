import { useAuth } from "@/context/AuthContext";
import { checkPermission, checkAnyPermission, checkAllPermissions } from "@/utils/permissionHelpers";

/**
 * Custom hook to check permissions for the current user
 * Main shop users (user.child is empty) have all permissions
 * Child users need specific permissions in user.child.permissions array
 */
export const usePermission = () => {
    const { user } = useAuth();

    return {
        /**
         * Check if user has a specific permission
         */
        hasPermission: (permission: string) => checkPermission(user, permission),

        /**
         * Check if user has any of the specified permissions
         */
        hasAnyPermission: (permissions: string[]) => checkAnyPermission(user, permissions),

        /**
         * Check if user has all of the specified permissions
         */
        hasAllPermissions: (permissions: string[]) => checkAllPermissions(user, permissions),

        /**
         * Check if user is a main shop user (has all permissions)
         */
        isMainShopUser: !user?.child?.id,

        /**
         * Check if user is a child user (permission-based access)
         */
        isChildUser: Boolean(user?.child?.id),
    };
};
