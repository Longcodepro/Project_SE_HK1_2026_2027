"use client";

import React, { useState, useEffect } from "react";
import {
  ProductSize,
  SIZE_OPTIONS,
  TOPPING_OPTIONS,
  calculateLineTotal,
  calculateUnitPrice,
} from "../data/product-options";

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
}

export interface CartItemPayload {
  product: Product;
  size: ProductSize;
  toppings: string[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItemPayload) => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize>("S");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Reset trạng thái lựa chọn mỗi khi mở modal với món mới
  useEffect(() => {
    if (product) {
      setSelectedSize("S");
      setSelectedToppings([]);
      setQuantity(1);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const soldOut = product.stock <= 0;
  const maxQty = Math.max(1, product.stock);

  // Toggle chọn / bỏ chọn topping
  const handleToggleTopping = (toppingId: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  // Tính đơn giá và thành tiền theo đúng chuẩn API Contract
  const unitPrice = calculateUnitPrice(product.price, selectedSize, selectedToppings);
  const lineTotal = calculateLineTotal(product.price, selectedSize, selectedToppings, quantity);

  const handleConfirmAddToCart = () => {
    if (soldOut) return;
    onAddToCart({
      product,
      size: selectedSize,
      toppings: selectedToppings,
      quantity,
      unitPrice,
      lineTotal,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-amber-900/15 bg-[#FCF8F3] shadow-2xl transition sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
          aria-label="Đóng bảng tùy chọn"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header ảnh và thông tin món */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#E8DACB]">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">☕</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                soldOut ? "bg-stone-800 text-stone-200" : "bg-[#2B6038] text-[#E8F5E9]"
              }`}
            >
              {soldOut ? "Tạm hết món" : `Còn hàng: ${product.stock} ly`}
            </span>
            <h2 id="modal-product-title" className="mt-1 text-2xl font-black text-white">
              {product.name}
            </h2>
            <p className="text-sm font-semibold text-amber-200">
              Giá gốc: {product.price.toLocaleString("vi-VN")} đ
            </p>
          </div>
        </div>

        {/* Nội dung tùy chọn cuộn được */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4 text-[#2B1810]">
          {/* 1. Chọn Size (Bắt buộc chọn 1) */}
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#381B0D]">
                1. Chọn kích cỡ (Size)
              </h3>
              <span className="text-xs font-semibold text-[#8C6D58]">Chọn 1</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {SIZE_OPTIONS.map((size) => {
                const isSelected = selectedSize === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size.id)}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${
                      isSelected
                        ? "border-[#5E2F13] bg-[#5E2F13] text-white shadow-md shadow-amber-950/20"
                        : "border-amber-900/15 bg-[#F6EEE4] text-[#4E2A12] hover:border-amber-800/30 hover:bg-[#EFE3D5]"
                    }`}
                  >
                    <span className="text-sm font-black">{size.name}</span>
                    <span
                      className={`text-[11px] ${
                        isSelected ? "text-amber-200" : "text-[#7A5A43]"
                      }`}
                    >
                      {size.description}
                    </span>
                    <span
                      className={`mt-1 text-xs font-bold ${
                        isSelected ? "text-white" : "text-[#2B6038]"
                      }`}
                    >
                      {size.extraPrice === 0
                        ? "+0 đ"
                        : `+${size.extraPrice.toLocaleString("vi-VN")} đ`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Chọn Topping (Có thể chọn nhiều) */}
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#381B0D]">
                2. Thêm Topping
              </h3>
              <span className="text-xs font-semibold text-[#8C6D58]">Tùy chọn</span>
            </div>
            <div className="mt-3 space-y-2">
              {TOPPING_OPTIONS.map((topping) => {
                const isChecked = selectedToppings.includes(topping.id);
                return (
                  <label
                    key={topping.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                      isChecked
                        ? "border-[#5E2F13] bg-[#F3E7D9] text-[#381B0D]"
                        : "border-amber-900/15 bg-[#FAF4ED] text-[#4E2A12] hover:bg-[#F4EBE0]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTopping(topping.id)}
                        className="size-4 rounded border-amber-900/30 text-[#5E2F13] focus:ring-[#5E2F13]"
                      />
                      <span className="text-sm font-bold">{topping.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-[#2B6038]">
                      +{topping.price.toLocaleString("vi-VN")} đ
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* 3. Số lượng món */}
          <section className="flex items-center justify-between rounded-2xl border border-amber-900/15 bg-[#F6EEE4] p-3.5">
            <div>
              <span className="block text-sm font-extrabold text-[#381B0D]">Số lượng</span>
              <span className="text-xs text-[#7A5A43]">Tối đa {product.stock} ly</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={quantity <= 1 || soldOut}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="grid size-9 place-items-center rounded-xl border border-amber-900/20 bg-[#FCF8F3] text-lg font-black text-[#4E2A12] shadow-sm transition hover:bg-stone-100 disabled:opacity-40"
                aria-label="Giảm số lượng"
              >
                −
              </button>
              <span className="min-w-6 text-center text-base font-black text-[#381B0D]">
                {quantity}
              </span>
              <button
                type="button"
                disabled={quantity >= maxQty || soldOut}
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                className="grid size-9 place-items-center rounded-xl border border-amber-900/20 bg-[#FCF8F3] text-lg font-black text-[#4E2A12] shadow-sm transition hover:bg-stone-100 disabled:opacity-40"
                aria-label="Tăng số lượng"
              >
                +
              </button>
            </div>
          </section>
        </div>

        {/* Footer: Tổng tiền + Nút Thêm vào giỏ */}
        <div className="border-t border-amber-900/15 bg-[#FAF4ED] p-4 sm:p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A5A43]">
              Tạm tính ({quantity} ly):
            </span>
            <span className="text-xl font-black text-[#381B0D]">
              {lineTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>

          <button
            type="button"
            disabled={soldOut}
            onClick={handleConfirmAddToCart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5E2F13] py-3.5 text-sm font-black text-[#FAF5EE] shadow-md transition hover:bg-[#47220B] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          >
            <span>{soldOut ? "Món này đã hết hàng" : "Thêm vào giỏ hàng"}</span>
            {!soldOut && <span>• {lineTotal.toLocaleString("vi-VN")} đ</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
