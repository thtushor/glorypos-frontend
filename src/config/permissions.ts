// Permission keys organized by module
export const PERMISSIONS = {
    // Dashboard
    DASHBOARD: {
        VIEW: 'view_dashboard',
    },

    // Sales Module
    SALES: {
        VIEW_POS: 'view_pos',
        CREATE_ORDER: 'create_order',
        VIEW_ORDERS: 'view_orders',
        EDIT_ORDER: 'edit_order',
        DELETE_ORDER: 'delete_order',
        VIEW_PRODUCT_STATEMENT: 'view_product_statement',
        VIEW_STAFF_COMMISSIONS: 'view_staff_commissions',
        VIEW_SALES_REPORT: 'view_sales_report',
    },

    // Inventory Module
    INVENTORY: {
        VIEW_PRODUCTS: 'view_products',
        CREATE_PRODUCT: 'create_product',
        EDIT_PRODUCT: 'edit_product',
        DELETE_PRODUCT: 'delete_product',
        VIEW_CATEGORIES: 'view_categories',
        MANAGE_CATEGORIES: 'manage_categories',
        VIEW_BRANDS: 'view_brands',
        MANAGE_BRANDS: 'manage_brands',
        VIEW_UNITS: 'view_units',
        MANAGE_UNITS: 'manage_units',
        VIEW_SIZES: 'view_sizes',
        MANAGE_SIZES: 'manage_sizes',
        VIEW_COLORS: 'view_colors',
        MANAGE_COLORS: 'manage_colors',
    },

    // Shops Module
    SHOPS: {
        VIEW_OTHER_SHOPS: 'view_other_shops',
        MANAGE_SUB_SHOPS: 'manage_sub_shops',
    },

    // Subscriptions Module
    SUBSCRIPTIONS: {
        VIEW_SUBSCRIPTIONS: 'view_subscriptions',
        MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',
    },

    // Users/Roles Module
    USERS: {
        VIEW_CHILD_USERS: 'view_child_users',
        CREATE_CHILD_USER: 'create_child_user',
        EDIT_CHILD_USER: 'edit_child_user',
        DELETE_CHILD_USER: 'delete_child_user',
        MANAGE_PERMISSIONS: 'manage_permissions',
    },

    // Payroll Module
    PAYROLL: {
        VIEW_PAYROLL: 'view_payroll',
        RELEASE_SALARY: 'release_salary',
        VIEW_SALARY_HISTORY: 'view_salary_history',
        VIEW_ADVANCE_SALARY: 'view_advance_salary',
        APPROVE_ADVANCE_SALARY: 'approve_advance_salary',
        VIEW_PROMOTION_HISTORY: 'view_promotion_history',
        MANAGE_PROMOTION: 'manage_promotion',
        VIEW_LEAVE_HISTORY: 'view_leave_history',
        APPROVE_LEAVE: 'approve_leave',
    },

    // Settings Module
    SETTINGS: {
        VIEW_SETTINGS: 'view_settings',
        EDIT_SHOP_PROFILE: 'edit_shop_profile',
        MANAGE_SETTINGS: 'manage_settings',
    },

    // Staff Profile
    STAFF_PROFILE: {
        VIEW_OWN_PROFILE: 'view_own_profile',
        VIEW_OTHER_PROFILES: 'view_other_profiles',
        EDIT_PROFILE: 'edit_profile',
    },
} as const;

// Permission groups for easier management
export const PERMISSION_GROUPS = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        description: 'Access to dashboard and analytics',
        permissions: [
            { key: PERMISSIONS.DASHBOARD.VIEW, label: 'View Dashboard', description: 'View dashboard page and statistics' },
        ],
    },
    {
        id: 'sales',
        name: 'Sales',
        description: 'Point of Sale and order management',
        permissions: [
            { key: PERMISSIONS.SALES.VIEW_POS, label: 'View POS', description: 'Access POS interface' },
            { key: PERMISSIONS.SALES.CREATE_ORDER, label: 'Create Order', description: 'Create new sales orders' },
            { key: PERMISSIONS.SALES.VIEW_ORDERS, label: 'View Orders', description: 'View all orders' },
            { key: PERMISSIONS.SALES.EDIT_ORDER, label: 'Edit Order', description: 'Modify existing orders' },
            { key: PERMISSIONS.SALES.DELETE_ORDER, label: 'Delete Order', description: 'Delete orders' },
            { key: PERMISSIONS.SALES.VIEW_PRODUCT_STATEMENT, label: 'View Product Statement', description: 'View product sales statements' },
            { key: PERMISSIONS.SALES.VIEW_STAFF_COMMISSIONS, label: 'View Staff Commissions', description: 'View commission reports' },
            { key: PERMISSIONS.SALES.VIEW_SALES_REPORT, label: 'View Sales Report', description: 'Access sales reports' },
        ],
    },
    {
        id: 'inventory',
        name: 'Inventory',
        description: 'Product and inventory management',
        permissions: [
            { key: PERMISSIONS.INVENTORY.VIEW_PRODUCTS, label: 'View Products', description: 'View product list' },
            { key: PERMISSIONS.INVENTORY.CREATE_PRODUCT, label: 'Create Product', description: 'Add new products' },
            { key: PERMISSIONS.INVENTORY.EDIT_PRODUCT, label: 'Edit Product', description: 'Modify product details' },
            { key: PERMISSIONS.INVENTORY.DELETE_PRODUCT, label: 'Delete Product', description: 'Remove products' },
            { key: PERMISSIONS.INVENTORY.VIEW_CATEGORIES, label: 'View Categories', description: 'View product categories' },
            { key: PERMISSIONS.INVENTORY.MANAGE_CATEGORIES, label: 'Manage Categories', description: 'Create/edit/delete categories' },
            { key: PERMISSIONS.INVENTORY.VIEW_BRANDS, label: 'View Brands', description: 'View brands' },
            { key: PERMISSIONS.INVENTORY.MANAGE_BRANDS, label: 'Manage Brands', description: 'Create/edit/delete brands' },
            { key: PERMISSIONS.INVENTORY.VIEW_UNITS, label: 'View Units', description: 'View measurement units' },
            { key: PERMISSIONS.INVENTORY.MANAGE_UNITS, label: 'Manage Units', description: 'Create/edit/delete units' },
            { key: PERMISSIONS.INVENTORY.VIEW_SIZES, label: 'View Sizes', description: 'View product sizes' },
            { key: PERMISSIONS.INVENTORY.MANAGE_SIZES, label: 'Manage Sizes', description: 'Create/edit/delete sizes' },
            { key: PERMISSIONS.INVENTORY.VIEW_COLORS, label: 'View Colors', description: 'View product colors' },
            { key: PERMISSIONS.INVENTORY.MANAGE_COLORS, label: 'Manage Colors', description: 'Create/edit/delete colors' },
        ],
    },
    {
        id: 'shops',
        name: 'Shops',
        description: 'Multi-shop management',
        permissions: [
            { key: PERMISSIONS.SHOPS.VIEW_OTHER_SHOPS, label: 'View Other Shops', description: 'View other shop details' },
            { key: PERMISSIONS.SHOPS.MANAGE_SUB_SHOPS, label: 'Manage Sub Shops', description: 'Create and manage sub-shops' },
        ],
    },
    {
        id: 'subscriptions',
        name: 'Subscriptions',
        description: 'Subscription and plan management',
        permissions: [
            { key: PERMISSIONS.SUBSCRIPTIONS.VIEW_SUBSCRIPTIONS, label: 'View Subscriptions', description: 'View subscription plans' },
            { key: PERMISSIONS.SUBSCRIPTIONS.MANAGE_SUBSCRIPTIONS, label: 'Manage Subscriptions', description: 'Create/edit subscription plans' },
        ],
    },
    {
        id: 'users',
        name: 'Users & Roles',
        description: 'User and role management',
        permissions: [
            { key: PERMISSIONS.USERS.VIEW_CHILD_USERS, label: 'View Staff', description: 'View staff members' },
            { key: PERMISSIONS.USERS.CREATE_CHILD_USER, label: 'Create Staff', description: 'Add new staff members' },
            { key: PERMISSIONS.USERS.EDIT_CHILD_USER, label: 'Edit Staff', description: 'Modify staff details' },
            { key: PERMISSIONS.USERS.DELETE_CHILD_USER, label: 'Delete Staff', description: 'Remove staff members' },
            { key: PERMISSIONS.USERS.MANAGE_PERMISSIONS, label: 'Manage Permissions', description: 'Assign permissions to staff' },
        ],
    },
    {
        id: 'payroll',
        name: 'Payroll',
        description: 'Salary and payroll management',
        permissions: [
            { key: PERMISSIONS.PAYROLL.VIEW_PAYROLL, label: 'View Payroll', description: 'Access payroll page' },
            { key: PERMISSIONS.PAYROLL.RELEASE_SALARY, label: 'Release Salary', description: 'Process salary payments' },
            { key: PERMISSIONS.PAYROLL.VIEW_SALARY_HISTORY, label: 'View Salary History', description: 'View salary release history' },
            { key: PERMISSIONS.PAYROLL.VIEW_ADVANCE_SALARY, label: 'View Advance Salary', description: 'View advance salary requests' },
            { key: PERMISSIONS.PAYROLL.APPROVE_ADVANCE_SALARY, label: 'Approve Advance Salary', description: 'Approve/reject advance requests' },
            { key: PERMISSIONS.PAYROLL.VIEW_PROMOTION_HISTORY, label: 'View Promotion History', description: 'View salary promotions' },
            { key: PERMISSIONS.PAYROLL.MANAGE_PROMOTION, label: 'Manage Promotion', description: 'Create salary promotions' },
            { key: PERMISSIONS.PAYROLL.VIEW_LEAVE_HISTORY, label: 'View Leave History', description: 'View leave requests' },
            { key: PERMISSIONS.PAYROLL.APPROVE_LEAVE, label: 'Approve Leave', description: 'Approve/reject leave requests' },
        ],
    },
    {
        id: 'settings',
        name: 'Settings',
        description: 'System and shop settings',
        permissions: [
            { key: PERMISSIONS.SETTINGS.VIEW_SETTINGS, label: 'View Settings', description: 'Access settings page' },
            { key: PERMISSIONS.SETTINGS.EDIT_SHOP_PROFILE, label: 'Edit Shop Profile', description: 'Modify shop information' },
            { key: PERMISSIONS.SETTINGS.MANAGE_SETTINGS, label: 'Manage Settings', description: 'Change system settings' },
        ],
    },
    {
        id: 'profile',
        name: 'Staff Profile',
        description: 'Staff profile access',
        permissions: [
            { key: PERMISSIONS.STAFF_PROFILE.VIEW_OWN_PROFILE, label: 'View Own Profile', description: 'View own profile page' },
            { key: PERMISSIONS.STAFF_PROFILE.VIEW_OTHER_PROFILES, label: 'View Other Profiles', description: 'View other staff profiles' },
            { key: PERMISSIONS.STAFF_PROFILE.EDIT_PROFILE, label: 'Edit Profile', description: 'Edit profile information' },
        ],
    },
] as const;

// Helper function to get all permission keys
export const getAllPermissionKeys = (): string[] => {
    return PERMISSION_GROUPS.flatMap(group =>
        group.permissions.map(p => p.key)
    );
};

// Helper function to check if user has permission
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
    return userPermissions.includes(requiredPermission);
};

// Helper function to check if user has any of the permissions
export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
};

// Helper function to check if user has all permissions
export const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
};

// Preset permission templates for common roles
export const PERMISSION_TEMPLATES = {
    ADMIN: getAllPermissionKeys(),
    MANAGER: [
        PERMISSIONS.DASHBOARD.VIEW,
        PERMISSIONS.SALES.VIEW_POS,
        PERMISSIONS.SALES.CREATE_ORDER,
        PERMISSIONS.SALES.VIEW_ORDERS,
        PERMISSIONS.SALES.EDIT_ORDER,
        PERMISSIONS.SALES.VIEW_PRODUCT_STATEMENT,
        PERMISSIONS.SALES.VIEW_STAFF_COMMISSIONS,
        PERMISSIONS.SALES.VIEW_SALES_REPORT,
        PERMISSIONS.INVENTORY.VIEW_PRODUCTS,
        PERMISSIONS.INVENTORY.CREATE_PRODUCT,
        PERMISSIONS.INVENTORY.EDIT_PRODUCT,
        PERMISSIONS.INVENTORY.VIEW_CATEGORIES,
        PERMISSIONS.INVENTORY.MANAGE_CATEGORIES,
        PERMISSIONS.INVENTORY.VIEW_BRANDS,
        PERMISSIONS.INVENTORY.MANAGE_BRANDS,
        PERMISSIONS.USERS.VIEW_CHILD_USERS,
        PERMISSIONS.PAYROLL.VIEW_PAYROLL,
        PERMISSIONS.PAYROLL.VIEW_SALARY_HISTORY,
        PERMISSIONS.PAYROLL.VIEW_ADVANCE_SALARY,
        PERMISSIONS.PAYROLL.APPROVE_ADVANCE_SALARY,
        PERMISSIONS.PAYROLL.VIEW_LEAVE_HISTORY,
        PERMISSIONS.PAYROLL.APPROVE_LEAVE,
        PERMISSIONS.STAFF_PROFILE.VIEW_OWN_PROFILE,
        PERMISSIONS.STAFF_PROFILE.VIEW_OTHER_PROFILES,
    ],
    CASHIER: [
        PERMISSIONS.DASHBOARD.VIEW,
        PERMISSIONS.SALES.VIEW_POS,
        PERMISSIONS.SALES.CREATE_ORDER,
        PERMISSIONS.SALES.VIEW_ORDERS,
        PERMISSIONS.INVENTORY.VIEW_PRODUCTS,
        PERMISSIONS.STAFF_PROFILE.VIEW_OWN_PROFILE,
    ],
    SALES_PERSON: [
        PERMISSIONS.DASHBOARD.VIEW,
        PERMISSIONS.SALES.VIEW_POS,
        PERMISSIONS.SALES.CREATE_ORDER,
        PERMISSIONS.SALES.VIEW_ORDERS,
        PERMISSIONS.INVENTORY.VIEW_PRODUCTS,
        PERMISSIONS.STAFF_PROFILE.VIEW_OWN_PROFILE,
    ],
    INVENTORY_MANAGER: [
        PERMISSIONS.DASHBOARD.VIEW,
        PERMISSIONS.INVENTORY.VIEW_PRODUCTS,
        PERMISSIONS.INVENTORY.CREATE_PRODUCT,
        PERMISSIONS.INVENTORY.EDIT_PRODUCT,
        PERMISSIONS.INVENTORY.DELETE_PRODUCT,
        PERMISSIONS.INVENTORY.VIEW_CATEGORIES,
        PERMISSIONS.INVENTORY.MANAGE_CATEGORIES,
        PERMISSIONS.INVENTORY.VIEW_BRANDS,
        PERMISSIONS.INVENTORY.MANAGE_BRANDS,
        PERMISSIONS.INVENTORY.VIEW_UNITS,
        PERMISSIONS.INVENTORY.MANAGE_UNITS,
        PERMISSIONS.INVENTORY.VIEW_SIZES,
        PERMISSIONS.INVENTORY.MANAGE_SIZES,
        PERMISSIONS.INVENTORY.VIEW_COLORS,
        PERMISSIONS.INVENTORY.MANAGE_COLORS,
        PERMISSIONS.STAFF_PROFILE.VIEW_OWN_PROFILE,
    ],
};
