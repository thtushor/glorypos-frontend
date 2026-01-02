import { PERMISSIONS } from "@/config/permissions";

/**
 * Check if user has permission
 * Main shop users (user.child is empty/null) have all permissions
 * Child users need to check their permissions array
 */
export const checkPermission = (
    user: any,
    requiredPermission: string
): boolean => {
    // Main shop user (no child) - has all access
    if (!user?.child?.id) {
        return true;
    }

    // Child user - check permissions array
    const userPermissions = user?.child?.permissions || [];

    // Ensure permissions is an array
    if (!Array.isArray(userPermissions)) {
        console.warn('User permissions is not an array:', userPermissions);
        return false;
    }

    return userPermissions.includes(requiredPermission);
};

/**
 * Check if user has any of the required permissions
 */
export const checkAnyPermission = (
    user: any,
    requiredPermissions: string[]
): boolean => {
    // Main shop user - has all access
    if (!user?.child?.id) {
        return true;
    }

    const userPermissions = user?.child?.permissions || [];

    // Ensure permissions is an array
    if (!Array.isArray(userPermissions)) {
        console.warn('User permissions is not an array:', userPermissions);
        return false;
    }

    return requiredPermissions.some((permission) =>
        userPermissions.includes(permission)
    );
};

/**
 * Check if user has all required permissions
 */
export const checkAllPermissions = (
    user: any,
    requiredPermissions: string[]
): boolean => {
    // Main shop user - has all access
    if (!user?.child?.id) {
        return true;
    }

    const userPermissions = user?.child?.permissions || [];

    // Ensure permissions is an array
    if (!Array.isArray(userPermissions)) {
        console.warn('User permissions is not an array:', userPermissions);
        return false;
    }

    return requiredPermissions.every((permission) =>
        userPermissions.includes(permission)
    );
};

/**
 * Get user permissions array
 * Returns all permissions for main shop users, actual permissions for child users
 */
export const getUserPermissions = (user: any): string[] => {
    if (!user?.child?.id) {
        // Return all permissions for main shop users
        return Object.values(PERMISSIONS).flatMap((module) =>
            Object.values(module)
        );
    }

    const permissions = user?.child?.permissions || [];

    // Ensure permissions is an array
    if (!Array.isArray(permissions)) {
        console.warn('User permissions is not an array:', permissions);
        return [];
    }

    return permissions;
};
