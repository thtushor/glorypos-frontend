# Permission Implementation Plan - Remaining Pages

## Overview
This document outlines the permission implementation strategy for the remaining pages that need permission controls.

## Pages to Implement

### 1. LeaveHistory.tsx
**Expected Actions**:
- Approve leave requests
- Reject leave requests
- View leave details

**Permissions Needed**:
- `PERMISSIONS.PAYROLL.APPROVE_LEAVE` - For approve/reject buttons

**Implementation Strategy**:
- Hide approve/reject buttons if user doesn't have permission
- Keep view functionality accessible to all (route-level protection handles access)

---

### 2. ReleaseHistory.tsx
**Expected Actions**:
- View salary release history
- Possibly edit/delete salary releases
- Export/print salary reports

**Permissions Needed**:
- `PERMISSIONS.PAYROLL.VIEW_SALARY_HISTORY` - Route-level (already done)
- `PERMISSIONS.PAYROLL.RELEASE_SALARY` - For any edit/delete actions

**Implementation Strategy**:
- Hide edit/delete buttons if user doesn't have RELEASE_SALARY permission
- Keep view/filter functionality accessible

---

### 3. AdvanceSalaryHistory.tsx
**Expected Actions**:
- Approve advance salary requests
- Reject advance salary requests
- View advance salary history

**Permissions Needed**:
- `PERMISSIONS.PAYROLL.APPROVE_ADVANCE_SALARY` - For approve/reject buttons

**Implementation Strategy**:
- Hide approve/reject action buttons if user doesn't have permission
- Keep view/filter functionality accessible

---

### 4. ProfilePage.tsx
**Expected Actions**:
- Edit shop profile
- Update business information
- Change settings
- Upload images

**Permissions Needed**:
- `PERMISSIONS.SETTINGS.EDIT_SHOP_PROFILE` - For edit buttons/forms

**Implementation Strategy**:
- Show read-only view if user doesn't have permission
- Hide edit buttons and make form fields disabled
- Show "You don't have permission to edit" message

---

## Common Pattern

All implementations will follow this pattern:

```typescript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/config/permissions";

const MyPage = () => {
  const { hasPermission } = usePermission();
  
  const canPerformAction = hasPermission(PERMISSIONS.MODULE.ACTION);
  
  return (
    <div>
      {/* Always visible content */}
      <ViewContent />
      
      {/* Conditionally visible actions */}
      {canPerformAction && (
        <ActionButtons />
      )}
    </div>
  );
};
```

## Implementation Order

1. **LeaveHistory.tsx** - Approve/reject leave requests
2. **AdvanceSalaryHistory.tsx** - Approve/reject advance salary
3. **ReleaseHistory.tsx** - View/manage salary releases
4. **ProfilePage.tsx** - Edit profile functionality

## Testing Strategy

For each page, verify:
- Main shop users see all actions
- Child users with permission see actions
- Child users without permission don't see actions
- Page functionality works correctly with hidden actions
- No console errors or broken layouts

## Documentation

Each implementation will be documented in the respective page's section of the overall permission documentation.
