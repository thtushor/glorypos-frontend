# Stock Adjustment Permission - Already Implemented

## Status: ✅ ALREADY EXISTS

The stock adjustment permission has already been defined in the permissions configuration.

## Permission Details

### Permission Key
```typescript
PERMISSIONS.INVENTORY.ADJUST_STOCK = 'adjust_stock'
```

### Location
**File**: `src/config/permissions.ts`
- **Line 29**: Defined in PERMISSIONS.INVENTORY object
- **Line 129**: Documented in PERMISSION_GROUPS array

### Permission Group Entry
```typescript
{
  key: PERMISSIONS.INVENTORY.ADJUST_STOCK,
  label: 'Adjust Stock',
  description: 'Manually adjust product stock levels'
}
```

## Usage

This permission can be used to control access to stock adjustment features:

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const { hasPermission } = usePermission();
const canAdjustStock = hasPermission(PERMISSIONS.INVENTORY.ADJUST_STOCK);

// Use in component
{canAdjustStock && (
  <button onClick={handleStockAdjustment}>
    Adjust Stock
  </button>
)}
```

## Where to Apply

This permission should be applied to:

1. **Stock Adjustment Page/Modal** (if exists)
   - Control access to manual stock adjustment interface
   - Hide/show stock adjustment buttons

2. **Product Edit Form**
   - Control ability to manually change stock quantity
   - May want to disable stock input field without this permission

3. **Inventory Management**
   - Bulk stock adjustment features
   - Stock correction tools

## Notes

- Permission is already configured and ready to use
- Just needs to be applied to relevant UI components
- Backend should also enforce this permission on stock adjustment API endpoints
