import { Brand, Color, Size, Unit } from "./categoryType";

import { Category } from "./categoryType";

export interface ProductFormData {
  id: number | undefined;
  code: string | null;
  sku: string;
  name: string;
  description: string;
  CategoryId: number;
  BrandId: number;
  UnitId: number;
  ColorId?:number;
  SizeId?:number;
  alertQuantity: number;
  productImage: string;
  discountType: string | null;
  discountAmount: number | null;
  purchasePrice: number;
  salesPrice: number;
  vat: number;
  price: number;
  stock: number;
  status: "active" | "inactive";
  imageFile?: File | null;
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
  ColorId:number;
  SizeId: number;
  Size:Size;
  Color:Color;
  alertQuantity: number;
  productImage: string;
  discountType: string | null;
  discountAmount: number | null;
  purchasePrice: number;
  salesPrice: number;
  vat: number;
  price: number;
  stock: number;
  status: "active" | "inactive";
  UserId: number;
  Category: Category;
  Brand: Brand;
  Unit: Unit;
  ProductVariants: ProductVariant[];
}
