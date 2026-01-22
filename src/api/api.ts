// Product API Function with Filtering and Pagination
import AXIOS from "./network/Axios";
import {
  ProductsResponse,
  ProductQueryParams,
  Product,
} from "@/types/ProductType";

// export const BASE_URL = "https://glorypos.com/api/api";
export const BASE_URL = "http://localhost:3000/api";

export const REGISTER_URL = `${BASE_URL}/register`;
export const LOGIN_URL = `${BASE_URL}/login`;
export const PROFILE_URL = `${BASE_URL}/profile`;

export const REQUEST_RESET_PASSWORD = `${BASE_URL}/request-reset`;

// Product API
export const PRODUCT_URL = `${BASE_URL}/products`;
export const DELETE_PRODUCT_URL = `${BASE_URL}/products/delete`;
export const UPDATE_PRODUCT_URL = `${BASE_URL}/products/update`;
export const COMMISSIONS_URL = `${BASE_URL}/commissions`;

/**
 * Fetches products with comprehensive filtering and pagination support
 * @param query - Query parameters object containing filters and pagination
 * @returns Promise<ProductsResponse> - Paginated products response
 */
export const fetchProducts = async (
  query: ProductQueryParams = {}
): Promise<ProductsResponse> => {
  const {
    page = 1,
    pageSize = 20,
    shopId,
    categoryId,
    brandId,
    unitId,
    searchKey,
    minPrice,
    maxPrice,
    ...otherFilters
  } = query;

  // Build query parameters
  const params: Record<string, any> = {
    page,
    pageSize,
  };

  // Add shopId filter if provided
  if (shopId) {
    params.shopId = shopId;
  }

  // Add category filter if provided
  if (categoryId) {
    params.categoryId = categoryId;
  }

  // Add brand filter if provided
  if (brandId) {
    params.brandId = brandId;
  }

  // Add unit filter if provided
  if (unitId) {
    params.unitId = unitId;
  }

  // Add search key filter (searches in name, code, sku, description)
  if (searchKey) {
    params.searchKey = searchKey;
  }

  // Add minPrice filter if provided
  if (minPrice !== undefined && minPrice !== null) {
    params.minPrice = minPrice;
  }

  // Add maxPrice filter if provided
  if (maxPrice !== undefined && maxPrice !== null) {
    params.maxPrice = maxPrice;
  }

  // Add any other filters dynamically
  Object.keys(otherFilters).forEach((key) => {
    if (
      otherFilters[key] !== undefined &&
      otherFilters[key] !== null &&
      otherFilters[key] !== ""
    ) {
      params[key] = otherFilters[key];
    }
  });

  // Make API call
  // AXIOS interceptor already extracts response.data, so response is the data object
  const response = await AXIOS.get(PRODUCT_URL, { params });

  // Return the response with proper typing
  return response.data as unknown as ProductsResponse;
};

/**
 * Fetches all products without pagination (useful for POS, dropdowns, etc.)
 * Uses a large pageSize to fetch all products in a single request
 * @param filters - Optional filter parameters (shopId, categoryId, brandId, unitId, searchKey, etc.)
 * @returns Promise<Product[]> - Array of all products matching the filters
 */
export const fetchAllProducts = async (
  filters: Omit<ProductQueryParams, "page" | "pageSize"> = {}
): Promise<Product[]> => {
  const response = await fetchProducts({
    ...filters,
    page: 1,
    pageSize: 10000, // Large page size to get all products
  });
  return response.products;
};

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
export const SINGLE_ORDERS_URL = `${BASE_URL}/orders/single-order`;
export const DELETE_ORDERS_URL = `${BASE_URL}/orders/delete`;
export const UPDATE_ORDERS_URL = `${BASE_URL}/orders/update`;

// Sales Report API
export const SALES_REPORT_URL = `${BASE_URL}/orders/report/sales-inventory`;

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
export const CHILD_USERS_URL_PROFILE = `${BASE_URL}/user/child-user/:id`;
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
export const PAYROLL_SALARY_DETAILS = `${BASE_URL}/payroll/salary/details`; // Use with /:userId/:month
export const PAYROLL_RELEASE = `${BASE_URL}/payroll/payroll/release-with-validation`;
export const PAYROLL_DETAILS = `${BASE_URL}/payroll/details`;
export const PAYROLL_HISTORY = `${BASE_URL}/payroll/payroll/history`; // Use with /:userId
export const PAYROLL_ATTENDANCE_PRESENT_MULTIPLE = `${BASE_URL}/payroll/attendance/present/multiple`;
export const PAYROLL_ATTENDANCE_ABSENT_MULTIPLE = `${BASE_URL}/payroll/attendance/absent/multiple`;
export const PAYROLL_ATTENDANCE_DELETE = `${BASE_URL}/payroll/attendance`; // DELETE /:userId?date=...
// === PROMOTION HISTORY (NEW) ===
export const PAYROLL_PROMOTION_HISTORY = `${BASE_URL}/payroll/promotion/history`; // GET ?page=1&pageSize=20&status=promotion&userId=...
export const PAYROLL_PROMOTION_HISTORY_SINGLE = `${BASE_URL}/payroll/promotion/history`; // GET /:userId
export const PAYROLL_RELEASE_HISTORY = `${BASE_URL}/payroll/release/history`;
export const PAYROLL_ADVANCE_SALERY = `${BASE_URL}/payroll/advance-salary`;
export const PAYROLL_ADVANCE_SALERY_STATUS = `${BASE_URL}/payroll/advance-salary/:id/status`;
export const PAYROLL_ADVANCE_SALERY_DELETE = `${BASE_URL}/payroll/advance-salary`; // DELETE /:id
