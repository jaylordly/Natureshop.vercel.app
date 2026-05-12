export type Visibility = 'public' | 'student' | 'admin';

export type ProductCategory = '머신' | '엠보' | '색소' | '위생' | '케어';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;   // 정가 (할인 전). null이면 할인 안 함
  stock: number;
  category: ProductCategory;
  image: string;
  visibility: Visibility;
  isBest?: boolean;
  isNew?: boolean;
}

export type Role = 'user' | 'student' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
}

export interface CartItem {
  productId: string;
  quantity: number;
}
