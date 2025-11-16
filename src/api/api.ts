// export const BASE_URL = "https://glorypos.com/api/api";
export const BASE_URL = "http://localhost:3000/api";

export const REGISTER_URL = `${BASE_URL}/register`;
export const LOGIN_URL = `${BASE_URL}/login`;
export const PROFILE_URL = `${BASE_URL}/profile`;

// Product API
export const PRODUCT_URL = `${BASE_URL}/products`;
export const DELETE_PRODUCT_URL = `${BASE_URL}/products/delete`;
export const UPDATE_PRODUCT_URL = `${BASE_URL}/products/update`;

// Category API
export const CATEGORY_URL = `${BASE_URL}/categories`;
export const DELETE_CATEGORY_URL = `${BASE_URL}/categories/delete`;
export const UPDATE_CATEGORY_URL = `${BASE_URL}/categories/update`;

// Brand APi
export const BRANDS_URL = `${BASE_URL}/brands`;
export const DELETE_BRANDS_URL = `${BASE_URL}/brands/delete`;
export const UPDATE_BRANDS_URL = `${BASE_URL}/brands/update`;

// UNIT APi
export const UNITS_URL = `${BASE_URL}/units`;
export const DELETE_UNITS_URL = `${BASE_URL}/units/delete`;
export const UPDATE_UNITS_URL = `${BASE_URL}/units/update`;

// Size API
export const SIZES_URL = `${BASE_URL}/sizes`;
export const DELETE_SIZES_URL = `${BASE_URL}/sizes/delete`;
export const UPDATE_SIZES_URL = `${BASE_URL}/sizes/update`;

// Color API
export const COLORS_URL = `${BASE_URL}/colors`;
export const DELETE_COLORS_URL = `${BASE_URL}/colors/delete`;
export const UPDATE_COLORS_URL = `${BASE_URL}/colors/update`;
export const PRODUCT_VARIANTS_URL = `${BASE_URL}/product-variants`;
export const DELETE_PRODUCT_VARIANTS_URL = `${BASE_URL}/product-variants/delete`;
export const UPDATE_PRODUCT_VARIANTS_URL = `${BASE_URL}/product-variants/update`;

// Order API
export const ORDERS_URL = `${BASE_URL}/orders`;
export const DELETE_ORDERS_URL = `${BASE_URL}/orders/delete`;
export const UPDATE_ORDERS_URL = `${BASE_URL}/orders/update`;

// Subscription API
export const SUBSCRIPTION_PLAN = `${BASE_URL}/subscription/plans`;
export const DELETE_SUBSCRIPTION_PLAN = `${BASE_URL}/subscription/plans/delete`;
export const SUBSCRIBE_PLAN = `${BASE_URL}/subscription/subscribe`;
export const SUBSCRIBE_USER_PLAN = `${BASE_URL}/subscription/all`;
export const SUBSCRIBE_CONFIRM = `${BASE_URL}/subscription/payment`;
export const SUBSCRIBE_LIMIT = `${BASE_URL}/subscription/limits`;
export const SUBSCRIBE_DASHBOARD = `${BASE_URL}/subscription/analytics`;

// Coupon API
export const COUPONS_URL = `${BASE_URL}/coupons`;
export const DELETE_COUPON_URL = `${BASE_URL}/coupons/delete`;
export const VALIDATE_COUPON_URL = `${COUPONS_URL}/validate`;

// Add to existing endpoints
export const CHILD_USERS_URL = `${BASE_URL}/user/child-users`;
export const CREATE_CHILD_USER_URL = `${BASE_URL}/user/child-user`;

// Sub Shops API
export const SUB_SHOPS_URL = `${BASE_URL}/sub-shops`;

// Payroll APIs (Added)
export const PAYROLL_ATTENDANCE_MULTIPLE = `${BASE_URL}/payroll/attendance/multiple`;
export const PAYROLL_ATTENDANCE_SINGLE = `${BASE_URL}/payroll/attendance`; // POST /:userId
export const PAYROLL_LEAVE = `${BASE_URL}/payroll/leave`;
export const PAYROLL_LEAVE_UPDATE = `${BASE_URL}/payroll/leave`; // Use with /:id
export const PAYROLL_LEAVE_HISTORY = `${BASE_URL}/payroll/leave/history`; // Use with /:id
export const PAYROLL_HOLIDAY = `${BASE_URL}/payroll/holiday`;
export const PAYROLL_HOLIDAYS = `${BASE_URL}/payroll/holidays`;
export const PAYROLL_PROMOTION = `${BASE_URL}/payroll/promotion`;
export const PAYROLL_SALARY_DETAILS = `${BASE_URL}/payroll/salary`; // Use with /:userId/:month
export const PAYROLL_RELEASE = `${BASE_URL}/payroll/release`;
export const PAYROLL_HISTORY = `${BASE_URL}/payroll/history`; // Use with /:userId
export const PAYROLL_ATTENDANCE_PRESENT_MULTIPLE = `${BASE_URL}/payroll/attendance/present/multiple`;
export const PAYROLL_ATTENDANCE_ABSENT_MULTIPLE = `${BASE_URL}/payroll/attendance/absent/multiple`;
export const PAYROLL_ATTENDANCE_DELETE = `${BASE_URL}/payroll/attendance`; // DELETE /:userId?date=...
// === PROMOTION HISTORY (NEW) ===
export const PAYROLL_PROMOTION_HISTORY = `${BASE_URL}/payroll/promotion/history`; // GET ?page=1&pageSize=20&status=promotion&userId=...
export const PAYROLL_PROMOTION_HISTORY_SINGLE = `${BASE_URL}/payroll/promotion/history`; // GET /:userId
export const PAYROLL_RELEASE_HISTORY = `${BASE_URL}/payroll/release/history`;
