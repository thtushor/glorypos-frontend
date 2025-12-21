# Permission System Implementation Summary

## Overview
Implemented a comprehensive permission-based access control system for the GloryPOS frontend application. The system differentiates between main shop users (full access) and child users (permission-based access).

## Key Concepts

### 1. User Types
- **Main Shop User**: `user.child` is empty/null → Has ALL permissions automatically
- **Child User**: `user.child.id` exists → Must have specific permissions in `user.child.permissions` array

### 2. Permission Structure
All permissions are defined in `src/config/permissions.ts` and organized by modules:
- Dashboard
- Sales (POS, Orders, Reports, etc.)
- Inventory (Products, Categories, Brands, etc.)
- Shops
- Subscriptions
- Users & Roles
- Payroll
- Settings
- Staff Profile

## Implementation Details

### Files Created/Modified

#### 1. **src/utils/permissionHelpers.ts** (NEW)
Helper functions for permission checking:
- `checkPermission(user, permission)` - Check single permission
- `checkAnyPermission(user, permissions[])` - Check if user has ANY of the permissions
- `checkAllPermissions(user, permissions[])` - Check if user has ALL permissions
- `getUserPermissions(user)` - Get user's permission array

**Key Logic**: All functions return `true` for main shop users (no child), otherwise check the `user.child.permissions` array.

#### 2. **src/components/PermissionRoute.tsx** (NEW)
Route-level permission protection component:
- Wraps routes to enforce permission requirements
- Supports single permission or multiple permissions (any)
- Redirects to dashboard if access denied
- Main shop users bypass all checks

#### 3. **src/types/menu.ts** (NEW)
TypeScript type definitions for menu items:
```typescript
interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: JSX.Element;
  permission?: string;
  submenu?: SubMenuItem[];
}
```

#### 4. **src/config/menuItems.tsx** (MODIFIED)
- Added `permission` field to each menu item
- Added type annotations: `MenuItem[]`
- Imported PERMISSIONS constants

Example:
```typescript
{
  id: "dashboard",
  title: "Dashboard",
  path: "/dashboard",
  icon: <FaHome />,
  permission: PERMISSIONS.DASHBOARD.VIEW,
}
```

#### 5. **src/components/Sidebar.tsx** (MODIFIED)
- Imported `checkPermission` helper and `MenuItem` type
- Added permission filtering logic:
  ```typescript
  .filter((item) => {
    if (!item.permission) return true;
    return checkPermission(user, item.permission);
  })
  ```
- Filters both parent menu items and submenu items
- Hides parent menu if all submenu items are filtered out

#### 6. **src/routes/index.tsx** (MODIFIED)
- Imported `PermissionRoute` component and `PERMISSIONS`
- Wrapped all shop routes with `PermissionRoute`
- Applied permissions to:
  - Dashboard
  - All Sales routes (POS, Orders, Reports, etc.)
  - All Inventory routes (Products, Categories, etc.)
  - Payroll routes and sub-routes
  - Settings
  - Staff Profile routes
  - Subscriptions
  - Child Users management

Example:
```typescript
<Route 
  path="dashboard" 
  element={
    <PermissionRoute requiredPermission={PERMISSIONS.DASHBOARD.VIEW}>
      <Dashboard />
    </PermissionRoute>
  } 
/>
```

## How It Works

### Sidebar Menu Filtering
1. System checks if user is main shop user (`!user.child.id`)
   - If yes: Show all menu items
   - If no: Filter menu items based on `user.child.permissions`

2. For each menu item:
   - Check if item has a `permission` field
   - If no permission field: Always show
   - If has permission: Check if user has that permission

3. For submenu items:
   - Filter submenu items individually
   - Hide parent menu if all submenu items are filtered out

### Route Protection
1. User navigates to a route
2. `PermissionRoute` component checks:
   - Is user a main shop user? → Allow access
   - Does user have required permission? → Allow access
   - Otherwise → Redirect to dashboard

### Permission Checking Logic
```typescript
// Main shop user check
if (!user?.child?.id) {
  return true; // Full access
}

// Child user check
const userPermissions = user?.child?.permissions || [];
return userPermissions.includes(requiredPermission);
```

## Usage Examples

### Check Permission in Component
```typescript
import { checkPermission } from "@/utils/permissionHelpers";
import { PERMISSIONS } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";

const MyComponent = () => {
  const { user } = useAuth();
  
  const canViewCostProfit = checkPermission(
    user, 
    PERMISSIONS.SALES.VIEW_COST_PROFIT
  );
  
  return (
    <div>
      {canViewCostProfit && <CostProfitSection />}
    </div>
  );
};
```

### Protect a Route
```typescript
<Route 
  path="my-route" 
  element={
    <PermissionRoute requiredPermission={PERMISSIONS.SALES.VIEW_ORDERS}>
      <MyComponent />
    </PermissionRoute>
  } 
/>
```

### Check Multiple Permissions (Any)
```typescript
<PermissionRoute 
  requiredAnyPermissions={[
    PERMISSIONS.STAFF_PROFILE.VIEW_OWN_PROFILE,
    PERMISSIONS.STAFF_PROFILE.VIEW_OTHER_PROFILES
  ]}
>
  <StaffProfilePage />
</PermissionRoute>
```

## Benefits

1. **Centralized Permission Management**: All permissions defined in one place
2. **Type Safety**: TypeScript types ensure correct permission usage
3. **Automatic Main Shop Access**: No need to assign permissions to main shop users
4. **Granular Control**: Fine-grained permissions for child users
5. **UI/UX Consistency**: Hidden menu items = inaccessible routes
6. **Reusable Helpers**: Permission checking logic can be used anywhere

## Testing Checklist

- [ ] Main shop user can access all routes
- [ ] Main shop user sees all menu items
- [ ] Child user with no permissions sees only allowed items
- [ ] Child user cannot access restricted routes (redirects to dashboard)
- [ ] Child user with specific permission can access that route
- [ ] Submenu filtering works correctly
- [ ] Parent menu hides when all submenu items are filtered
- [ ] Staff profile route works for both own profile and other profiles
- [ ] Payroll routes respect permissions
- [ ] Settings and admin routes respect permissions

## Future Enhancements

1. Add permission caching for performance
2. Implement role-based permission templates
3. Add permission audit logging
4. Create admin UI for permission management
5. Add permission inheritance/groups
