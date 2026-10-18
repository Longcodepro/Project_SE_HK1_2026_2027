// Quy tắc "ngày" của quán tính theo giờ Việt Nam (UTC+7), xem BR49.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

// Ngày hôm nay theo giờ VN, biểu diễn bằng 0h UTC của ngày đó (khớp cột @db.Date)
export function todayVN(now: Date = new Date()): Date {
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
}

export function sameVNDay(a: Date, b: Date): boolean {
  return todayVN(a).getTime() === todayVN(b).getTime();
}
