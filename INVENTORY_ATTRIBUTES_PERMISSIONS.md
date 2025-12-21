# Inventory Attributes Permission Implementation

## Overview
Applied permission-based access control to all inventory attribute management pages (Categories, Brands, Units, Sizes, Colors) to restrict CRUD operations based on user permissions.

## Files Modified
1. **`src/pages/inventory/Categories.tsx`**
2. **`src/pages/inventory/Brands.tsx`**
3. **`src/pages/inventory/Units.tsx`**
4. **`src/pages/inventory/Sizes.tsx`**
5. **`src/pages/inventory/Colors.tsx`**

## Permissions Applied

### 1. **MANAGE_CATEGORIES**
- **Permission**: `PERMISSIONS.INVENTORY.MANAGE_CATEGORIES`
- **Controls**: Add, Edit, Delete category actions
- **Page**: Categories

### 2. **MANAGE_BRANDS**
- **Permission**: `PERMISSIONS.INVENTORY.MANAGE_BRANDS`
- **Controls**: Add, Edit, Delete brand actions
- **Page**: Brands

### 3. **MANAGE_UNITS**
- **Permission**: `PERMISSIONS.INVENTORY.MANAGE_UNITS`
- **Controls**: Add, Edit, Delete unit actions
- **Page**: Units

### 4. **MANAGE_SIZES**
- **Permission**: `PERMISSIONS.INVENTORY.MANAGE_SIZES`
- **Controls**: Add, Edit, Delete size actions
- **Page**: Sizes

### 5. **MANAGE_COLORS**
- **Permission**: `PERMISSIONS.INVENTORY.MANAGE_COLORS`
- **Controls**: Add, Edit, Delete color actions
- **Page**: Colors

## What's Always Visible
- Page title and description
- Search functionality
- Filter controls (search key, shop filter)
- Data table with all attribute information
- Pagination (if applicable)

## Implementation Pattern

All 5 pages follow the same implementation pattern:

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const AttributePage = () => {
  const { hasPermission } = usePermission();
  const canManageAttribute = hasPermission(PERMISSIONS.INVENTORY.MANAGE_ATTRIBUTE);

  return (
    <div>
      {/* Add Button */}
      {canManageAttribute && (
        <button onClick={() => setIsModalOpen(true)}>
          Add Attribute
        </button>
      )}

      {/* Table with Edit/Delete Buttons */}
      <table>
        <tbody>
          {attributes.map(attr => (
            <tr>
              <td>
                {canManageAttribute && (
                  <>
                    <button onClick={() => handleEdit(attr)}>Edit</button>
                    <button onClick={() => handleDelete(attr.id)}>Delete</button>
                  </>
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

## User Experience

### Main Shop Users
- See "Add [Attribute]" button
- See Edit and Delete buttons for each row
- Full CRUD capabilities for all attributes
- Can create, modify, and remove attributes

### Child Users

#### With MANAGE Permission
- Can see "Add [Attribute]" button
- Can see Edit and Delete buttons
- Full CRUD capabilities
- Same access as main shop users

#### Without MANAGE Permission
- **Cannot** see "Add [Attribute]" button
- **Cannot** see Edit and Delete buttons
- View-only access to attribute list
- Can search and filter data
- Cannot modify any attributes

## Permission Matrix

| Action | Permission Required | Main Shop User | Child User (with permission) | Child User (without permission) |
|--------|-------------------|----------------|------------------------------|--------------------------------|
| **View Categories** | Route-level | ✅ Yes | ✅ Yes | ✅ Yes |
| **Add Category** | `MANAGE_CATEGORIES` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Edit Category** | `MANAGE_CATEGORIES` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Delete Category** | `MANAGE_CATEGORIES` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **View Brands** | Route-level | ✅ Yes | ✅ Yes | ✅ Yes |
| **Add Brand** | `MANAGE_BRANDS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Edit Brand** | `MANAGE_BRANDS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Delete Brand** | `MANAGE_BRANDS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **View Units** | Route-level | ✅ Yes | ✅ Yes | ✅ Yes |
| **Add Unit** | `MANAGE_UNITS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Edit Unit** | `MANAGE_UNITS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Delete Unit** | `MANAGE_UNITS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **View Sizes** | Route-level | ✅ Yes | ✅ Yes | ✅ Yes |
| **Add Size** | `MANAGE_SIZES` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Edit Size** | `MANAGE_SIZES` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Delete Size** | `MANAGE_SIZES` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **View Colors** | Route-level | ✅ Yes | ✅ Yes | ✅ Yes |
| **Add Color** | `MANAGE_COLORS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Edit Color** | `MANAGE_COLORS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Delete Color** | `MANAGE_COLORS` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |

## Table UI

### With Permission:
```
Name          Description    Status    Actions
Category 1    Description    Active    [Edit] [Delete]
Category 2    Description    Active    [Edit] [Delete]
```

### Without Permission:
```
Name          Description    Status    Actions
Category 1    Description    Active    (empty - no buttons)
Category 2    Description    Active    (empty - no buttons)
```

## Benefits

1. **Granular Control**: Separate permissions for each attribute type
2. **Data Protection**: Prevents unauthorized modifications to product attributes
3. **Clean UI**: Users only see actions they're authorized to perform
4. **Flexible Access**: Different staff can have different attribute management permissions
5. **Consistent Pattern**: Same implementation across all 5 pages

## Features Controlled

### 1. **Add Attribute**
- Opens modal form
- Allows creating new attribute
- Validates required fields
- Saves to database

### 2. **Edit Attribute**
- Opens modal with pre-filled data
- Allows updating attribute details
- Maintains attribute history

### 3. **Delete Attribute**
- Shows confirmation dialog
- Permanently removes attribute
- Invalidates related queries

## Testing Checklist

### Categories
- [ ] Main shop user sees "Add Category" button
- [ ] Main shop user sees Edit/Delete buttons
- [ ] Child user with MANAGE_CATEGORIES sees all buttons
- [ ] Child user without MANAGE_CATEGORIES sees no action buttons
- [ ] View/search/filter works for all users

### Brands
- [ ] Main shop user sees "Add Brand" button
- [ ] Main shop user sees Edit/Delete buttons
- [ ] Child user with MANAGE_BRANDS sees all buttons
- [ ] Child user without MANAGE_BRANDS sees no action buttons
- [ ] View/search/filter works for all users

### Units
- [ ] Main shop user sees "Add Unit" button
- [ ] Main shop user sees Edit/Delete buttons
- [ ] Child user with MANAGE_UNITS sees all buttons
- [ ] Child user without MANAGE_UNITS sees no action buttons
- [ ] View/search/filter works for all users

### Sizes
- [ ] Main shop user sees "Add Size" button
- [ ] Main shop user sees Edit/Delete buttons
- [ ] Child user with MANAGE_SIZES sees all buttons
- [ ] Child user without MANAGE_SIZES sees no action buttons
- [ ] View/search/filter works for all users

### Colors
- [ ] Main shop user sees "Add Color" button
- [ ] Main shop user sees Edit/Delete buttons
- [ ] Child user with MANAGE_COLORS sees all buttons
- [ ] Child user without MANAGE_COLORS sees no action buttons
- [ ] View/search/filter works for all users
- [ ] Color picker works correctly

### General
- [ ] No console errors
- [ ] Tables display correctly with/without buttons
- [ ] Modals open and close properly
- [ ] CRUD operations work correctly
- [ ] Confirmation dialogs appear for delete actions

## Notes

- Route-level protection already exists via `PermissionRoute` in `routes/index.tsx`
- This implementation adds **component-level** permission checks for action buttons
- All pages use the same permission pattern for consistency
- Search and filter functionality remains available to all users
- Attribute data is visible to all (controlled by route-level permissions)

## Related Permissions

These permissions should be configured in the backend and assigned to users/roles:

- `PERMISSIONS.INVENTORY.VIEW_CATEGORIES` - View categories list (route-level)
- `PERMISSIONS.INVENTORY.MANAGE_CATEGORIES` - Create/Edit/Delete categories
- `PERMISSIONS.INVENTORY.VIEW_BRANDS` - View brands list (route-level)
- `PERMISSIONS.INVENTORY.MANAGE_BRANDS` - Create/Edit/Delete brands
- `PERMISSIONS.INVENTORY.VIEW_UNITS` - View units list (route-level)
- `PERMISSIONS.INVENTORY.MANAGE_UNITS` - Create/Edit/Delete units
- `PERMISSIONS.INVENTORY.VIEW_SIZES` - View sizes list (route-level)
- `PERMISSIONS.INVENTORY.MANAGE_SIZES` - Create/Edit/Delete sizes
- `PERMISSIONS.INVENTORY.VIEW_COLORS` - View colors list (route-level)
- `PERMISSIONS.INVENTORY.MANAGE_COLORS` - Create/Edit/Delete colors

## Use Cases

### Scenario 1: Sales Staff
- **Permissions**: VIEW_INVENTORY (route-level only)
- **Can**: View all product attributes
- **Cannot**: Add, edit, or delete any attributes
- **Benefit**: Can see product information but cannot modify master data

### Scenario 2: Inventory Clerk
- **Permissions**: MANAGE_CATEGORIES, MANAGE_BRANDS, MANAGE_UNITS
- **Can**: Manage basic product attributes
- **Cannot**: Manage sizes and colors (if not granted)
- **Benefit**: Can maintain product categorization without full inventory access

### Scenario 3: Product Manager
- **Permissions**: All MANAGE permissions
- **Can**: Full CRUD on all product attributes
- **Benefit**: Complete control over product attribute management

## Future Enhancements

Potential improvements:
- Add bulk import/export for attributes
- Add attribute usage statistics (how many products use each attribute)
- Add inactive attribute cleanup tool
- Add attribute merge functionality
- Add attribute history/audit log
