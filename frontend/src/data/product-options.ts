export type ProductSize = "S" | "M" | "L";

export interface SizeOption {
  id: ProductSize;
  name: string;
  description: string;
  extraPrice: number;
}

export interface ToppingOption {
  id: string;
  name: string;
  price: number;
}

// Bảng tùy chọn Size theo API Contract (docs/API-CONTRACT.md: S: +0đ, M: +5.000đ, L: +10.000đ)
export const SIZE_OPTIONS: SizeOption[] = [
  { id: "S", name: "Nhỏ (S)", description: "350ml", extraPrice: 0 },
  { id: "M", name: "Vừa (M)", description: "500ml", extraPrice: 5000 },
  { id: "L", name: "Lớn (L)", description: "700ml", extraPrice: 10000 },
];

// Danh sách Topping khớp 100% với backend DB seed (docs/API-CONTRACT.md & backend/prisma/seed.ts)
export const TOPPING_OPTIONS: ToppingOption[] = [
  { id: "top-001", name: "Trân châu đen", price: 7000 },
  { id: "top-002", name: "Thạch dừa", price: 6000 },
  { id: "top-003", name: "Kem phô mai", price: 10000 },
  { id: "top-004", name: "Shot espresso", price: 12000 },
];

/**
 * Tính đơn giá của một ly đồ uống bao gồm giá gốc, phụ thu size và topping
 */
export function calculateUnitPrice(
  basePrice: number,
  size: ProductSize,
  toppingIds: string[]
): number {
  const sizeOption = SIZE_OPTIONS.find((s) => s.id === size);
  const sizeSurcharge = sizeOption ? sizeOption.extraPrice : 0;
  const toppingTotal = toppingIds.reduce((sum, id) => {
    const topping = TOPPING_OPTIONS.find((t) => t.id === id);
    return sum + (topping ? topping.price : 0);
  }, 0);

  return basePrice + sizeSurcharge + toppingTotal;
}

/**
 * Tính tổng tiền một dòng món theo công thức API Contract:
 * lineTotal = (basePrice + phụ_thu_size + tổng_giá_topping) * qty
 */
export function calculateLineTotal(
  basePrice: number,
  size: ProductSize,
  toppingIds: string[],
  quantity: number
): number {
  return calculateUnitPrice(basePrice, size, toppingIds) * Math.max(1, quantity);
}