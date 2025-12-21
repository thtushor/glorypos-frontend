# Products (Inventory) Permission Implementation

## Overview
Applied permission-based access control to the Products page and AddProduct form to restrict product management actions and sensitive data visibility based on user permissions.

## Files Modified
- **`src/pages/inventory/Products.tsx`**
- **`src/components/shared/AddProduct.tsx`**

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

### 4. **VIEW_COST_PROFIT Permission** (NEW)
- **Permission**: `PERMISSIONS.SALES.VIEW_COST_PROFIT`
- **Controls**: Purchase Price field in AddProduct form
- **Action**: Hides sensitive cost information from unauthorized users

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

### 4. **AddProduct Form - Purchase Price Field**
- **Permission**: `PERMISSIONS.SALES.VIEW_COST_PROFIT`
- **Hidden Field**: Purchase Price input
- **Reason**: Sensitive cost information should only be visible to authorized users
- **Behavior**: 
  - Users **with** permission see the purchase price field and can enter/edit cost data
  - Users **without** permission don't see the purchase price field at all
  - Form can still be submitted without purchase price (will use default value)

## AddProduct Form Permission Control

The AddProduct form (used for both creating and editing products) has an additional layer of permission control:

```typescript
function AddProduct({ productData, onClose }) {
  const { hasPermission } = usePermission();
  const canViewCostProfit = hasPermission(PERMISSIONS.SALES.VIEW_COST_PROFIT);

  return (
    <form>
      {/* Other fields... */}
      
      {/* Purchase Price - Only visible with permission */}
      {canViewCostProfit && (
        <div>
          <label>Purchase Price*</label>
          <input name="purchasePrice" type="number" />
        </div>
      )}
      
      {/* Sales Price - Always visible */}
      <div>
        <label>Sales Price*</label>
        <input name="salesPrice" type="number" />
      </div>
    </form>
  );
}
```

### Why Hide Purchase Price?

1. **Cost Protection**: Purchase price is sensitive business information
2. **Profit Margin Security**: Prevents unauthorized users from seeing profit margins
3. **Competitive Advantage**: Keeps cost structure confidential
4. **Role-Based Access**: Only managers/owners need to see cost data

### Form Behavior Without Permission:

- Purchase price field is completely hidden
- Form layout adjusts automatically
- All other fields remain functional
- Product can still be created/edited (purchase price defaults to 0 or existing value)

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
