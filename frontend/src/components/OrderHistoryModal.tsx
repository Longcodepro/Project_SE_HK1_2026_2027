"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { apiGetMyOrders, OrderResponse } from "../services/api";

interface OrderHistoryModalProps {
  onPayOrder?: (orderId: string, amount: number) => void;
}

export default function OrderHistoryModal({ onPayOrder }: OrderHistoryModalProps) {
  const { isHistoryModalOpen, closeHistoryModal, token } = useAuthStore();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetMyOrders(token);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải lịch sử đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHistoryModalOpen && token) {
      fetchOrders();
    }
  }, [isHistoryModalOpen, token]);

  if (!isHistoryModalOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">Đã thanh toán</span>;
      case "PENDING":
        return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">Chờ thanh toán</span>;
      case "PAYMENT_FAILED":
        return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">Thanh toán thất bại</span>;
      case "PREPARING":
        return <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">Đang pha chế</span>;
      case "READY":
        return <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800">Sẵn sàng nhận món</span>;
      case "COMPLETED":
        return <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-bold text-stone-800">Đã hoàn thành</span>;
      default:
        return <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700">{status}</span>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={closeHistoryModal}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-amber-900/15 bg-[#FCF8F3] shadow-2xl text-[#2B1810]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/15 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="text-lg font-black text-[#381B0D]">
              Lịch sử đơn hàng của tôi
            </h2>
          </div>
          <button
            type="button"
            onClick={closeHistoryModal}
            className="grid size-8 place-items-center rounded-full bg-amber-900/10 text-[#4E2A12] transition hover:bg-amber-900/20"
          >
            ✕
          </button>
        </div>

        {/* Nội dung danh sách */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="py-12 text-center text-sm font-semibold text-[#7A5A43]">
              Đang tải lịch sử đơn hàng...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="py-12 text-center">
              <span className="text-4xl">☕</span>
              <p className="mt-3 text-sm font-extrabold text-[#381B0D]">
                Bạn chưa có đơn hàng nào
              </p>
              <p className="mt-1 text-xs text-[#7A5A43]">
                Hãy chọn món và đặt ngay ly cà phê thơm ngon đầu tiên nhé!
              </p>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => {
                const canRetryPay = (order.status === "PENDING" || order.status === "PAYMENT_FAILED") && onPayOrder;
                const dateStr = new Date(order.createdAt).toLocaleString("vi-VN");

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-amber-900/15 bg-[#F6EEE4] p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/10 pb-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-[#5E2F13]">
                          #{order.id.slice(0, 8)}...
                        </span>
                        <span className="ml-2 text-[11px] text-[#7A5A43]">{dateStr}</span>
                      </div>
                      <div>{getStatusBadge(order.status)}</div>
                    </div>

                    {/* Danh sách món trong đơn */}
                    <div className="my-3 space-y-1.5 text-xs">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[#4E2A12]">
                          <span>
                            {item.qty}x {item.productName || item.productId} (Size {item.size})
                            {item.toppings && item.toppings.length > 0 && (
                              <span className="text-[#8C6D58]"> +{item.toppings.length} topping</span>
                            )}
                          </span>
                          <span className="font-bold">{item.lineTotal.toLocaleString("vi-VN")} đ</span>
                        </div>
                      ))}
                    </div>

                    {/* Tổng tiền và thao tác */}
                    <div className="flex items-center justify-between border-t border-amber-900/10 pt-3">
                      <div>
                        <span className="text-xs text-[#7A5A43]">Tổng thanh toán: </span>
                        <span className="text-base font-black text-[#381B0D]">
                          {order.total.toLocaleString("vi-VN")} đ
                        </span>
                      </div>

                      {canRetryPay && (
                        <button
                          type="button"
                          onClick={() => {
                            closeHistoryModal();
                            onPayOrder(order.id, order.total);
                          }}
                          className="rounded-xl bg-[#5E2F13] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#47220B]"
                        >
                          Thanh toán ngay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
