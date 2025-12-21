# Child Users (Staff Management) Permission Implementation

## Overview
Applied permission-based access control to the Child Users (Staff Management) page to restrict staff management actions based on user permissions.

## File Modified
**`src/pages/users/ChildUsers.tsx`**

## Permissions Applied

### 1. **CREATE_CHILD_USER Permission**
- **Permission**: `PERMISSIONS.USERS.CREATE_CHILD_USER`
- **Controls**: "Add User" button
- **Action**: Opens modal to create new staff members

### 2. **EDIT_CHILD_USER Permission**
- **Permission**: `PERMISSIONS.USERS.EDIT_CHILD_USER`
- **Controls**: Edit button (pencil icon) for each user row
- **Action**: Opens modal to edit staff member details

### 3. **DELETE_CHILD_USER Permission**
- **Permission**: `PERMISSIONS.USERS.DELETE_CHILD_USER`
- **Controls**: Delete button (trash icon) for each user row
- **Action**: Deletes staff member after confirmation

### 4. **VIEW_CHILD_USERS Permission**
- **Permission**: `PERMISSIONS.USERS.VIEW_CHILD_USERS`
- **Controls**: View Details button (gear icon) for each user row
- **Action**: Opens modal showing detailed staff information

## Implementation Code

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const ChildUsers = () => {
  const { hasPermission } = usePermission();

  // Permission checks
  const canCreateUser = hasPermission(PERMISSIONS.USERS.CREATE_CHILD_USER);
  const canEditUser = hasPermission(PERMISSIONS.USERS.EDIT_CHILD_USER);
  const canDeleteUser = hasPermission(PERMISSIONS.USERS.DELETE_CHILD_USER);
  const canViewDetails = hasPermission(PERMISSIONS.USERS.VIEW_CHILD_USERS);

  return (
    <div>
      {/* Add User Button */}
      {canCreateUser && (
        <button onClick={() => setShowCreateModal(true)}>
          Add User
        </button>
      )}

      {/* Action Buttons per User */}
      <td>
        {canEditUser && (
          <button title="Edit User">
            <FaEdit />
          </button>
        )}
        {canViewDetails && (
          <button title="View Details">
            <FaUserCog />
          </button>
        )}
        {canDeleteUser && (
          <button title="Delete User">
            <FaTrash />
          </button>
        )}
      </td>
    </div>
  );
};
```

## What's Always Visible
- Page title "Child Users"
- Search and filter controls
- User list table (with visible columns)
- Pagination controls
- User information display (name, email, role, status, etc.)

## User Experience

### Main Shop Users
- See all action buttons (Add, Edit, View, Delete)
- Full control over staff management
- No restrictions

### Child Users

#### With CREATE_CHILD_USER Permission
- Can see "Add User" button
- Can create new staff members
- Can add employees to the system

#### Without CREATE_CHILD_USER Permission
- "Add User" button is hidden
- Cannot create new staff members

#### With EDIT_CHILD_USER Permission
- Can see Edit button (pencil icon) for each user
- Can modify staff member details
- Can update user information

#### Without EDIT_CHILD_USER Permission
- Edit button is hidden
- Cannot modify staff details

#### With DELETE_CHILD_USER Permission
- Can see Delete button (trash icon) for each user
- Can remove staff members
- Can delete user accounts

#### Without DELETE_CHILD_USER Permission
- Delete button is hidden
- Cannot remove staff members

#### With VIEW_CHILD_USERS Permission
- Can see View Details button (gear icon)
- Can view comprehensive staff information
- Can access user details modal

#### Without VIEW_CHILD_USERS Permission
- View Details button is hidden
- Cannot access detailed user information

## Permission Matrix

| Action | Permission Required | Main Shop User | Child User (with permission) | Child User (without permission) |
|--------|-------------------|----------------|------------------------------|--------------------------------|
| **Add User** | `CREATE_CHILD_USER` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Edit User** | `EDIT_CHILD_USER` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **View Details** | `VIEW_CHILD_USERS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Delete User** | `DELETE_CHILD_USER` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **View List** | Route-level | ✅ Yes | ✅ Yes (if route allowed) | ✅ Yes (if route allowed) |
| **Search/Filter** | None | ✅ Yes | ✅ Yes | ✅ Yes |

## UI Enhancements

- Added `title` attributes to action buttons for better UX
- Buttons show tooltips on hover explaining their function
- Clean visual separation between different actions
- Icons clearly indicate the action type

## Benefits

1. **Security**: Sensitive staff management actions restricted to authorized users
2. **Clean UI**: Users only see buttons they can actually use
3. **Granular Control**: Separate permissions for create, edit, view, and delete
4. **Audit Trail**: Clear separation of responsibilities
5. **Flexibility**: Different staff members can have different levels of access

## Testing Checklist

- [ ] Main shop user sees all 4 action types (Add, Edit, View, Delete)
- [ ] Child user with CREATE_CHILD_USER sees "Add User" button
- [ ] Child user without CREATE_CHILD_USER doesn't see "Add User" button
- [ ] Child user with EDIT_CHILD_USER sees Edit buttons
- [ ] Child user without EDIT_CHILD_USER doesn't see Edit buttons
- [ ] Child user with VIEW_CHILD_USERS sees View Details buttons
- [ ] Child user without VIEW_CHILD_USERS doesn't see View Details buttons
- [ ] Child user with DELETE_CHILD_USER sees Delete buttons
- [ ] Child user without DELETE_CHILD_USER doesn't see Delete buttons
- [ ] All users can view the list and use search/filters
- [ ] Action buttons work correctly when clicked
- [ ] Modals open and function properly
- [ ] No console errors or broken layouts

## Notes

- Route-level protection already exists via `PermissionRoute` in `routes/index.tsx`
- This implementation adds **component-level** permission checks for action buttons
- The page list view is accessible to all (controlled by route-level permissions)
- Search and filter functionality remains available to all users
- Each action button has a descriptive title for better accessibility

## Related Permissions

These permissions should be configured in the backend and assigned to users/roles:

- `PERMISSIONS.USERS.VIEW_CHILD_USERS` - "View Staff" (route + view details)
- `PERMISSIONS.USERS.CREATE_CHILD_USER` - "Create Staff"
- `PERMISSIONS.USERS.EDIT_CHILD_USER` - "Edit Staff"
- `PERMISSIONS.USERS.DELETE_CHILD_USER` - "Delete Staff"
- `PERMISSIONS.USERS.MANAGE_PERMISSIONS` - "Manage Permissions" (for permission assignment)
