# Other Shops (Sub Shops) Permission Implementation

## Overview
Applied permission-based access control to the Other Shops page to restrict sub-shop management actions based on user permissions.

## File Modified
**`src/pages/OtherShops.tsx`**

## Permission Applied

### **MANAGE_SUB_SHOPS Permission**
- **Permission**: `PERMISSIONS.SHOPS.MANAGE_SUB_SHOPS`
- **Controls**: Sub-shop creation and editing actions
- **Hidden Elements**:
  - "Add Sub Shop" button
  - Edit button (pencil icon) for each shop row

## What's Always Visible
- Page title "Other Shops"
- Search functionality
- Filter controls
- Shop list table with all shop information
- Pagination
- Shop details (name, business, status, type)

## Implementation Code

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const OtherShops = () => {
  const { hasPermission } = usePermission();

  // Permission check
  const canManageSubShops = hasPermission(PERMISSIONS.SHOPS.MANAGE_SUB_SHOPS);

  return (
    <div>
      {/* Add Sub Shop Button */}
      {canManageSubShops && (
        <button onClick={() => setShowAddModal(true)}>
          Add Sub Shop
        </button>
      )}

      {/* Edit Button per Shop */}
      <td>
        {canManageSubShops && (
          <button onClick={() => setShowEditModal(true)} title="Edit Shop">
            <FaEdit />
          </button>
        )}
      </td>
    </div>
  );
};
```

## User Experience

### Main Shop Users
- See "Add Sub Shop" button
- See Edit button for each shop
- Can create new sub-shops
- Can edit existing sub-shops
- Full management capabilities

### Child Users

#### With MANAGE_SUB_SHOPS Permission
- Can see "Add Sub Shop" button
- Can see Edit button for each shop
- Can create new sub-shops
- Can edit existing sub-shops
- Same capabilities as main shop users

#### Without MANAGE_SUB_SHOPS Permission
- **Cannot** see "Add Sub Shop" button
- **Cannot** see Edit buttons
- Can only view the list of shops
- Read-only access to shop information
- Can use search and filters

## Permission Matrix

| Action | Permission Required | Main Shop User | Child User (with permission) | Child User (without permission) |
|--------|-------------------|----------------|------------------------------|--------------------------------|
| **View Shops List** | Route-level | ✅ Yes | ✅ Yes | ✅ Yes |
| **Search Shops** | None | ✅ Yes | ✅ Yes | ✅ Yes |
| **Filter Shops** | None | ✅ Yes | ✅ Yes | ✅ Yes |
| **Add Sub Shop** | `MANAGE_SUB_SHOPS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Edit Shop** | `MANAGE_SUB_SHOPS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **View Shop Details** | None | ✅ Yes | ✅ Yes | ✅ Yes |

## Features Controlled

### 1. **Add Sub Shop Button**
- Opens modal to create new sub-shop
- Collects shop information:
  - Full name
  - Email
  - Phone number
  - Location
  - Business name
  - Business type
  - Shop type (normal/restaurant)
  - Password
  - Staff commission percentage

### 2. **Edit Shop Button**
- Opens modal to edit existing sub-shop
- Allows updating:
  - Full name
  - Location
  - Business name
  - Business type
  - Shop type
  - Account status (active/inactive)
  - Account type
  - Staff commission percentage
- Email and phone are read-only

## Benefits

1. **Controlled Access**: Only authorized users can manage sub-shops
2. **Data Integrity**: Prevents unauthorized modifications to shop data
3. **Clean UI**: Users without permission see a simpler, view-only interface
4. **Flexible Management**: Different staff can have different levels of access
5. **Audit Trail**: Clear separation between viewers and managers

## Visual Changes

### With MANAGE_SUB_SHOPS Permission:
```
[Add Sub Shop Button] [Search] [Filter]

| User | Business | Status | Type | [Edit] |
```

### Without MANAGE_SUB_SHOPS Permission:
```
[Search] [Filter]

| User | Business | Status | Type | (no actions) |
```

## Testing Checklist

- [ ] Main shop user sees "Add Sub Shop" button
- [ ] Main shop user sees Edit buttons for all shops
- [ ] Child user with MANAGE_SUB_SHOPS sees "Add Sub Shop" button
- [ ] Child user with MANAGE_SUB_SHOPS sees Edit buttons
- [ ] Child user without MANAGE_SUB_SHOPS doesn't see "Add Sub Shop" button
- [ ] Child user without MANAGE_SUB_SHOPS doesn't see Edit buttons
- [ ] All users can view the shop list
- [ ] All users can use search functionality
- [ ] All users can use filters
- [ ] Add Sub Shop modal works correctly
- [ ] Edit Shop modal works correctly
- [ ] Form validation works properly
- [ ] No console errors or broken layouts

## Notes

- Route-level protection already exists via `PermissionRoute` in `routes/index.tsx`
- This implementation adds **component-level** permission checks for action buttons
- The shop list view is accessible to all (controlled by route-level permissions)
- Search and filter functionality remains available to all users
- Edit button has a descriptive title for better accessibility
- Users without permission can still view all shop information

## Related Permissions

These permissions should be configured in the backend and assigned to users/roles:

- `PERMISSIONS.SHOPS.VIEW_OTHER_SHOPS` - "View Other Shops" (route-level access)
- `PERMISSIONS.SHOPS.MANAGE_SUB_SHOPS` - "Manage Sub Shops" (create/edit actions)

## Future Enhancements

Potential future improvements:
- Add delete sub-shop functionality with appropriate permission
- Add bulk actions (activate/deactivate multiple shops)
- Add export functionality for shop list
- Add detailed shop analytics/reports
- Add shop status change history
