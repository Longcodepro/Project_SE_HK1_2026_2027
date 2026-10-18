import { BadRequestError } from '../../../shared/domain/domain.error';
import { todayVN } from '../../../shared/domain/vn-time';

export type ProductStatus = 'ON_SALE' | 'SOLD_OUT' | 'LOCKED';
export type Temperature = 'HOT' | 'COLD';
export type SizeCode = 'S' | 'M' | 'L';

export interface ProductSize {
  sizeCode: SizeCode;
  price: number;
  volumeMl: number | null;
}

export interface ProductTopping {
  id: number;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface Product {
  id: number;
  categoryId: number;
  category: { id: number; name: string; isVisible: boolean };
  name: string;
  description: string | null;
  imageUrl: string | null;
  status: ProductStatus;
  allowHot: boolean;
  allowCold: boolean;
  defaultTemperature: Temperature;
  maxPerTopping: number;
  maxToppingTotal: number;
  dailyQuota: number;
  stockRemaining: number;
  stockDate: Date | null;
  stockVersion: number;
  iceMin: number;
  iceMax: number;
  iceDefault: number;
  sugarMin: number;
  sugarMax: number;
  sugarDefault: number;
  sizes: ProductSize[];
  toppings: ProductTopping[];
}

// Phần quản lý nhập khi tạo hoặc sửa món (UC41-UC46)
export interface ProductSpec {
  categoryId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sizes: ProductSize[];
  toppingIds: number[];
  maxPerTopping: number;
  maxToppingTotal: number;
  allowHot: boolean;
  allowCold: boolean;
  defaultTemperature: Temperature;
  iceMin: number;
  iceMax: number;
  iceDefault: number;
  sugarMin: number;
  sugarMax: number;
  sugarDefault: number;
}

// BR49: số ly còn lại hôm nay; sang ngày mới mà chưa nhập thì là 0
export const remainingToday = (p: Pick<Product, 'stockDate' | 'stockRemaining'>, now = new Date()): number =>
  p.stockDate && p.stockDate.getTime() === todayVN(now).getTime() ? p.stockRemaining : 0;

// Đặt được khi còn bán và còn ly trong ngày (BR02)
export const isOrderable = (p: Product, now = new Date()): boolean => p.status === 'ON_SALE' && remainingToday(p, now) > 0;

// BR01: lên menu khi không bị khóa và danh mục đang hiện
export const isOnMenu = (p: Pick<Product, 'status' | 'category'>): boolean => p.status !== 'LOCKED' && p.category.isVisible;

export const specOf = (p: Product): ProductSpec => ({
  categoryId: p.categoryId,
  name: p.name,
  description: p.description,
  imageUrl: p.imageUrl,
  sizes: p.sizes,
  toppingIds: p.toppings.map((t) => t.id),
  maxPerTopping: p.maxPerTopping,
  maxToppingTotal: p.maxToppingTotal,
  allowHot: p.allowHot,
  allowCold: p.allowCold,
  defaultTemperature: p.defaultTemperature,
  iceMin: p.iceMin,
  iceMax: p.iceMax,
  iceDefault: p.iceDefault,
  sugarMin: p.sugarMin,
  sugarMax: p.sugarMax,
  sugarDefault: p.sugarDefault,
});

// Các quy tắc chéo giữa nhiều trường mà class-validator không diễn đạt được (BR04, BR34, BR35, BR37)
export function assertValidSpec(s: ProductSpec): void {
  if (new Set(s.sizes.map((x) => x.sizeCode)).size !== s.sizes.length) throw new BadRequestError('Size không được trùng nhau');
  if (s.sizes.length === 0) throw new BadRequestError('Món phải có ít nhất một size');
  if (!s.allowHot && !s.allowCold) throw new BadRequestError('Món phải cho phép ít nhất một nhiệt độ (nóng hoặc lạnh)');
  if ((s.defaultTemperature === 'HOT' && !s.allowHot) || (s.defaultTemperature === 'COLD' && !s.allowCold)) {
    throw new BadRequestError('Nhiệt độ mặc định phải thuộc nhiệt độ được phép');
  }
  const range = (label: string, min: number, def: number, max: number) => {
    if (!(0 <= min && min <= def && def <= max && max <= 100)) throw new BadRequestError(`Mức ${label} phải thỏa 0 ≤ min ≤ mặc định ≤ max ≤ 100`);
  };
  range('đá', s.iceMin, s.iceDefault, s.iceMax);
  range('đường', s.sugarMin, s.sugarDefault, s.sugarMax);
  if (s.toppingIds.length > 0) {
    if (!(1 <= s.maxPerTopping && s.maxPerTopping <= s.maxToppingTotal && s.maxToppingTotal <= 10)) {
      throw new BadRequestError('Món có topping phải thỏa 1 ≤ tối đa mỗi loại ≤ tổng tối đa ≤ 10');
    }
  } else if (s.maxPerTopping !== 0 || s.maxToppingTotal !== 0) {
    throw new BadRequestError('Món không có topping thì giới hạn topping phải bằng 0');
  }
}
