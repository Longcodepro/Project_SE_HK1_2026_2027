export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
}

export const DEFAULT_PRODUCT_IMAGES: Record<string, string> = {
  "prod-001": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=85",
  "prod-002": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=85",
  "prod-003": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=85",
  "prod-004": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=85",
};

export const getProductImage = (product: { id?: string; imageUrl?: string | null }): string => {
  if (product.imageUrl && product.imageUrl.trim() !== "") {
    return product.imageUrl;
  }
  if (product.id && DEFAULT_PRODUCT_IMAGES[product.id]) {
    return DEFAULT_PRODUCT_IMAGES[product.id];
  }
  return "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=85";
};

// Dữ liệu giả định có sẵn ảnh cục bộ ổn định 100% không lo rớt mạng
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    name: "Cà phê sữa",
    price: 35000,
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=85",
    stock: 50,
  },
  {
    id: "prod-002",
    name: "Americano",
    price: 40000,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=85",
    stock: 30,
  },
  {
    id: "prod-003",
    name: "Cappuccino",
    price: 45000,
    imageUrl: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=85",
    stock: 25,
  },
  {
    id: "prod-004",
    name: "Trà đào",
    price: 39000,
    imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=85",
    stock: 40,
  },
];

