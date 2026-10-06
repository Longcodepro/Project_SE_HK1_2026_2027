"use client";

import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { apiLogin, apiRegister } from "../services/api";

export default function AuthModal() {
  const { isAuthModalOpen, authTab, openAuthModal, closeAuthModal, setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      if (authTab === "login") {
        const data = await apiLogin(email, password);
        setAuth(data.access_token, data.user);
        closeAuthModal();
      } else {
        await apiRegister(email, password);
        // Sau khi đăng ký thành công, tự động đăng nhập luôn
        const loginData = await apiLogin(email, password);
        setAuth(loginData.access_token, loginData.user);
        closeAuthModal();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={closeAuthModal}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-900/15 bg-[#FCF8F3] p-6 shadow-2xl text-[#2B1810]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-amber-900/10 text-[#4E2A12] transition hover:bg-amber-900/20"
        >
          ✕
        </button>

        {/* Tiêu đề & chuyển tab */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#5E2F13] text-lg text-white">
              ☕
            </span>
            <div>
              <h2 className="text-xl font-black text-[#381B0D]">
                {authTab === "login" ? "Đăng nhập BrewLite" : "Đăng ký thành viên"}
              </h2>
              <p className="text-xs text-[#7A5A43]">
                {authTab === "login"
                  ? "Tích lũy điểm thưởng và đặt đồ uống nhanh chóng"
                  : "Nhận ngay ưu đãi cà phê thơm ngon mỗi ngày"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex rounded-xl bg-[#EFE4D6] p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                openAuthModal("login");
              }}
              className={`flex-1 rounded-lg py-2 transition ${
                authTab === "login"
                  ? "bg-[#5E2F13] text-white shadow-sm"
                  : "text-[#7A5A43] hover:text-[#381B0D]"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                openAuthModal("register");
              }}
              className={`flex-1 rounded-lg py-2 transition ${
                authTab === "register"
                  ? "bg-[#5E2F13] text-white shadow-sm"
                  : "text-[#7A5A43] hover:text-[#381B0D]"
              }`}
            >
              Đăng ký mới
            </button>
          </div>
        </div>

        {/* Thông báo lỗi / thành công */}
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700">
            ✓ {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4E2A12]">
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sinhvien@example.com"
              className="mt-1 w-full rounded-xl border border-amber-900/20 bg-white px-3.5 py-2.5 text-sm text-[#381B0D] placeholder-stone-400 focus:border-[#5E2F13] focus:outline-none focus:ring-1 focus:ring-[#5E2F13]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4E2A12]">
              Mật khẩu (tối thiểu 6 ký tự)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-amber-900/20 bg-white px-3.5 py-2.5 text-sm text-[#381B0D] placeholder-stone-400 focus:border-[#5E2F13] focus:outline-none focus:ring-1 focus:ring-[#5E2F13]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5E2F13] py-3 text-sm font-black text-white shadow-md transition hover:bg-[#47220B] disabled:opacity-50"
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : authTab === "login" ? (
              <span>Đăng nhập</span>
            ) : (
              <span>Đăng ký & Bắt đầu đặt món</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
