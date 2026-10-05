export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
}

// Dữ liệu giả để dùng khi backend chưa xong
// Xem docs/API-CONTRACT.md — mục "Dữ liệu giả cho frontend"
export const MOCK_PRODUCTS: Product[] = [
  { id: "prod-001", name: "Cà phê sữa", price: 35000, imageUrl: null, stock: 50 },
  { id: "prod-002", name: "Americano", price: 40000, imageUrl: null, stock: 30 },
  { id: "prod-003", name: "Cappuccino", price: 45000, imageUrl: null, stock: 25 },
  { id: "prod-004", name: "Trà đào", price: 39000, imageUrl: null, stock: 40 },
];
