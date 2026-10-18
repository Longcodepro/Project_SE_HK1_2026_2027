import { isOrderable, Product, remainingToday } from '../domain/product';

// Dạng trả cho khách: chỉ topping đang bán, không lộ hạn mức và phiên bản kho
export const toMenuView = (p: Product, now = new Date()) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  imageUrl: p.imageUrl,
  status: p.status,
  category: { id: p.category.id, name: p.category.name },
  sizes: p.sizes,
  priceFrom: Math.min(...p.sizes.map((s) => s.price)),
  toppings: p.toppings.filter((t) => t.isAvailable),
  allowHot: p.allowHot,
  allowCold: p.allowCold,
  defaultTemperature: p.defaultTemperature,
  maxPerTopping: p.maxPerTopping,
  maxToppingTotal: p.maxToppingTotal,
  iceMin: p.iceMin,
  iceMax: p.iceMax,
  iceDefault: p.iceDefault,
  sugarMin: p.sugarMin,
  sugarMax: p.sugarMax,
  sugarDefault: p.sugarDefault,
  remainingToday: remainingToday(p, now),
  orderable: isOrderable(p, now),
});

// Dạng trả cho quản trị: đủ topping (kể cả đang khóa), hạn mức ngày và danh mục
export const toAdminView = (p: Product, now = new Date()) => ({
  ...toMenuView(p, now),
  categoryId: p.categoryId,
  categoryVisible: p.category.isVisible,
  toppings: p.toppings,
  dailyQuota: p.dailyQuota,
  stockRemaining: p.stockRemaining,
  stockDate: p.stockDate,
});
