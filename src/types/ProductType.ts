import { Brand, Color, Size, Unit } from "./categoryType";

import { Category } from "./categoryType";

export interface User {
  id: number;
  fullName: string;
  email: string;
  businessName: string;
}

export interface ProductFormData {
  id: number | undefined;
  code: string | null;
  sku: string;
  name: string;
  description: string;
  CategoryId: number;
  BrandId: number;
  UnitId: number;
  ColorId?: number;
  SizeId?: number;
  alertQuantity: number;
  productImage: string;
  productImages?: string[]; // Multiple images support
  discountType: string | null;
  discountAmount: number | null;
  purchasePrice: number;
  salesPrice: number;
  vat: number;
  price: number;
  stock: number;
  status: "active" | "inactive";
  images?: string[];
  imageFile?: File | null;
  imageFiles?: File[]; // Multiple image files support
}

export interface ProductVariant {
  id: number;
  sku: string;
  status: "active" | "inactive";
  ProductId: number;
  ColorId: number;
  SizeId: number;
  quantity: number;
  alertQuantity: number;
  Size: Size;
  Color: Color;
  imageUrl: string;
  images?: string[];
}

export interface Product {
  id: number;
  code: string | null;
  sku: string;
  name: string;
  description: string;
  CategoryId: number;
  BrandId: number;
  UnitId: number;
  ColorId: number;
  SizeId: number;
  Size: Size;
  Color: Color;
  alertQuantity: number;
  productImage: string;
  images: string[];
  discountType: string | null;
  discountAmount: number | null;
  purchasePrice: number;
  salesPrice: number;
  vat: number;
  price: number;
  stock: number;
  status: "active" | "inactive";
  UserId: number;
  User?: User;
  Category: Category;
  Brand: Brand;
  Unit: Unit;
  ProductVariants: ProductVariant[];
}

export interface ProductPaginationData {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: ProductPaginationData;
}

export interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  shopId?: string | number;
  categoryId?: string | number;
  brandId?: string | number;
  unitId?: string | number;
  searchKey?: string;
  minPrice?: number;
  maxPrice?: number;
  [key: string]: any; // For otherFilters
}
