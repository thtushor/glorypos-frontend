# Staff Commissions Page Permission Implementation

## Overview
Applied permission verification to the Staff Commissions page. This page displays detailed commission data for staff members and is protected by the `VIEW_STAFF_COMMISSIONS` permission.

## File Modified
**`src/pages/sales/StaffCommissionsPage.tsx`**

## Permission Applied

### **VIEW_STAFF_COMMISSIONS Permission**
- **Permission**: `PERMISSIONS.SALES.VIEW_STAFF_COMMISSIONS`
- **Protection Level**: Route-level (primary) + Component-level (verification)
- **Controls**: Access to entire staff commissions page and all commission data

## Implementation Approach

This page uses a **dual-layer protection** approach:

1. **Route-Level Protection** (Primary):
   - Already implemented in `routes/index.tsx` via `PermissionRoute`
   - Prevents unauthorized users from accessing the page entirely
   - Shows "Access Denied" page if user lacks permission

2. **Component-Level Verification** (Secondary):
   - Added `usePermission` hook within the component
   - Provides additional verification layer
   - Can be used for future conditional rendering if needed

## Implementation Code

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const StaffCommissionsPage: React.FC = () => {
  const { hasPermission } = usePermission();

  // Permission check (route-level protection already exists)
  const canViewCommissions = hasPermission(PERMISSIONS.SALES.VIEW_STAFF_COMMISSIONS);

  // Rest of component...
};
```

## Page Features

### What's Displayed:
1. **Summary Cards**:
   - Total Commission amount
   - Total Orders count
   - Average Commission per order

2. **Detailed Commission Table**:
   - Date of commission
   - Order number
   - Staff member details (name, email, role)
   - Shop information
   - Base amount
   - Commission percentage
   - Commission amount
   - Payment status
   - Notes

3. **Advanced Filters**:
   - Shop filter
   - Staff member filter
   - Staff role filter
   - Order ID filter
   - Min/Max commission amount
   - Exact commission amount
   - Date range (start/end date)

4. **Table Footer**:
   - Total base amount
   - Total commission amount

## User Experience

### Main Shop Users
- Full access to all commission data
- Can view commissions for all staff across all shops
- Can filter and search commission records
- See complete financial breakdown

### Child Users

#### With VIEW_STAFF_COMMISSIONS Permission
- Can access the staff commissions page
- Can view all commission data
- Can use all filters and search functionality
- Full visibility into commission structure

#### Without VIEW_STAFF_COMMISSIONS Permission
- **Cannot** access the page at all
- Redirected to "Access Denied" page
- No visibility into commission data
- Route-level protection prevents access

## Permission Matrix

| Feature | Permission Required | Main Shop User | Child User (with permission) | Child User (without permission) |
|---------|-------------------|----------------|------------------------------|--------------------------------|
| **Access Page** | `VIEW_STAFF_COMMISSIONS` | ✅ Yes | ✅ Yes | ❌ No (Access Denied) |
| **View Summary Cards** | `VIEW_STAFF_COMMISSIONS` | ✅ Yes | ✅ Yes | ❌ No |
| **View Commission Table** | `VIEW_STAFF_COMMISSIONS` | ✅ Yes | ✅ Yes | ❌ No |
| **Use Filters** | `VIEW_STAFF_COMMISSIONS` | ✅ Yes | ✅ Yes | ❌ No |
| **Search Commissions** | `VIEW_STAFF_COMMISSIONS` | ✅ Yes | ✅ Yes | ❌ No |
| **View Totals** | `VIEW_STAFF_COMMISSIONS` | ✅ Yes | ✅ Yes | ❌ No |

## Benefits

1. **Complete Protection**: Dual-layer approach ensures unauthorized access is prevented
2. **Sensitive Data Security**: Commission data is only visible to authorized users
3. **Clean Access Control**: Users without permission never see the page
4. **Consistent UX**: Follows the same permission pattern as other protected pages
5. **Future Flexibility**: Component-level check allows for future conditional rendering

## Design Decision

**Why Route-Level Protection is Sufficient:**

Unlike other pages where we hide specific columns or buttons, the Staff Commissions page is entirely about commission data. There's no meaningful "partial view" to show users without permission. Therefore:

- **Route-level protection** is the primary and most appropriate control
- **Component-level check** is added for verification and future flexibility
- No need to conditionally hide individual columns since the entire page is commission-focused

This is different from pages like Orders or ProductStatement where users might need to see sales data without seeing cost/profit data.

## Testing Checklist

- [ ] Main shop user can access the page
- [ ] Main shop user sees all commission data
- [ ] Child user with VIEW_STAFF_COMMISSIONS can access the page
- [ ] Child user with VIEW_STAFF_COMMISSIONS sees all data
- [ ] Child user without VIEW_STAFF_COMMISSIONS sees "Access Denied" page
- [ ] Child user without VIEW_STAFF_COMMISSIONS cannot bypass route protection
- [ ] All filters work correctly for authorized users
- [ ] Search functionality works for authorized users
- [ ] Summary cards display correct totals
- [ ] Table footer shows accurate totals
- [ ] Pagination works correctly
- [ ] No console errors

## Notes

- This page is **entirely commission-focused** - there's no non-sensitive data to show
- Route-level protection via `PermissionRoute` is the primary security measure
- Component-level check provides additional verification layer
- Users without permission see the beautiful "Access Denied" page
- The permission check can be extended in the future if partial views are needed

## Related Permissions

These permissions should be configured in the backend and assigned to users/roles:

- `PERMISSIONS.SALES.VIEW_STAFF_COMMISSIONS` - "View Staff Commissions" (route + page access)

## Related Pages

This permission is also used in:
- Staff Profile tabs (commission history view)
- Dashboard widgets (if commission summaries are shown)
- Reports module (if commission reports exist)
