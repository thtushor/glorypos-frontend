# Staff Profile & Product Statement Permissions

## Overview
Applied permission-based access control to the Staff Profile page and Product Statement component to restrict editing capabilities and financial data visibility.

## Files Modified
1. **`src/pages/profile/StaffProfilePage.tsx`**
2. **`src/components/ProductStatement.tsx`**

---

## 1. Staff Profile Page Permissions

### Permissions Applied

#### **EDIT_CHILD_USER**
- **Permission**: `PERMISSIONS.USERS.EDIT_CHILD_USER`
- **Controls**: Edit Profile button and form editing capability
- **Page**: Staff Profile Page

#### **MANAGE_PERMISSIONS**
- **Permission**: `PERMISSIONS.USERS.MANAGE_PERMISSIONS`
- **Controls**: Permissions Management section visibility
- **Page**: Staff Profile Page

### What's Always Visible
- Staff profile header with photo, name, role, status
- Financial overview cards (Total Earned, Total Commission, Leave Days, Outstanding Advance)
- Navigation tabs (Profile, Salary History, Advance Salary History, Promotion History, Leave History, Orders, Product Statement, Staff Commissions)
- Personal information fields (view-only without permission)
- Parent business information
- Current month salary details

### Implementation

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const StaffProfilePage = () => {
  const { hasPermission } = usePermission();
  const canEditChildUsers = hasPermission(PERMISSIONS.USERS.EDIT_CHILD_USER);
  const canManagePermissions = hasPermission(PERMISSIONS.USERS.MANAGE_PERMISSIONS);

  return (
    <div>
      {/* Edit Profile Button */}
      {canEditChildUsers && (
        <button onClick={() => setIsEditing(true)}>
          Edit Profile
        </button>
      )}

      {/* Permissions Management Section */}
      {canManagePermissions && (
        <div>
          <h3>Permissions Management</h3>
          {/* Permission groups and checkboxes */}
        </div>
      )}
    </div>
  );
};
```

### User Experience

#### With EDIT_CHILD_USER Permission
- **Can See**: "Edit Profile" button
- **Can Do**: 
  - Edit staff name, phone, role, status
  - Change required daily hours
  - Upload profile image
  - Save changes to profile
- **Cannot See**: Edit button is hidden without permission

#### With MANAGE_PERMISSIONS Permission
- **Can See**: Entire "Permissions Management" section
- **Can Do**:
  - View all permission groups
  - Toggle individual permissions on/off
  - Apply permission templates (Admin, Manager, Cashier)
  - Select/deselect all permissions in a group
  - Clear all permissions
- **Cannot See**: Permissions section is completely hidden without permission

#### Without Permissions
- **Can See**: All profile information (read-only)
- **Cannot**: Edit any information or manage permissions
- **Experience**: View-only access to staff profile

### Permission Matrix

| Action | Permission Required | Main Shop User | Child User (with permission) | Child User (without permission) |
|--------|-------------------|----------------|------------------------------|--------------------------------|
| **View Profile** | Route-level | ✅ Yes | ✅ Yes | ✅ Yes |
| **Edit Profile** | `EDIT_CHILD_USER` | ✅ Yes | ✅ Yes | ❌ No (button hidden) |
| **View Permissions** | `MANAGE_PERMISSIONS` | ✅ Yes | ✅ Yes | ❌ No (section hidden) |
| **Edit Permissions** | `MANAGE_PERMISSIONS` | ✅ Yes | ✅ Yes | ❌ No (section hidden) |

---

## 2. Product Statement Component Permissions

### Permission Applied

#### **VIEW_COST_PROFIT**
- **Permission**: `PERMISSIONS.SALES.VIEW_COST_PROFIT`
- **Controls**: Cost price and profit data visibility
- **Component**: ProductStatement modal

### What's Always Visible
- Product Statement modal
- Total Sales summary card
- Total Tax summary card
- Statement table with:
  - Date, Order #, Product, Sold By, Commission
  - Quantity, Unit Price, Sales Price
- Print functionality

### What's Hidden Without Permission
- **Summary Cards**:
  - Total Profit card
  - Total Loss card
- **Table Columns**:
  - Cost Price column
  - Profit column
- **Footer Totals**:
  - Total Cost
  - Total Profit

### Implementation

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const ProductStatement = ({ isOpen, onClose, ...props }) => {
  const { hasPermission } = usePermission();
  const canViewCostAndProfit = hasPermission(PERMISSIONS.SALES.VIEW_COST_PROFIT);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Summary Cards */}
      <div className={`grid ${canViewCostAndProfit ? 'grid-cols-4' : 'grid-cols-2'} gap-4`}>
        <div>Total Sales</div>
        {canViewCostAndProfit && (
          <>
            <div>Total Profit</div>
            <div>Total Loss</div>
          </>
        )}
        <div>Total Tax</div>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Qty</th>
            {canViewCostAndProfit && <th>Cost Price</th>}
            <th>Unit Price</th>
            <th>Sales Price</th>
            {canViewCostAndProfit && <th>Profit</th>}
          </tr>
        </thead>
        <tbody>
          {statements.map(item => (
            <tr>
              <td>{item.quantity}</td>
              {canViewCostAndProfit && <td>{cost}</td>}
              <td>{unitPrice}</td>
              <td>{salesPrice}</td>
              {canViewCostAndProfit && <td>{profit}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
};
```

### User Experience

#### With VIEW_COST_PROFIT Permission
```
Summary Cards:
[Total Sales] [Total Profit] [Total Loss] [Total Tax]

Table Columns:
Date | Order # | Product | Sold By | Commission | Qty | Cost Price | Unit Price | Sales Price | Profit
```

#### Without VIEW_COST_PROFIT Permission
```
Summary Cards:
[Total Sales] [Total Tax]

Table Columns:
Date | Order # | Product | Sold By | Commission | Qty | Unit Price | Sales Price
```

### Permission Matrix

| Data | Permission Required | With Permission | Without Permission |
|------|-------------------|----------------|-------------------|
| **Total Sales** | None | ✅ Visible | ✅ Visible |
| **Total Profit** | `VIEW_COST_PROFIT` | ✅ Visible | ❌ Hidden |
| **Total Loss** | `VIEW_COST_PROFIT` | ✅ Visible | ❌ Hidden |
| **Total Tax** | None | ✅ Visible | ✅ Visible |
| **Cost Price Column** | `VIEW_COST_PROFIT` | ✅ Visible | ❌ Hidden |
| **Profit Column** | `VIEW_COST_PROFIT` | ✅ Visible | ❌ Hidden |
| **Unit Price** | None | ✅ Visible | ✅ Visible |
| **Sales Price** | None | ✅ Visible | ✅ Visible |

---

## Benefits

### Staff Profile Page
1. **Controlled Editing**: Only authorized users can modify staff profiles
2. **Permission Security**: Prevents unauthorized permission changes
3. **Granular Access**: Separate permissions for profile editing vs permission management
4. **Clean UI**: Hidden buttons for unauthorized actions

### Product Statement
1. **Financial Privacy**: Hides sensitive cost and profit data from unauthorized users
2. **Flexible Access**: Sales staff can see sales data without seeing margins
3. **Consistent Experience**: Same permission logic as main Product Statement page
4. **Print-Friendly**: Permission controls apply to printed statements too

## Testing Checklist

### Staff Profile Page
- [ ] Main shop user sees "Edit Profile" button
- [ ] Main shop user sees "Permissions Management" section
- [ ] Child user with EDIT_CHILD_USER sees "Edit Profile" button
- [ ] Child user with MANAGE_PERMISSIONS sees permissions section
- [ ] Child user without EDIT_CHILD_USER does NOT see "Edit Profile" button
- [ ] Child user without MANAGE_PERMISSIONS does NOT see permissions section
- [ ] Edit mode works correctly when enabled
- [ ] Profile updates save successfully
- [ ] Permission changes save successfully

### Product Statement Component
- [ ] User with VIEW_COST_PROFIT sees all 4 summary cards
- [ ] User with VIEW_COST_PROFIT sees Cost Price column
- [ ] User with VIEW_COST_PROFIT sees Profit column
- [ ] User without VIEW_COST_PROFIT sees only 2 summary cards (Sales, Tax)
- [ ] User without VIEW_COST_PROFIT does NOT see Cost Price column
- [ ] User without VIEW_COST_PROFIT does NOT see Profit column
- [ ] Table layout adjusts correctly based on permission
- [ ] Print output respects permission settings
- [ ] No console errors
- [ ] Modal opens and closes correctly

## Notes

- **Staff Profile**: Uses two separate permissions for different aspects of profile management
- **Product Statement**: Reuses the same `VIEW_COST_PROFIT` permission as the main Product Statement page
- Both implementations follow the established permission pattern
- UI elements are conditionally rendered (not just disabled) for cleaner interface
- Backend should also enforce these permissions for security

## Related Permissions

### Staff Profile
- `PERMISSIONS.USERS.VIEW_CHILD_USERS` - View staff profiles (route-level)
- `PERMISSIONS.USERS.EDIT_CHILD_USER` - Edit staff profile information
- `PERMISSIONS.USERS.MANAGE_PERMISSIONS` - Manage staff permissions

### Product Statement
- `PERMISSIONS.SALES.VIEW_SALES` - View sales data (route-level)
- `PERMISSIONS.SALES.VIEW_COST_PROFIT` - View cost and profit data

## Use Cases

### Scenario 1: HR Manager
- **Permissions**: EDIT_CHILD_USER, MANAGE_PERMISSIONS
- **Can**: Edit all staff profiles and manage their permissions
- **Cannot**: N/A (full access)
- **Benefit**: Complete staff management capabilities

### Scenario 2: Team Lead
- **Permissions**: EDIT_CHILD_USER only
- **Can**: Edit staff basic information (name, phone, role)
- **Cannot**: Manage permissions
- **Benefit**: Can update team member details without security risk

### Scenario 3: Sales Staff
- **Permissions**: VIEW_SALES only
- **Can**: View product statements with sales data
- **Cannot**: See cost prices or profit margins
- **Benefit**: Can track sales performance without seeing sensitive financial data

### Scenario 4: Accountant
- **Permissions**: VIEW_COST_PROFIT
- **Can**: View complete financial data including costs and profits
- **Cannot**: Edit staff profiles or permissions
- **Benefit**: Full financial visibility for accounting purposes
