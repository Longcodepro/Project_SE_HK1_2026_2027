export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-amber-50 p-8">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-amber-800">☕ BrewLite</h1>
        <p className="mb-2 text-xl text-amber-600">Đặt cà phê không dùng tiền mặt</p>
        <p className="text-sm text-amber-400">Nhóm 2 — Sprint 1 đang chạy</p>
        <div className="mt-8 rounded-lg bg-amber-100 p-6 text-amber-700">
          <p className="font-semibold">Khung dự án đã sẵn sàng</p>
          <p className="mt-1 text-sm">Xem <code className="rounded bg-amber-200 px-1">docs/BACKLOG.md</code> để bắt đầu</p>
        </div>
      </div>
    </main>
  );
}
