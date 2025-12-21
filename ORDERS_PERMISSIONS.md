# Orders Page Permission Implementation

## Overview
Applied permission-based access control to the Orders page to restrict viewing of sensitive financial data and control order editing actions.

## File Modified
**`src/pages/sales/Orders.tsx`**

## Permissions Applied

### 1. **VIEW_COST_PROFIT Permission**
- **Permission**: `PERMISSIONS.SALES.VIEW_COST_PROFIT`
- **Controls**: Financial data columns
- **Hidden Elements**:
  - Total Cost column (header & body)
  - Commission column (header & body)
  - Profit/Loss column (header & body)

### 2. **EDIT_ORDER Permission**
- **Permission**: `PERMISSIONS.SALES.EDIT_ORDER`
- **Controls**: "Adjust Order" button (edit icon)
- **Behavior**: 
  - Only shown for non-completed orders
  - Allows editing/adjusting order details

## What's Always Visible
- Order Number
- Customer information
- Date
- Seller information
- Order Status
- Payment Method
- Total Sales column
- View Order button (eye icon)
- Search and filter controls
- Pagination

## Implementation Code

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const Orders: React.FC = () => {
  const { hasPermission } = usePermission();

  // Permission checks
  const canViewCostProfit = hasPermission(PERMISSIONS.SALES.VIEW_COST_PROFIT);
  const canEditOrder = hasPermission(PERMISSIONS.SALES.EDIT_ORDER);

  return (
    <table>
      <thead>
        <tr>
          <th>Total Sales</th>
          {canViewCostProfit && (
            <>
              <th>Total Cost</th>
              <th>Commission</th>
              <th>Profit/Loss</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr>
            <td>{order.totalSales}</td>
            {canViewCostProfit && (
              <>
                <td>{order.totalCost}</td>
                <td>{order.commission}</td>
                <td>{order.profit}</td>
              </>
            )}
            <td>
              <button>View</button>
              {canEditOrder && order.status !== "completed" && (
                <button>Edit</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

## User Experience

### Main Shop Users
- See all columns including cost, commission, and profit/loss
- Can edit non-completed orders
- Full visibility into financial performance

### Child Users

#### With VIEW_COST_PROFIT Permission
- Can see Total Cost column
- Can see Commission column
- Can see Profit/Loss column
- Full financial visibility like main shop users

#### Without VIEW_COST_PROFIT Permission
- **Cannot** see Total Cost column
- **Cannot** see Commission column
- **Cannot** see Profit/Loss column
- Can still see Total Sales and all other order information
- Cleaner table with fewer columns

#### With EDIT_ORDER Permission
- Can see "Adjust Order" button for non-completed orders
- Can modify order details
- Can update order items and pricing

#### Without EDIT_ORDER Permission
- **Cannot** see "Adjust Order" button
- Cannot modify orders
- View-only access to order list

## Permission Matrix

| Feature | Permission Required | Main Shop User | Child User (with permission) | Child User (without permission) |
|---------|-------------------|----------------|------------------------------|--------------------------------|
| **View Orders** | Route-level | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Total Sales** | None | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Cost** | `VIEW_COST_PROFIT` | ✅ Yes | ✅ Yes | ❌ No (column hidden) |
| **View Commission** | `VIEW_COST_PROFIT` | ✅ Yes | ✅ Yes | ❌ No (column hidden) |
| **View Profit/Loss** | `VIEW_COST_PROFIT` | ✅ Yes | ✅ Yes | ❌ No (column hidden) |
| **View Order Details** | None | ✅ Yes | ✅ Yes | ✅ Yes |
| **Edit Order** | `EDIT_ORDER` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **Search/Filter** | None | ✅ Yes | ✅ Yes | ✅ Yes |

## Benefits

1. **Financial Privacy**: Sensitive cost and profit data hidden from unauthorized users
2. **Clean UI**: Users without permission see a simpler, focused table
3. **Granular Control**: Separate permissions for viewing financials vs editing orders
4. **Consistent UX**: Follows same pattern as ProductStatementPage
5. **Flexible Access**: Different staff can have different visibility levels

## Visual Changes

### With VIEW_COST_PROFIT Permission:
```
| Order # | Customer | Date | Status | Total Sales | Total Cost | Commission | Profit/Loss | Actions |
```

### Without VIEW_COST_PROFIT Permission:
```
| Order # | Customer | Date | Status | Total Sales | Actions |
```

The table is cleaner and less overwhelming for users who don't need financial details.

## Testing Checklist

- [ ] Main shop user sees all columns (Sales, Cost, Commission, Profit/Loss)
- [ ] Main shop user sees Edit button for non-completed orders
- [ ] Child user with VIEW_COST_PROFIT sees cost/commission/profit columns
- [ ] Child user without VIEW_COST_PROFIT doesn't see cost/commission/profit columns
- [ ] Child user with EDIT_ORDER sees Edit button
- [ ] Child user without EDIT_ORDER doesn't see Edit button
- [ ] Edit button only shows for non-completed orders
- [ ] View button is always visible to all users
- [ ] Table layout remains clean with hidden columns
- [ ] No console errors or broken layouts
- [ ] Pagination works correctly
- [ ] Search and filters work correctly

## Notes

- Route-level protection already exists via `PermissionRoute` in `routes/index.tsx`
- This implementation adds **component-level** permission checks for columns and actions
- The "View Order" button is intentionally left without permission check (accessible to all)
- Edit button has dual conditions: permission AND order status (not completed)
- Column hiding keeps the table layout clean and focused

## Related Permissions

These permissions should be configured in the backend and assigned to users/roles:

- `PERMISSIONS.SALES.VIEW_ORDERS` - Route-level access (already implemented)
- `PERMISSIONS.SALES.VIEW_COST_PROFIT` - View financial columns
- `PERMISSIONS.SALES.EDIT_ORDER` - Edit/adjust orders
- `PERMISSIONS.SALES.DELETE_ORDER` - Delete orders (not yet implemented in UI)
