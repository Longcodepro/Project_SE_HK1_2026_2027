import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProductSize, calculateLineTotal, calculateUnitPrice } from "../data/product-options";

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
}

export interface CartItem {
  id: string; // Mã định danh duy nhất cho từng cấu hình: productId-size-toppings
  product: CartProduct;
  size: ProductSize;
  toppings: string[]; // Mảng ID topping, ví dụ: ["top-001"]
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean; // Trạng thái đóng/mở Drawer giỏ hàng

  // Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: CartProduct, size: ProductSize, toppings: string[], quantity: number) => void;
  updateQuantity: (itemId: string, newQty: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;

  // Getters
  getTotalCount: () => number;
  getTotalAmount: () => number;
}

// Hàm sinh ID duy nhất cho một dòng cấu hình món trong giỏ
function generateCartItemId(productId: string, size: ProductSize, toppings: string[]): string {
  const sortedToppings = [...toppings].sort().join("-");
  return `${productId}-${size}-${sortedToppings || "none"}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product, size, toppings, quantity) => {
        const itemId = generateCartItemId(product.id, size, toppings);
        const { items } = get();
        const existingIndex = items.findIndex((item) => item.id === itemId);

        const unitPrice = calculateUnitPrice(product.price, size, toppings);

        if (existingIndex > -1) {
          // Nếu đã có món cùng size & topping -> Cộng dồn số lượng (chặn max tồn kho)
          const currentItem = items[existingIndex];
          const newQuantity = Math.min(product.stock, currentItem.quantity + quantity);
          const newLineTotal = unitPrice * newQuantity;

          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...currentItem,
            quantity: newQuantity,
            lineTotal: newLineTotal,
          };
          set({ items: updatedItems });
        } else {
          // Thêm món mới vào giỏ
          const safeQuantity = Math.min(product.stock, Math.max(1, quantity));
          const newItem: CartItem = {
            id: itemId,
            product,
            size,
            toppings,
            quantity: safeQuantity,
            unitPrice,
            lineTotal: unitPrice * safeQuantity,
          };
          set({ items: [...items, newItem] });
        }
      },

      updateQuantity: (itemId, newQty) => {
        const { items } = get();
        const target = items.find((item) => item.id === itemId);
        if (!target) return;

        // Giới hạn trong khoảng [1, tồn kho]
        const validQty = Math.max(1, Math.min(target.product.stock, newQty));
        const updatedItems = items.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity: validQty,
              lineTotal: item.unitPrice * validQty,
            };
          }
          return item;
        });

        set({ items: updatedItems });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalAmount: () => {
        return get().items.reduce((sum, item) => sum + item.lineTotal, 0);
      },
    }),
    {
      name: "brewlite-cart-storage",
      partialize: (state) => ({ items: state.items }), // Chỉ lưu danh sách items vào localStorage
    }
  )
);