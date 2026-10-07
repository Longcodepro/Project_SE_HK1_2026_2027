"use client";

import React, { useEffect, useState } from "react";
import { useCartStore, CartItem } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { TOPPING_OPTIONS } from "../data/product-options";
import { getProductImage } from "../data/mock-products";
import { apiCreateOrder } from "../services/api";

interface CartDrawerProps {
  onOrderCreated?: (orderId: string, amount: number, orderedItems: CartItem[]) => void;
}

export default function CartDrawer({ onOrderCreated }: CartDrawerProps) {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalAmount,
    getTotalCount,
  } = useCartStore();

  const { token, openAuthModal } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const totalAmount = getTotalAmount();
  const totalCount = getTotalCount();

  const getToppingName = (id: string) => {
    return TOPPING_OPTIONS.find((t) => t.id === id)?.name || id;
  };

  const handleCheckout = async () => {
    setErrorMessage(null);

    if (!token) {
      // Nếu chưa đăng nhập, nhắc đăng nhập và mở AuthModal
      openAuthModal("login");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Giỏ hàng đang trống");
      return;
    }

    setSubmitting(true);
    try {
      // Chuẩn bị payload theo đúng CreateOrderDto (Task 6)
      const orderPayload = items.map((item) => ({
        productId: item.product.id,
        size: item.size,
        qty: item.quantity,
        toppings: item.toppings,
      }));

      const orderedItems = [...items];
      const createdOrder = await apiCreateOrder(token, orderPayload);

      // Đóng drawer giỏ hàng và mở modal thanh toán
      closeCart();
      if (onOrderCreated) {
        onOrderCreated(createdOrder.id, createdOrder.total, orderedItems);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tạo đơn hàng. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      onClick={closeCart}
    >
      <div
        className="relative flex h-full w-full max-w-md flex-col bg-[#FCF8F3] text-[#2B1810] shadow-2xl transition duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between border-b border-amber-900/15 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 id="cart-drawer-title" className="text-lg font-black text-[#381B0D]">
              Giỏ hàng của bạn
            </h2>
            {totalCount > 0 && (
              <span className="rounded-full bg-[#5E2F13] px-2.5 py-0.5 text-xs font-bold text-[#FAF5EE]">
                {totalCount} ly
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-[#8C6D58] hover:text-red-700 hover:underline"
              >
                Xóa tất cả
              </button>
            )}
            <button
              type="button"
              onClick={closeCart}
              className="grid size-8 place-items-center rounded-full bg-amber-900/10 text-[#4E2A12] transition hover:bg-amber-900/20"
              aria-label="Đóng giỏ hàng"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Thông báo lỗi khi đặt hàng (ví dụ: 422 hết hàng) */}
        {errorMessage && (
          <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Thông báo nếu chưa đăng nhập */}
        {!token && items.length > 0 && (
          <div className="mx-5 mt-3 flex items-center justify-between rounded-xl border border-amber-900/20 bg-[#F3E7D9] px-3.5 py-2.5 text-xs text-[#5E2F13]">
            <span>💡 Đăng nhập để tiến hành đặt đơn và tích lũy điểm</span>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="font-bold underline ml-2"
            >
              Đăng nhập
            </button>
          </div>
        )}

        {/* Danh sách món */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="text-5xl">🛍️</span>
              <p className="mt-4 text-base font-extrabold text-[#381B0D]">
                Giỏ hàng đang trống
              </p>
              <p className="mt-1 text-xs text-[#7A5A43]">
                Hãy chọn những ly cà phê thơm ngon vào giỏ nhé!
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="btn-primary mt-5"
              >
                Khám phá menu ngay
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-2xl border border-amber-900/15 bg-[#F6EEE4] p-3.5 shadow-sm"
                >
                  {/* Ảnh sản phẩm */}
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-[#E8DACB]">
                    <img
                      src={item.product.imageUrl || getProductImage(item.product)}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Thông tin chi tiết */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-extrabold text-[#381B0D]">
                          {item.product.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-stone-400 hover:text-red-600 transition"
                          title="Xóa món này"
                          aria-label={`Xóa ${item.product.name}`}
                        >
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Tag size & topping */}
                      <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                        <span className="rounded bg-[#5E2F13]/10 px-1.5 py-0.5 font-bold text-[#5E2F13]">
                          Size {item.size}
                        </span>
                        {item.toppings.map((topId) => (
                          <span
                            key={topId}
                            className="rounded bg-amber-900/10 px-1.5 py-0.5 font-medium text-[#7A5A43]"
                          >
                            +{getToppingName(topId)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Số lượng và giá thành tiền */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-lg border border-amber-900/15 bg-[#FCF8F3] px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="text-sm font-black text-[#5E2F13] disabled:opacity-30"
                          aria-label="Giảm số lượng"
                        >
                          −
                        </button>
                        <span className="min-w-4 text-center text-xs font-extrabold text-[#381B0D]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="text-sm font-black text-[#5E2F13] disabled:opacity-30"
                          aria-label="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="block text-sm font-black text-[#381B0D]">
                          {item.lineTotal.toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Drawer: Tổng tiền và Đặt đơn */}
        {items.length > 0 && (
          <div className="border-t border-amber-900/15 bg-[#FAF4ED] p-5">
            <div className="mb-4 space-y-1.5">
              <div className="flex justify-between text-xs text-[#7A5A43]">
                <span>Tổng số lượng:</span>
                <span className="font-bold text-[#381B0D]">{totalCount} ly</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-extrabold text-[#381B0D]">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-[#5E2F13]">
                  {totalAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5E2F13] py-3.5 text-sm font-black text-[#FAF5EE] shadow-lg transition hover:bg-[#47220B] active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <span>Đang gửi đơn hàng...</span>
              ) : (
                <>
                  <span>Tiến hành đặt đơn</span>
                  <span>• {totalAmount.toLocaleString("vi-VN")} đ</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
