# POS Permission Implementation Summary

## Overview
Applied permission-based access control to the POS (Point of Sale) system to restrict certain actions based on user permissions.

## Permissions Applied

### 1. **CREATE_ORDER Permission**
- **Permission**: `PERMISSIONS.SALES.CREATE_ORDER`
- **Applies to**: Payment button
- **Behavior**: 
  - Users **without** this permission cannot process payments/create orders
  - Payment button is disabled if user lacks permission
  - Prevents unauthorized order creation

### 2. **EDIT_ORDER Permission**
- **Permission**: `PERMISSIONS.SALES.EDIT_ORDER`
- **Applies to**: 
  - Sales Price input fields (per cart item)
  - Discount input fields (per cart item)
  - Discount type selector (percentage/amount)
- **Behavior**:
  - Users **without** this permission cannot modify:
    - Item sales prices
    - Item discounts
    - Discount types
  - Input fields are disabled (read-only) if user lacks permission
  - Prevents unauthorized price/discount modifications

## Implementation Details

### File Modified
**`src/components/shared/ShoppingCart.tsx`**

### Changes Made

1. **Added Imports**:
   ```typescript
   import { usePermission } from "@/hooks/usePermission";
   import { PERMISSIONS } from "@/config/permissions";
   ```

2. **Added Permission Checks**:
   ```typescript
   const { hasPermission } = usePermission();
   
   const canCreateOrder = hasPermission(PERMISSIONS.SALES.CREATE_ORDER);
   const canEditOrder = hasPermission(PERMISSIONS.SALES.EDIT_ORDER);
   ```

3. **Applied to UI Elements**:
   
   **Sales Price Input**:
   ```typescript
   <input
     type="text"
     disabled={!canEditOrder}
     // ... other props
     className="... disabled:bg-gray-100 disabled:cursor-not-allowed"
   />
   ```

   **Discount Input**:
   ```typescript
   <input
     type="text"
     disabled={!canEditOrder}
     // ... other props
     className="... disabled:bg-gray-100 disabled:cursor-not-allowed"
   />
   ```

   **Discount Type Selector**:
   ```typescript
   <select
     disabled={!canEditOrder}
     // ... other props
     className="... disabled:bg-gray-100 disabled:cursor-not-allowed"
   />
   ```

   **Payment Button**:
   ```typescript
   <button
     disabled={
       !canCreateOrder ||
       createOrderMutation.isPending ||
       selectedStaffId === null ||
       cart.length === 0
     }
     // ... other props
   />
   ```

## User Experience

### Main Shop Users
- Have **all permissions** automatically
- Can create orders, edit prices, and modify discounts freely
- No restrictions in POS

### Child Users

#### With CREATE_ORDER Permission
- Can process payments and create orders
- Payment button is enabled

#### Without CREATE_ORDER Permission
- **Cannot** process payments or create orders
- Payment button is disabled
- Can still browse products and add to cart

#### With EDIT_ORDER Permission
- Can modify sales prices for cart items
- Can adjust discounts (amount and type)
- Full control over pricing in cart

#### Without EDIT_ORDER Permission
- **Cannot** modify sales prices
- **Cannot** adjust discounts
- Price and discount fields are read-only (grayed out)
- Can still view prices and add items to cart

## Visual Indicators

- **Disabled inputs** have:
  - Gray background (`bg-gray-100`)
  - Not-allowed cursor (`cursor-not-allowed`)
  - Visual feedback that the field is read-only

- **Disabled button** has:
  - Reduced opacity (`opacity-50`)
  - Not-allowed cursor
  - Clear visual indication it cannot be clicked

## Permission Flow

```
User opens POS
    ↓
System checks permissions
    ↓
┌─────────────────────────────────┐
│ Main Shop User?                 │
│ (user.child is empty)           │
└─────────────────────────────────┘
         │
    Yes  │  No
    ↓    │    ↓
All      │    Check user.child.permissions[]
Access   │         ↓
         │    ┌────────────────────────┐
         │    │ Has CREATE_ORDER?      │
         │    └────────────────────────┘
         │         Yes │ No
         │         ↓   │   ↓
         │    Enable   │   Disable
         │    Payment  │   Payment
         │    Button   │   Button
         │         ↓   │   ↓
         │    ┌────────────────────────┐
         │    │ Has EDIT_ORDER?        │
         │    └────────────────────────┘
         │         Yes │ No
         │         ↓   │   ↓
         │    Enable   │   Disable
         │    Price/   │   Price/
         │    Discount │   Discount
         │    Editing  │   Editing
         └─────────────────────────────┘
```

## Testing Checklist

- [ ] Main shop user can create orders
- [ ] Main shop user can edit sales prices
- [ ] Main shop user can edit discounts
- [ ] Child user with CREATE_ORDER can process payments
- [ ] Child user without CREATE_ORDER sees disabled payment button
- [ ] Child user with EDIT_ORDER can modify prices
- [ ] Child user without EDIT_ORDER sees disabled price inputs
- [ ] Child user without EDIT_ORDER sees disabled discount inputs
- [ ] Disabled inputs show proper visual feedback (gray background)
- [ ] Tooltip or message explains why button/input is disabled (optional enhancement)

## Future Enhancements

1. **Add Tooltips**: Show why a button/input is disabled
   ```typescript
   {!canCreateOrder && (
     <p className="text-xs text-red-500 mt-1">
       You don't have permission to create orders
     </p>
   )}
   ```

2. **Additional Permissions**:
   - `DELETE_ORDER` - for removing items from cart
   - `APPLY_GLOBAL_DISCOUNT` - for cart-wide discounts
   - `APPLY_TAX` - for tax adjustments

3. **Audit Logging**: Track who modified prices/discounts

4. **Permission-based Price Limits**: 
   - Allow discounts only up to certain percentage
   - Restrict price changes beyond certain range

## Notes

- Route-level protection already exists via `PermissionRoute` in `routes/index.tsx`
- This implementation adds **component-level** permission checks
- Provides granular control within the POS interface
- Maintains good UX by showing disabled state rather than hiding elements
