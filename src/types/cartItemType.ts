import { Category, Color, Size, Unit } from "./categoryType";
import { Product } from "./ProductType";

export interface CartItem extends Product {
  orderItemId?: number;
  quantity: number;
  unit: Unit;
  selectedVariant?: {
    Category: Category;
    Color: Color;
    Size: Size;
    id: number;
    sku: string;
    quantity: number;
    alertQuantity: number;
    imageUrl: string;
    status: string;
    ProductId: number;
    ColorId: number;
    SizeId: number;
  };
  cartItemId: string;
  imageUrl: string;
  sku: string;
}
