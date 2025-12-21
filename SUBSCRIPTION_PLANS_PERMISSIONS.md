# Subscription Plans Permission Implementation

## Overview
Applied permission-based access control to the Subscription Plans page to restrict plan management actions based on user permissions and account type.

## File Modified
**`src/pages/admin/SubscriptionPlans.tsx`**

## Permission Applied

### **MANAGE_SUBSCRIPTIONS**
- **Permission**: `PERMISSIONS.SUBSCRIPTIONS.MANAGE_SUBSCRIPTIONS`
- **Controls**: Add, Edit, Delete subscription plan actions
- **User Type**: Admin users only (non-shop users)

## What's Always Visible
- Page title "Subscription Plans"
- Subscription plan cards with details (name, price, features, limits)
- Plan status indicators
- Subscribe button (for shop users)

## Implementation Details

### Dual-Layer Access Control

This page implements a **two-tier access control system**:

1. **Account Type Check**: `isShopUser` (shop vs admin)
2. **Permission Check**: `canManageSubscriptions`

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  
  // Account type check
  const isShopUser = user?.accountType === "shop";
  
  // Permission check
  const canManageSubscriptions = hasPermission(
    PERMISSIONS.SUBSCRIPTIONS.MANAGE_SUBSCRIPTIONS
  );

  return (
    <div>
      {/* Add Plan Button - Admin only with permission */}
      {!isShopUser && canManageSubscriptions && (
        <button onClick={() => setIsModalOpen(true)}>
          Add Plan
        </button>
      )}

      {/* Plan Cards */}
      {plans.map(plan => (
        <div>
          {isShopUser ? (
            // Shop users see Subscribe button
            <button onClick={() => handleSubscribe(plan)}>
              Subscribe
            </button>
          ) : canManageSubscriptions ? (
            // Admin users with permission see Edit/Delete
            <>
              <button onClick={() => handleEdit(plan)}>Edit</button>
              <button onClick={() => handleDelete(plan)}>Delete</button>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
};
```

## User Experience

### Shop Users (Customers)
- **Account Type**: `shop`
- **Can See**: All subscription plans with details
- **Can Do**: Subscribe to plans
- **Cannot See**: Add Plan button, Edit/Delete buttons
- **Purpose**: Browse and purchase subscription plans

### Admin Users (Platform Admins)

#### With MANAGE_SUBSCRIPTIONS Permission
- **Can See**: Add Plan button, Edit/Delete buttons on each plan
- **Can Do**: Create, edit, and delete subscription plans
- **Cannot See**: Subscribe button
- **Purpose**: Manage the subscription plan catalog

#### Without MANAGE_SUBSCRIPTIONS Permission
- **Can See**: All subscription plans (view-only)
- **Cannot See**: Add Plan button, Edit/Delete buttons, Subscribe button
- **Purpose**: View-only access to plan catalog

## Permission Matrix

| Action | Account Type | Permission Required | Shop User | Admin (with permission) | Admin (without permission) |
|--------|-------------|-------------------|-----------|------------------------|---------------------------|
| **View Plans** | Any | Route-level | ✅ Yes | ✅ Yes | ✅ Yes |
| **Subscribe to Plan** | Shop | None | ✅ Yes | ❌ No | ❌ No |
| **Add Plan** | Admin | `MANAGE_SUBSCRIPTIONS` | ❌ No | ✅ Yes | ❌ No (button hidden) |
| **Edit Plan** | Admin | `MANAGE_SUBSCRIPTIONS` | ❌ No | ✅ Yes | ❌ No (button hidden) |
| **Delete Plan** | Admin | `MANAGE_SUBSCRIPTIONS` | ❌ No | ✅ Yes | ❌ No (button hidden) |

## Plan Card UI

### For Shop Users:
```
┌─────────────────────────────┐
│ Plan Name        [Subscribe]│
│ $99/month                   │
│ Features:                   │
│ • Feature 1                 │
│ • Feature 2                 │
│ Max Products: 1000          │
│ Storage: 10 GB              │
└─────────────────────────────┘
```

### For Admin Users (with permission):
```
┌─────────────────────────────┐
│ Plan Name      [Edit][Delete]│
│ $99/month                   │
│ Features:                   │
│ • Feature 1                 │
│ • Feature 2                 │
│ Max Products: 1000          │
│ Storage: 10 GB              │
└─────────────────────────────┘
```

### For Admin Users (without permission):
```
┌─────────────────────────────┐
│ Plan Name                   │
│ $99/month                   │
│ Features:                   │
│ • Feature 1                 │
│ • Feature 2                 │
│ Max Products: 1000          │
│ Storage: 10 GB              │
└─────────────────────────────┘
```

## Benefits

1. **Clear Separation**: Shop users and admin users have distinct experiences
2. **Granular Control**: Admin permissions can be controlled independently
3. **Security**: Prevents unauthorized plan modifications
4. **Flexible Access**: Different admin users can have different levels of access
5. **User-Appropriate UI**: Each user type sees only relevant actions

## Features Controlled

### 1. **Add Plan** (Admin Only)
- Opens comprehensive plan creation form
- Allows setting:
  - Plan name and description
  - Price and duration
  - Features list
  - Max products, users, storage
  - Plan status (active/inactive)

### 2. **Edit Plan** (Admin Only)
- Opens same form with pre-filled data
- Allows updating all plan details
- Maintains plan history

### 3. **Delete Plan** (Admin Only)
- Shows confirmation dialog
- Permanently removes plan
- Invalidates plan queries

### 4. **Subscribe to Plan** (Shop Users Only)
- Opens subscription modal
- Initiates subscription process
- Handles payment flow

## Testing Checklist

### Shop Users
- [ ] Shop user sees all subscription plans
- [ ] Shop user sees "Subscribe" button on each plan
- [ ] Shop user does NOT see "Add Plan" button
- [ ] Shop user does NOT see Edit/Delete buttons
- [ ] Subscribe button works correctly
- [ ] Subscription modal opens properly

### Admin Users (with MANAGE_SUBSCRIPTIONS)
- [ ] Admin user sees "Add Plan" button
- [ ] Admin user sees Edit and Delete buttons on each plan
- [ ] Admin user does NOT see "Subscribe" button
- [ ] Add plan modal opens and works correctly
- [ ] Edit plan modal opens with pre-filled data
- [ ] Delete confirmation modal works correctly
- [ ] CRUD operations complete successfully

### Admin Users (without MANAGE_SUBSCRIPTIONS)
- [ ] Admin user does NOT see "Add Plan" button
- [ ] Admin user does NOT see Edit/Delete buttons
- [ ] Admin user does NOT see "Subscribe" button
- [ ] Admin user can view all plans (read-only)
- [ ] No console errors
- [ ] UI displays correctly without action buttons

## Notes

- This page uses **dual-layer protection**: account type + permission
- Shop users are identified by `user?.accountType === "shop"`
- Admin users are non-shop users (platform administrators)
- The permission check is only applied to admin users
- Shop users always see the Subscribe button (no permission check needed)
- Admin users need `MANAGE_SUBSCRIPTIONS` permission to manage plans
- Route-level protection should also exist in `routes/index.tsx`

## Related Permissions

These permissions should be configured in the backend and assigned to users/roles:

- `PERMISSIONS.SUBSCRIPTIONS.VIEW_SUBSCRIPTIONS` - View subscription plans (route-level)
- `PERMISSIONS.SUBSCRIPTIONS.MANAGE_SUBSCRIPTIONS` - Create/Edit/Delete plans

## Use Cases

### Scenario 1: Shop Owner (Customer)
- **Account Type**: Shop
- **Permissions**: N/A (shop users don't use permission system)
- **Can**: Browse plans and subscribe
- **Cannot**: Manage plans
- **Benefit**: Simple, focused experience for purchasing subscriptions

### Scenario 2: Platform Admin (Full Access)
- **Account Type**: Admin
- **Permissions**: MANAGE_SUBSCRIPTIONS
- **Can**: Full CRUD on subscription plans
- **Cannot**: Subscribe to plans (not a shop)
- **Benefit**: Complete control over plan catalog

### Scenario 3: Support Staff (View Only)
- **Account Type**: Admin
- **Permissions**: VIEW_SUBSCRIPTIONS only
- **Can**: View all plans to assist customers
- **Cannot**: Modify plans or subscribe
- **Benefit**: Can help customers without risk of accidental changes

## Future Enhancements

Potential improvements:
- Add plan analytics (subscribers count, revenue)
- Add plan duplication feature
- Add bulk plan operations
- Add plan version history
- Add A/B testing for plan pricing
- Add plan recommendation engine
- Add usage tracking per plan
