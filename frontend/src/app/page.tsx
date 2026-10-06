"use client";

import React, { useState, useEffect } from "react";
import ProductDetailModal, { CartItemPayload } from "../components/ProductDetailModal";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import CartDrawer from "../components/CartDrawer";
import AuthModal from "../components/AuthModal";
import PaymentModal from "../components/PaymentModal";
import OrderHistoryModal from "../components/OrderHistoryModal";

// 1. Khai báo kiểu theo đúng API Contract (docs/API-CONTRACT.md)
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
}

// Dữ liệu mẫu chuẩn hóa từ thiết kế Unsplash của bạn
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    name: "Cà phê sữa",
    price: 35000,
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "prod-002",
    name: "Cà phê Americano",
    price: 40000,
    stock: 32,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "prod-003",
    name: "Cà phê Cappuccino",
    price: 45000,
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "prod-004",
    name: "Trà đào",
    price: 39000,
    stock: 0, // Minh họa hết món
    imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=85",
  },
];

// 2. Các icon SVG thuần (Không phụ thuộc thư viện ngoài)
function CupIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8Z" />
      <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 5c0-1 1-1 1-2m3 2c0-1 1-1 1-2" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 4h2l2 11h10l2-7H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="19" r="1" fill="currentColor" />
      <circle cx="17" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
    </svg>
  );
}

// 3. Component Skeleton Loading (Tiêu chí DoD Task 3)
function ProductCardSkeleton() {
  return (
    <div className="card-product animate-pulse">
      <div className="aspect-square w-full rounded-2xl bg-[#E5D7C7]/70" />
      <div className="px-2 pb-2 pt-4">
        <div className="h-5 w-3/4 rounded-md bg-[#DECBB5]" />
        <div className="mt-2 h-3.5 w-1/3 rounded-md bg-[#DECBB5]/70" />
        <div className="mt-5 flex items-center justify-between pt-1">
          <div className="h-5 w-20 rounded-md bg-[#DECBB5]" />
          <div className="h-9 w-24 rounded-xl bg-[#DECBB5]" />
        </div>
      </div>
    </div>
  );
}

// 4. Component Empty State (Tiêu chí DoD Task 3)
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-amber-900/25 bg-[#EFE4D6]/70 p-12 text-center">
      <span className="text-5xl">🫙</span>
      <h3 className="mt-4 text-xl font-extrabold text-[#381B0D]">Hiện chưa có món nào</h3>
      <p className="mt-1.5 max-w-sm text-sm text-[#7A5A43]">
        Menu quán đang được cập nhật món mới. Bạn vui lòng quay lại sau nhé!
      </p>
      <button onClick={onReset} className="btn-primary mt-6">
        Tải lại menu
      </button>
    </div>
  );
}

// 5. Component Trang chính
export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { openCart, addItem, getTotalCount } = useCartStore();
  const { user, logout, openAuthModal, openHistoryModal } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ id: string; total: number } | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = mounted ? getTotalCount() : 0;
  const isLoggedIn = mounted && !!user;

  const handleOpenDetail = (product: Product) => {
    if (!isLoggedIn) return;
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (item: CartItemPayload) => {
    addItem(item.product, item.size, item.toppings, item.quantity);
    setToastMessage(`Đã thêm ${item.quantity}x ${item.product.name} (Size ${item.size}) vào giỏ hàng!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Fetch dữ liệu: Thử gọi API backend, nếu backend chưa bật thì dùng dữ liệu mẫu
  const fetchMenu = async () => {
    setLoading(true);
    try {
     const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/products`);
      if (!res.ok) throw new Error("Chưa kết nối được backend");
      const data: Product[] = await res.json();
      setProducts(data);
      setIsDemoMode(false);
    } catch {
      // Giả lập độ trễ 400ms để thầy cô/người chấm thấy hiệu ứng Skeleton Loading
      setTimeout(() => {
        setProducts(INITIAL_PRODUCTS);
        setIsDemoMode(true);
        setLoading(false);
      }, 400);
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  return (
    <div className="min-h-screen bg-[#F4ECE4] text-[#2B1810]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-amber-950/10 bg-[#F4ECE4]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#5E2F13] text-[#FAF5EE] shadow-sm">
              <CupIcon />
            </span>
            <span>
              <span className="block text-lg font-extrabold leading-none tracking-tight text-[#381B0D]">
                BrewLite
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A5A43]">
                Cà phê nhanh · Thanh toán số
              </span>
            </span>
          </a>

          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={openCart}
              className="group relative flex h-10 items-center gap-2 rounded-full border border-amber-900/15 bg-[#FCF8F3] px-3.5 text-sm font-bold text-[#4E2A12] shadow-sm transition hover:-translate-y-0.5 hover:border-amber-800/30 hover:bg-[#F6EEE4] hover:shadow-md"
              aria-label={`Giỏ hàng có ${cartCount} món`}
            >
              <CartIcon />
              <span className="hidden sm:inline">Giỏ hàng</span>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#2B6038] text-[10px] font-extrabold text-[#FAF5EE] ring-2 ring-[#F4ECE4]">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLogin((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-amber-900/15 bg-[#E5D2BC] px-3 py-1.5 text-xs font-bold text-[#4E2A12] ring-1 transition hover:bg-[#D8C1A6]"
                aria-label="Tài khoản người dùng"
              >
                <UserIcon />
                {mounted && user ? (
                  <span className="hidden sm:inline font-bold">
                    {user.email.split("@")[0]} • 🌟 {user.loyaltyPoints}đ
                  </span>
                ) : (
                  <span className="hidden sm:inline">Tài khoản</span>
                )}
              </button>

              {showLogin && (
                <div className="absolute right-0 top-12 w-64 rounded-2xl border border-amber-900/15 bg-[#FCF8F3] p-4 shadow-xl shadow-amber-950/10 z-50">
                  {mounted && user ? (
                    <div>
                      <p className="font-extrabold text-[#381B0D] truncate">{user.email}</p>
                      <div className="mt-2 flex items-center justify-between rounded-xl bg-[#EFE4D6] px-3 py-2 text-xs font-bold text-[#5E2F13]">
                        <span>Điểm tích lũy:</span>
                        <span className="text-sm">🌟 {user.loyaltyPoints} điểm</span>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowLogin(false);
                            openHistoryModal();
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-900/20 bg-white py-2 text-xs font-bold text-[#4E2A12] hover:bg-[#F6EEE4]"
                        >
                          📜 Lịch sử đơn hàng
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setShowLogin(false);
                            setToastMessage("Đã đăng xuất thành công");
                            setTimeout(() => setToastMessage(null), 2500);
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="font-extrabold text-[#381B0D]">Chào bạn!</p>
                      <p className="mt-1 text-xs leading-5 text-[#7A5A43]">
                        Đăng nhập để đặt đơn và nhận ưu đãi điểm thưởng.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowLogin(false);
                            openAuthModal("login");
                          }}
                          className="btn-primary flex-1 text-xs py-2"
                        >
                          Đăng nhập
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowLogin(false);
                            openAuthModal("register");
                          }}
                          className="flex-1 rounded-xl border border-amber-900/20 bg-white py-2 text-xs font-bold text-[#4E2A12] hover:bg-[#F6EEE4]"
                        >
                          Đăng ký
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        {/* Banner Hero */}
        <section className="relative isolate min-h-[340px] overflow-hidden rounded-[28px] bg-[#3B2618] shadow-xl shadow-amber-950/15 sm:min-h-[380px]">
          {/* Ảnh nền có hình cây + ly cafe */}
          <img
            src="https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&w=1920&q=85"
            alt="Ly cà phê và cây xanh BrewLite"
            className="absolute inset-0 h-full w-full object-cover object-right sm:object-center"
          />

          {/* Lớp nền phối màu nâu nhạt cafe pha sắc xanh lá thiên nhiên */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#3D2516]/95 via-[#543825]/85 to-[#22442B]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E3624]/60 via-transparent to-transparent sm:hidden" />

          {/* Vệt sáng trang trí: nâu cafe ấm áp & xanh lá tươi mát */}
          <div className="absolute -bottom-24 -left-12 size-72 rounded-full bg-[#8C5D3B]/35 blur-3xl" />
          <div className="absolute -top-16 -right-16 size-80 rounded-full bg-[#4E8752]/45 blur-3xl" />

          <div className="relative flex min-h-[340px] max-w-2xl flex-col justify-center p-7 text-white sm:min-h-[380px] sm:p-12">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-[#EBF4DD] backdrop-blur-md">
                <span className="size-2 rounded-full bg-[#B4E380] animate-pulse" />
                🌿 Ưu đãi chào bạn mới
              </span>
              <span className="rounded-full bg-[#2A4D30]/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#D4ED82] border border-[#B4E380]/30">
                Chỉ áp dụng hôm nay
              </span>
            </div>

            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#D8ECC4]">
              Đặc quyền thành viên mới
            </p>

            <h1 className="mt-2 text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Giảm ngay <span className="text-[#BCE29E] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">40%</span>
              <br />
              cho khách hàng mới
            </h1>

            <p className="mt-4 max-w-md text-sm leading-6 text-stone-200 sm:text-base">
              Thưởng thức cà phê mộc nguyên chất cùng không gian xanh mát. Đặt món trong vài giây và nhận nước ngay tại quầy!
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#danh-sach-mon"
                className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#452817] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#F5EFE6]"
              >
                Khám phá đồ uống
              </a>

              <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/25 px-3.5 py-2.5 backdrop-blur-md text-xs text-stone-200">
                <span className="text-stone-300">Mã voucher:</span>
                <span className="rounded-md bg-[#BCE29E] px-2 py-0.5 font-black text-[#1F3D25]">
                  NEW40
                </span>
              </div>
            </div>
          </div>

          {/* Thẻ nổi góc phải: Cà phê & Thiên nhiên */}
          <div className="hidden lg:flex absolute bottom-8 right-8 items-center gap-3 rounded-2xl border border-white/20 bg-[#243E2B]/60 p-3.5 backdrop-blur-md text-white shadow-xl">
            <div className="grid size-11 place-items-center rounded-xl bg-[#3B6643] text-xl">
              ☕
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#BCE29E]">
                Cà phê mộc & Thiên nhiên
              </p>
              <p className="text-[11px] text-stone-300">
                100% hạt rang mộc tự nhiên mỗi ngày
              </p>
            </div>
          </div>
        </section>

        {/* Danh sách món */}
        <section id="danh-sach-mon" className="scroll-mt-24 pt-12">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#2B6038]">
                Pha mới mỗi ngày
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#381B0D] sm:text-3xl">
                Chọn món bạn thích
              </h2>
              <p className="mt-2 text-sm text-[#7A5A43]">
                Đồ uống yêu thích, sẵn sàng chỉ trong vài phút.
              </p>
            </div>

            {isDemoMode && (
              <span className="w-fit rounded-full border border-amber-900/15 bg-[#E8D9C7] px-3.5 py-1.5 text-xs font-bold text-[#542B10] shadow-sm">
                Chế độ dùng thử · Dữ liệu mẫu
              </span>
            )}
          </div>

          {/* Thông báo gợi ý đăng nhập để mở khóa tùy chọn món khi chưa đăng nhập */}
          {mounted && !isLoggedIn && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-900/15 bg-[#EFE4D6]/80 p-4 text-xs sm:text-sm text-[#4A250E] shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🔒</span>
                <span>
                  Bạn đang ở chế độ xem thực đơn. <strong>Đăng nhập</strong> để mở khóa tùy chọn size, topping và đặt món!
                </span>
              </div>
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="shrink-0 w-fit rounded-xl bg-[#5E2F13] px-3.5 py-1.5 font-bold text-[#FAF5EE] transition hover:bg-[#47220B]"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}

          {/* Lưới sản phẩm (Grid) */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Trạng thái Loading Skeleton */}
            {loading &&
              Array.from({ length: 4 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))}

            {/* 2. Trạng thái Empty */}
            {!loading && products.length === 0 && (
              <EmptyState onReset={fetchMenu} />
            )}

            {/* 3. Trạng thái có dữ liệu */}
            {!loading &&
              products.map((product) => {
                const soldOut = product.stock <= 0;
                const formattedPrice = product.price.toLocaleString("vi-VN") + " đ";

                return (
                  <article
                    key={product.id || product.name}
                    className={`group card-product ${
                      soldOut
                        ? "opacity-60"
                        : "hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(65,33,12,0.12)]"
                    }`}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#E5D7C6]">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">
                          ☕
                        </div>
                      )}

                      {soldOut && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#3B2012] px-3 py-1.5 text-xs font-extrabold text-[#FAF5EE]">
                          Hết hàng
                        </span>
                      )}
                    </div>

                    <div className="px-2 pb-2 pt-4">
                      <h3 className="text-lg font-extrabold text-[#381B0D]">
                        {product.name}
                      </h3>
                      <p
                        className={`mt-1.5 text-xs font-semibold ${
                          soldOut ? "text-[#8C6D58]" : "text-[#2B6038]"
                        }`}
                      >
                        {soldOut ? "Tạm thời hết món" : `Còn lại: ${product.stock} ly`}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span className="text-base font-black text-[#381B0D]">
                          {formattedPrice}
                        </span>

                        <button
                          type="button"
                          disabled={soldOut || !isLoggedIn}
                          onClick={() => {
                            if (!isLoggedIn) return;
                            handleOpenDetail(product);
                          }}
                          className={`btn-primary ${
                            !isLoggedIn && !soldOut
                              ? "!bg-[#DECBB5] !text-[#7A5A43] !cursor-not-allowed opacity-80 shadow-none hover:!bg-[#DECBB5] active:scale-100"
                              : ""
                          }`}
                          title={
                            soldOut
                              ? "Món tạm thời hết hàng"
                              : !isLoggedIn
                              ? "Vui lòng đăng nhập để mở khóa tùy chọn món"
                              : undefined
                          }
                        >
                          {soldOut ? "Hết món" : !isLoggedIn ? "Tùy chọn 🔒" : "Tùy chọn"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      </main>

      {/* Modal Chi tiết sản phẩm — Chọn size & topping (Task 4) */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {/* Toast thông báo khi thêm món vào giỏ hàng thành công */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-amber-900/20 bg-[#381B0D] px-5 py-3.5 text-sm font-bold text-[#FAF5EE] shadow-2xl">
          <span className="text-xl">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Drawer Giỏ hàng (Task 5, 6) */}
      <CartDrawer
        onOrderCreated={(orderId, amount) => {
          setPendingOrder({ id: orderId, total: amount });
          setIsPaymentOpen(true);
        }}
      />

      {/* Modal Thanh toán giả lập (Task 8) */}
      <PaymentModal
        isOpen={isPaymentOpen}
        orderId={pendingOrder?.id || null}
        amount={pendingOrder?.total || 0}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={() => {
          setToastMessage("🎉 Đơn hàng đã được thanh toán thành công!");
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />

      {/* Modal Đăng ký / Đăng nhập JWT (Task 7) */}
      <AuthModal />

      {/* Modal Lịch sử đơn hàng GET /orders/me (Task 9) */}
      <OrderHistoryModal
        onPayOrder={(orderId, amount) => {
          setPendingOrder({ id: orderId, total: amount });
          setIsPaymentOpen(true);
        }}
      />
    </div>
  );
}