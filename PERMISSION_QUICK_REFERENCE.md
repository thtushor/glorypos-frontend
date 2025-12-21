# Permission System - Quick Reference

## Two Ways to Check Permissions

### Option 1: Using the `usePermission` Hook (Recommended)
```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const MyComponent = () => {
  const { hasPermission, hasAnyPermission, isMainShopUser } = usePermission();
  
  const canViewCostProfit = hasPermission(PERMISSIONS.SALES.VIEW_COST_PROFIT);
  
  return (
    <div>
      {canViewCostProfit && <CostProfitDisplay />}
    </div>
  );
};
```

### Option 2: Using Helper Functions Directly
```typescript
import { useAuth } from "@/context/AuthContext";
import { checkPermission, checkAnyPermission } from "@/utils/permissionHelpers";
import { PERMISSIONS } from "@/config/permissions";

const MyComponent = () => {
  const { user } = useAuth();
  
  const canViewCostProfit = checkPermission(user, PERMISSIONS.SALES.VIEW_COST_PROFIT);
  
  return (
    <div>
      {canViewCostProfit && <CostProfitDisplay />}
    </div>
  );
};
```

## Permission Checking in Components

### Import Required Items (Hook Method)
```typescript
import { useAuth } from "@/context/AuthContext";
import { checkPermission, checkAnyPermission } from "@/utils/permissionHelpers";
import { PERMISSIONS } from "@/config/permissions";
```

### Check Single Permission
```typescript
const { user } = useAuth();

// Check if user can view cost & profit
const canViewCostProfit = checkPermission(user, PERMISSIONS.SALES.VIEW_COST_PROFIT);

// Use in JSX
{canViewCostProfit && <CostProfitDisplay />}

// Use in logic
if (canViewCostProfit) {
  // Show cost/profit data
}
```

### Check Multiple Permissions (Any)
```typescript
// User needs at least ONE of these permissions
const canViewProfile = checkAnyPermission(user, [
  PERMISSIONS.STAFF_PROFILE.VIEW_OWN_PROFILE,
  PERMISSIONS.STAFF_PROFILE.VIEW_OTHER_PROFILES
]);
```

### Conditional Rendering Examples
```typescript
// Hide button if no permission
{checkPermission(user, PERMISSIONS.INVENTORY.ADJUST_STOCK) && (
  <button onClick={adjustStock}>Adjust Stock</button>
)}

// Disable button if no permission
<button 
  disabled={!checkPermission(user, PERMISSIONS.SALES.EDIT_ORDER)}
  onClick={editOrder}
>
  Edit Order
</button>

// Show different content based on permission
{checkPermission(user, PERMISSIONS.SALES.VIEW_COST_PROFIT) ? (
  <FullSalesReport />
) : (
  <BasicSalesReport />
)}
```

## Available Permissions by Module

### Dashboard
- `PERMISSIONS.DASHBOARD.VIEW` - View dashboard

### Sales
- `PERMISSIONS.SALES.VIEW_POS` - Access POS
- `PERMISSIONS.SALES.CREATE_ORDER` - Create orders
- `PERMISSIONS.SALES.VIEW_ORDERS` - View orders
- `PERMISSIONS.SALES.EDIT_ORDER` - Edit orders
- `PERMISSIONS.SALES.DELETE_ORDER` - Delete orders
- `PERMISSIONS.SALES.VIEW_PRODUCT_STATEMENT` - View product statements
- `PERMISSIONS.SALES.VIEW_STAFF_COMMISSIONS` - View commissions
- `PERMISSIONS.SALES.VIEW_SALES_REPORT` - View sales reports
- `PERMISSIONS.SALES.VIEW_COST_PROFIT` - View cost & profit

### Inventory
- `PERMISSIONS.INVENTORY.VIEW_PRODUCTS` - View products
- `PERMISSIONS.INVENTORY.CREATE_PRODUCT` - Create products
- `PERMISSIONS.INVENTORY.EDIT_PRODUCT` - Edit products
- `PERMISSIONS.INVENTORY.DELETE_PRODUCT` - Delete products
- `PERMISSIONS.INVENTORY.ADJUST_STOCK` - Adjust stock levels
- `PERMISSIONS.INVENTORY.VIEW_CATEGORIES` - View categories
- `PERMISSIONS.INVENTORY.MANAGE_CATEGORIES` - Manage categories
- `PERMISSIONS.INVENTORY.VIEW_BRANDS` - View brands
- `PERMISSIONS.INVENTORY.MANAGE_BRANDS` - Manage brands
- `PERMISSIONS.INVENTORY.VIEW_UNITS` - View units
- `PERMISSIONS.INVENTORY.MANAGE_UNITS` - Manage units
- `PERMISSIONS.INVENTORY.VIEW_SIZES` - View sizes
- `PERMISSIONS.INVENTORY.MANAGE_SIZES` - Manage sizes
- `PERMISSIONS.INVENTORY.VIEW_COLORS` - View colors
- `PERMISSIONS.INVENTORY.MANAGE_COLORS` - Manage colors

### Shops
- `PERMISSIONS.SHOPS.VIEW_OTHER_SHOPS` - View other shops
- `PERMISSIONS.SHOPS.MANAGE_SUB_SHOPS` - Manage sub-shops

### Subscriptions
- `PERMISSIONS.SUBSCRIPTIONS.VIEW_SUBSCRIPTIONS` - View subscriptions
- `PERMISSIONS.SUBSCRIPTIONS.MANAGE_SUBSCRIPTIONS` - Manage subscriptions

### Users & Roles
- `PERMISSIONS.USERS.VIEW_CHILD_USERS` - View staff
- `PERMISSIONS.USERS.CREATE_CHILD_USER` - Create staff
- `PERMISSIONS.USERS.EDIT_CHILD_USER` - Edit staff
- `PERMISSIONS.USERS.DELETE_CHILD_USER` - Delete staff
- `PERMISSIONS.USERS.MANAGE_PERMISSIONS` - Manage permissions

### Payroll
- `PERMISSIONS.PAYROLL.VIEW_PAYROLL` - Access payroll
- `PERMISSIONS.PAYROLL.RELEASE_SALARY` - Release salary
- `PERMISSIONS.PAYROLL.VIEW_SALARY_HISTORY` - View salary history
- `PERMISSIONS.PAYROLL.VIEW_ADVANCE_SALARY` - View advance salary
- `PERMISSIONS.PAYROLL.APPROVE_ADVANCE_SALARY` - Approve advance salary
- `PERMISSIONS.PAYROLL.VIEW_PROMOTION_HISTORY` - View promotions
- `PERMISSIONS.PAYROLL.MANAGE_PROMOTION` - Manage promotions
- `PERMISSIONS.PAYROLL.VIEW_LEAVE_HISTORY` - View leave history
- `PERMISSIONS.PAYROLL.APPROVE_LEAVE` - Approve leave

### Settings
- `PERMISSIONS.SETTINGS.VIEW_SETTINGS` - View settings
- `PERMISSIONS.SETTINGS.EDIT_SHOP_PROFILE` - Edit shop profile
- `PERMISSIONS.SETTINGS.MANAGE_SETTINGS` - Manage settings

### Staff Profile
- `PERMISSIONS.STAFF_PROFILE.VIEW_OWN_PROFILE` - View own profile
- `PERMISSIONS.STAFF_PROFILE.VIEW_OTHER_PROFILES` - View other profiles
- `PERMISSIONS.STAFF_PROFILE.EDIT_PROFILE` - Edit profile
- `PERMISSIONS.STAFF_PROFILE.EDIT_PERMISSIONS` - Edit permissions

## Common Patterns

### Hide Action Buttons
```typescript
// In a table or list
<td>
  {checkPermission(user, PERMISSIONS.INVENTORY.EDIT_PRODUCT) && (
    <button onClick={() => editProduct(product.id)}>Edit</button>
  )}
  {checkPermission(user, PERMISSIONS.INVENTORY.DELETE_PRODUCT) && (
    <button onClick={() => deleteProduct(product.id)}>Delete</button>
  )}
</td>
```

### Conditional Form Fields
```typescript
// Show cost field only if user has permission
{checkPermission(user, PERMISSIONS.SALES.VIEW_COST_PROFIT) && (
  <div>
    <label>Cost Price</label>
    <input type="number" name="cost" />
  </div>
)}
```

### Tab Visibility
```typescript
const tabs = [
  { id: 'basic', label: 'Basic Info', show: true },
  { 
    id: 'financial', 
    label: 'Financial', 
    show: checkPermission(user, PERMISSIONS.SALES.VIEW_COST_PROFIT) 
  },
  { 
    id: 'permissions', 
    label: 'Permissions', 
    show: checkPermission(user, PERMISSIONS.USERS.MANAGE_PERMISSIONS) 
  },
].filter(tab => tab.show);
```

## Important Notes

1. **Main Shop Users**: If `user.child` is empty/null, the user has ALL permissions automatically. No need to check.

2. **Child Users**: Must have specific permissions in `user.child.permissions` array.

3. **Route Protection**: Routes are already protected with `PermissionRoute`. Component-level checks are for UI elements within allowed pages.

4. **Sidebar**: Automatically filters menu items based on permissions. No manual filtering needed.

5. **Type Safety**: Always use `PERMISSIONS` constants, never hardcode permission strings.

## Example: Product Management Component

```typescript
import { useAuth } from "@/context/AuthContext";
import { checkPermission } from "@/utils/permissionHelpers";
import { PERMISSIONS } from "@/config/permissions";

const ProductManagement = () => {
  const { user } = useAuth();
  
  const canCreate = checkPermission(user, PERMISSIONS.INVENTORY.CREATE_PRODUCT);
  const canEdit = checkPermission(user, PERMISSIONS.INVENTORY.EDIT_PRODUCT);
  const canDelete = checkPermission(user, PERMISSIONS.INVENTORY.DELETE_PRODUCT);
  const canAdjustStock = checkPermission(user, PERMISSIONS.INVENTORY.ADJUST_STOCK);
  const canViewCost = checkPermission(user, PERMISSIONS.SALES.VIEW_COST_PROFIT);
  
  return (
    <div>
      <h1>Products</h1>
      
      {canCreate && (
        <button onClick={openCreateModal}>Add New Product</button>
      )}
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            {canViewCost && <th>Cost</th>}
            {canViewCost && <th>Profit</th>}
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.price}</td>
              {canViewCost && <td>{product.cost}</td>}
              {canViewCost && <td>{product.price - product.cost}</td>}
              <td>{product.stock}</td>
              <td>
                {canEdit && (
                  <button onClick={() => editProduct(product)}>Edit</button>
                )}
                {canAdjustStock && (
                  <button onClick={() => adjustStock(product)}>Adjust Stock</button>
                )}
                {canDelete && (
                  <button onClick={() => deleteProduct(product)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

## usePermission Hook API

The `usePermission` hook provides a cleaner way to check permissions in components.

### Available Methods

```typescript
const {
  hasPermission,      // Check single permission
  hasAnyPermission,   // Check if user has ANY of the permissions
  hasAllPermissions,  // Check if user has ALL permissions
  isMainShopUser,     // Boolean: true if main shop user
  isChildUser,        // Boolean: true if child user
} = usePermission();
```

### Usage Examples

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const MyComponent = () => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    isMainShopUser 
  } = usePermission();
  
  // Single permission check
  const canEdit = hasPermission(PERMISSIONS.INVENTORY.EDIT_PRODUCT);
  
  // Multiple permissions (any)
  const canViewProfile = hasAnyPermission([
    PERMISSIONS.STAFF_PROFILE.VIEW_OWN_PROFILE,
    PERMISSIONS.STAFF_PROFILE.VIEW_OTHER_PROFILES
  ]);
  
  // Check user type
  if (isMainShopUser) {
    // Show admin features
  }
  
  return (
    <div>
      {canEdit && <EditButton />}
      {canViewProfile && <ProfileLink />}
    </div>
  );
};
```

### Benefits of Using the Hook

1. **Cleaner Code**: No need to pass `user` object around
2. **Auto-Updates**: Automatically re-renders when user changes
3. **Type Safety**: Full TypeScript support
4. **Convenience**: Access to user type checks (isMainShopUser, isChildUser)
