# Products (Inventory) Permission Implementation

## Overview
Applied permission-based access control to the Products page to restrict product management actions based on user permissions.

## File Modified
**`src/pages/inventory/Products.tsx`**

## Permissions Applied

### 1. **CREATE_PRODUCT Permission**
- **Permission**: `PERMISSIONS.INVENTORY.CREATE_PRODUCT`
- **Controls**: "Add Product" button
- **Action**: Opens modal to create new products

### 2. **EDIT_PRODUCT Permission**
- **Permission**: `PERMISSIONS.INVENTORY.EDIT_PRODUCT`
- **Controls**: Edit button (pencil icon) on product hover
- **Action**: Opens modal to edit product details

### 3. **DELETE_PRODUCT Permission**
- **Permission**: `PERMISSIONS.INVENTORY.DELETE_PRODUCT`
- **Controls**: Delete button (trash icon) on product hover
- **Action**: Deletes product after confirmation

## What's Always Visible
- Page title "Products"
- Search functionality
- Filter controls (category, brand, unit, gender, model number, price range)
- Product grid with all product information
- View Details button (eye icon) - accessible to all
- Pagination

## Implementation Code

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const Products: React.FC = () => {
  const { hasPermission } = usePermission();

  // Permission checks
  const canCreateProduct = hasPermission(PERMISSIONS.INVENTORY.CREATE_PRODUCT);
  const canEditProduct = hasPermission(PERMISSIONS.INVENTORY.EDIT_PRODUCT);
  const canDeleteProduct = hasPermission(PERMISSIONS.INVENTORY.DELETE_PRODUCT);

  return (
    <div>
      {/* Add Product Button */}
      {canCreateProduct && (
        <button onClick={() => setIsModalOpen(true)}>
          Add Product
        </button>
      )}

      {/* Product Card Actions */}
      <div className=\"action-overlay\">
        <button>View</button> {/* Always visible */}
        {canEditProduct && (
          <button onClick={() => handleEdit(product)}>Edit</button>
        )}
        {canDeleteProduct && (
          <button onClick={() => handleDelete(product.id)}>Delete</button>
        )}
      </div>
    </div>
  );
};
```

## User Experience

### Main Shop Users
- See "Add Product" button
- See Edit and Delete buttons on product hover
- Full product management capabilities
- Can create, edit, and delete products

### Child Users

#### With CREATE_PRODUCT Permission
- Can see "Add Product" button
- Can create new products
- Can add product variants, images, and details

#### Without CREATE_PRODUCT Permission
- **Cannot** see "Add Product" button
- Cannot create new products

#### With EDIT_PRODUCT Permission
- Can see Edit button on product hover
- Can modify existing products
- Can update product details, pricing, stock

#### Without EDIT_PRODUCT Permission
- **Cannot** see Edit button
- Cannot modify products
- View-only access

#### With DELETE_PRODUCT Permission
- Can see Delete button on product hover
- Can remove products from inventory
- Requires confirmation before deletion

#### Without DELETE_PRODUCT Permission
- **Cannot** see Delete button
- Cannot delete products

## Permission Matrix

| Action | Permission Required | Main Shop User | Child User (with permission) | Child User (without permission) |
|--------|-------------------|----------------|------------------------------|--------------------------------|
| **View Products** | Route-level | ✅ Yes | ✅ Yes | ✅ Yes |
| **Search/Filter** | None | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Details** | None | ✅ Yes | ✅ Yes | ✅ Yes |
| **Add Product** | `CREATE_PRODUCT` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Edit Product** | `EDIT_PRODUCT` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Delete Product** | `DELETE_PRODUCT` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Print Barcode** | None | ✅ Yes | ✅ Yes | ✅ Yes |

## Product Card UI

### Hover Overlay Actions:

**With All Permissions:**
```
[View] [Edit] [Delete]
```

**With View Only:**
```
[View]
```

**With View + Edit:**
```
[View] [Edit]
```

**With View + Delete:**
```
[View] [Delete]
```

## Benefits

1. **Granular Control**: Separate permissions for create, edit, and delete operations
2. **Data Protection**: Prevents unauthorized modifications to product inventory
3. **Clean UI**: Users only see actions they're authorized to perform
4. **Flexible Access**: Different staff can have different levels of product management access
5. **Audit Trail**: Clear separation between viewers and managers

## Features Controlled

### 1. **Add Product**
- Opens comprehensive product form
- Allows adding:
  - Basic info (name, SKU, description)
  - Category, brand, unit
  - Pricing (purchase price, sales price, VAT)
  - Stock quantity
  - Product images
  - Variants (color, size)
  - Discount settings

### 2. **Edit Product**
- Opens same form with pre-filled data
- Allows updating all product fields
- Maintains product history

### 3. **Delete Product**
- Shows confirmation dialog
- Permanently removes product
- Invalidates product queries

## Testing Checklist

- [ ] Main shop user sees "Add Product" button
- [ ] Main shop user sees Edit and Delete buttons on hover
- [ ] Child user with CREATE_PRODUCT sees "Add Product" button
- [ ] Child user without CREATE_PRODUCT doesn't see "Add Product" button
- [ ] Child user with EDIT_PRODUCT sees Edit button on hover
- [ ] Child user without EDIT_PRODUCT doesn't see Edit button
- [ ] Child user with DELETE_PRODUCT sees Delete button on hover
- [ ] Child user without DELETE_PRODUCT doesn't see Delete button
- [ ] View Details button is always visible to all users
- [ ] All users can search and filter products
- [ ] Product grid displays correctly with/without action buttons
- [ ] Add/Edit product modal works correctly
- [ ] Delete confirmation works properly
- [ ] No console errors or broken layouts

## Notes

- Route-level protection already exists via `PermissionRoute` in `routes/index.tsx`
- This implementation adds **component-level** permission checks for action buttons
- The "View Details" button is intentionally left without permission check (accessible to all)
- Product list view is accessible to all (controlled by route-level permissions)
- Search and filter functionality remains available to all users
- Barcode printing is available to all users who can view products

## Related Permissions

These permissions should be configured in the backend and assigned to users/roles:

- `PERMISSIONS.INVENTORY.VIEW_PRODUCTS` - "View Products" (route-level access)
- `PERMISSIONS.INVENTORY.CREATE_PRODUCT` - "Create Product"
- `PERMISSIONS.INVENTORY.EDIT_PRODUCT` - "Edit Product"
- `PERMISSIONS.INVENTORY.DELETE_PRODUCT` - "Delete Product"

## Future Enhancements

Potential future improvements:
- Add bulk edit/delete functionality with appropriate permissions
- Add import/export products with permission control
- Add product duplication feature
- Add stock adjustment permissions
- Add price change history with permission control
