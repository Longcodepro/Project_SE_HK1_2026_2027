"use client";

import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import { apiPayOrder, generateUUID, PaymentResponse } from "../services/api";

interface PaymentModalProps {
  isOpen: boolean;
  orderId: string | null;
  amount: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaymentModal({
  isOpen,
  orderId,
  amount,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { token, user, updateLoyaltyPoints, openHistoryModal } = useAuthStore();
  const { clearCart } = useCartStore();

  const [method, setMethod] = useState<"WALLET" | "CARD">("WALLET");
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !orderId) return null;

  const handlePay = async () => {
    if (!token) {
      setErrorMessage("Vui lòng đăng nhập để thanh toán.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Mỗi lần gửi thanh toán mới, sinh một Idempotency-Key
      const idempotencyKey = generateUUID();
      const res = await apiPayOrder(token, orderId, amount, method, idempotencyKey);
      setPaymentResult(res);

      if (res.status === "PAID") {
        // Xóa giỏ hàng khi thanh toán thành công
        clearCart();

        // Cộng điểm loyalty: 10.000đ = 1 điểm
        const earnedPoints = Math.floor(amount / 10000);
        if (user) {
          updateLoyaltyPoints(user.loyaltyPoints + earnedPoints);
        }

        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi xử lý thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setPaymentResult(null);
    setErrorMessage(null);
  };

  const handleFinish = () => {
    setPaymentResult(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={paymentResult?.status === "PAID" ? handleFinish : onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-900/15 bg-[#FCF8F3] p-6 shadow-2xl text-[#2B1810]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={paymentResult?.status === "PAID" ? handleFinish : onClose}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-amber-900/10 text-[#4E2A12] transition hover:bg-amber-900/20"
        >
          ✕
        </button>

        {/* 1. MÀN HÌNH KẾT QUẢ THÀNH CÔNG */}
        {paymentResult?.status === "PAID" && (
          <div className="text-center py-4">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-3xl text-green-700">
              🎉
            </div>
            <h2 className="mt-4 text-2xl font-black text-[#2B6038]">
              Thanh toán thành công!
            </h2>
            <p className="mt-1 text-sm text-[#7A5A43]">
              Đơn hàng của bạn đã được chuyển đến quầy pha chế.
            </p>

            <div className="my-5 rounded-2xl border border-amber-900/15 bg-[#F6EEE4] p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#7A5A43]">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-[#381B0D]">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A5A43]">Phương thức:</span>
                <span className="font-bold text-[#381B0D]">
                  {paymentResult.method === "WALLET" ? "Ví điện tử" : "Thẻ ngân hàng"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A5A43]">Đã thanh toán:</span>
                <span className="font-black text-[#2B6038] text-sm">
                  {amount.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="flex justify-between border-t border-amber-900/10 pt-2 text-[#5E2F13]">
                <span className="font-bold">Điểm tích lũy nhận được:</span>
                <span className="font-extrabold">+{Math.floor(amount / 10000)} điểm 🌟</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleFinish();
                  openHistoryModal();
                }}
                className="btn-primary flex-1"
              >
                Xem lịch sử đơn
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 rounded-2xl border border-amber-900/20 bg-white py-3 text-sm font-bold text-[#4E2A12] hover:bg-[#F6EEE4]"
              >
                Tiếp tục chọn món
              </button>
            </div>
          </div>
        )}

        {/* 2. MÀN HÌNH KẾT QUẢ THẤT BẠI (MOCK 20%) */}
        {paymentResult?.status === "PAYMENT_FAILED" && (
          <div className="text-center py-4">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-100 text-3xl text-red-700">
              ❌
            </div>
            <h2 className="mt-4 text-2xl font-black text-red-700">
              Thanh toán chưa thành công
            </h2>
            <p className="mt-1 text-sm text-[#7A5A43]">
              Hệ thống giả lập thanh toán ngẫu nhiên (20% xác suất). Đơn hàng của bạn vẫn được lưu để thử lại!
            </p>

            <div className="my-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 text-left">
              <p className="font-bold">Mã đơn: <span className="font-mono">{orderId}</span></p>
              <p className="mt-1">Số tiền cần thanh toán: <span className="font-black">{amount.toLocaleString("vi-VN")} đ</span></p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="flex-1 rounded-2xl bg-[#5E2F13] py-3 text-sm font-black text-white hover:bg-[#47220B]"
              >
                Thử lại thanh toán
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-amber-900/20 bg-white py-3 text-sm font-bold text-[#4E2A12] hover:bg-[#F6EEE4]"
              >
                Để sau
              </button>
            </div>
          </div>
        )}

        {/* 3. MÀN HÌNH CHỌN PHƯƠNG THỨC THANH TOÁN */}
        {!paymentResult && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-black text-[#381B0D]">
                Thanh toán đơn hàng
              </h2>
              <p className="mt-1 text-xs text-[#7A5A43]">
                Mã đơn: <span className="font-mono font-bold text-[#5E2F13]">{orderId}</span>
              </p>
            </div>

            <div className="mb-5 rounded-2xl border border-amber-900/15 bg-[#F6EEE4] p-4 text-center">
              <span className="text-xs uppercase font-bold text-[#7A5A43]">Số tiền cần thanh toán</span>
              <p className="mt-1 text-3xl font-black text-[#5E2F13]">
                {amount.toLocaleString("vi-VN")} đ
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                ⚠️ {errorMessage}
              </div>
            )}

            <div className="mb-6 space-y-2.5">
              <span className="block text-xs font-extrabold text-[#381B0D]">
                Chọn phương thức thanh toán không dùng tiền mặt:
              </span>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition ${
                  method === "WALLET"
                    ? "border-[#5E2F13] bg-[#F3E7D9] text-[#381B0D]"
                    : "border-amber-900/15 bg-white text-[#4E2A12] hover:bg-[#FAF4ED]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <span className="block text-sm font-black">Ví điện tử sinh viên</span>
                    <span className="text-[11px] text-[#7A5A43]">MoMo, ZaloPay, Viettel Money</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="WALLET"
                  checked={method === "WALLET"}
                  onChange={() => setMethod("WALLET")}
                  className="size-4 text-[#5E2F13]"
                />
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition ${
                  method === "CARD"
                    ? "border-[#5E2F13] bg-[#F3E7D9] text-[#381B0D]"
                    : "border-amber-900/15 bg-white text-[#4E2A12] hover:bg-[#FAF4ED]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <span className="block text-sm font-black">Thẻ ngân hàng / Thẻ sinh viên</span>
                    <span className="text-[11px] text-[#7A5A43]">Napas, Visa, Mastercard</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={method === "CARD"}
                  onChange={() => setMethod("CARD")}
                  className="size-4 text-[#5E2F13]"
                />
              </label>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handlePay}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5E2F13] py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[#47220B] disabled:opacity-50"
            >
              {loading ? (
                <span>Đang xử lý giao dịch...</span>
              ) : (
                <span>Xác nhận thanh toán {amount.toLocaleString("vi-VN")} đ</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
