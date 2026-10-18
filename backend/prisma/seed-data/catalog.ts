// Dữ liệu thực đơn mẫu: danh mục, topping, món. Ảnh lấy lại các URL Unsplash nhóm đã dùng.
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=85`;

export const CATEGORIES = [
  { id: 1, name: 'Cà phê', isVisible: true },
  { id: 2, name: 'Trà trái cây', isVisible: true },
  { id: 3, name: 'Trà sữa', isVisible: true },
  { id: 4, name: 'Đá xay và matcha', isVisible: true },
  { id: 5, name: 'Nước ép và soda', isVisible: true },
  { id: 6, name: 'Bánh ngọt', isVisible: true },
  { id: 7, name: 'Menu mùa hè (đang ẩn)', isVisible: false },
];

export const TOPPINGS = [
  { id: 1, name: 'Trân châu đen', price: 7000, isAvailable: true },
  { id: 2, name: 'Trân châu trắng', price: 7000, isAvailable: true },
  { id: 3, name: 'Thạch dừa', price: 6000, isAvailable: true },
  { id: 4, name: 'Thạch trái cây', price: 6000, isAvailable: true },
  { id: 5, name: 'Kem phô mai', price: 10000, isAvailable: true },
  { id: 6, name: 'Shot espresso', price: 12000, isAvailable: true },
  { id: 7, name: 'Sốt caramel', price: 8000, isAvailable: true },
  { id: 8, name: 'Kem trứng', price: 11000, isAvailable: true },
  { id: 9, name: 'Sữa yến mạch', price: 9000, isAvailable: false },
  { id: 10, name: 'Pudding trứng', price: 8000, isAvailable: true },
  { id: 11, name: 'Hạt chia', price: 5000, isAvailable: true },
  { id: 12, name: 'Kem whipping', price: 7000, isAvailable: true },
];

export type SeedProduct = {
  categoryId: number;
  name: string;
  priceM: number;
  imageUrl: string;
  toppings: number[];
  status?: 'ON_SALE' | 'SOLD_OUT' | 'LOCKED';
  temp?: 'both' | 'hotOnly' | 'coldOnly';
  defaultHot?: boolean;
  noOptions?: boolean; // bánh: không đá, không đường, một size
  quota?: number;
  staleStock?: boolean; // chưa nhập số ly hôm nay (BR49)
};

const COFFEE_TOP = [6, 5, 7, 8, 12];
const TEA_TOP = [1, 2, 3, 4, 5, 11];
const MILKTEA_TOP = [1, 2, 3, 5, 10, 12];
const BLEND_TOP = [12, 7, 1, 5];
const JUICE_TOP = [4, 11, 3];

export const PRODUCTS: SeedProduct[] = [
  { categoryId: 1, name: 'Cà phê sữa đá', priceM: 32000, imageUrl: img('photo-1578314675249-a6910f80cc4e'), toppings: COFFEE_TOP, temp: 'both', quota: 80 },
  { categoryId: 1, name: 'Cà phê đen đá', priceM: 28000, imageUrl: img('photo-1517701550927-30cf4ba1dba5'), toppings: [6, 7], temp: 'both', quota: 70 },
  { categoryId: 1, name: 'Bạc xỉu', priceM: 38000, imageUrl: img('photo-1534687941688-651ccaafbff8'), toppings: COFFEE_TOP, temp: 'both', quota: 60 },
  { categoryId: 1, name: 'Americano', priceM: 40000, imageUrl: img('photo-1514432324607-a09d9b4aefdd'), toppings: [6], temp: 'both', defaultHot: true, quota: 50 },
  { categoryId: 1, name: 'Espresso', priceM: 30000, imageUrl: img('photo-1559496417-e7f25cb247f3'), toppings: [], temp: 'hotOnly', quota: 45 },
  { categoryId: 1, name: 'Cappuccino', priceM: 45000, imageUrl: img('photo-1572442388796-11668a67e53d'), toppings: COFFEE_TOP, temp: 'both', defaultHot: true, quota: 40 },
  { categoryId: 1, name: 'Latte', priceM: 45000, imageUrl: img('photo-1534778101976-62847782c213'), toppings: COFFEE_TOP, temp: 'both', defaultHot: true, quota: 40 },
  { categoryId: 1, name: 'Caramel Macchiato', priceM: 55000, imageUrl: img('photo-1579888071069-c107a6f79d82'), toppings: COFFEE_TOP, temp: 'both', quota: 30 },
  { categoryId: 1, name: 'Cold Brew', priceM: 48000, imageUrl: img('photo-1461023058943-07fcbe16d735'), toppings: [6, 5], temp: 'coldOnly', quota: 35 },
  { categoryId: 1, name: 'Cà phê muối', priceM: 42000, imageUrl: img('photo-1517701550927-30cf4ba1dba5'), toppings: [5, 8], temp: 'both', quota: 50 },

  { categoryId: 2, name: 'Trà đào cam sả', priceM: 45000, imageUrl: img('photo-1556679343-c7306c1976bc'), toppings: TEA_TOP, temp: 'both', quota: 60 },
  { categoryId: 2, name: 'Trà vải', priceM: 42000, imageUrl: img('photo-1546173159-315724a31696'), toppings: TEA_TOP, temp: 'coldOnly', quota: 50 },
  { categoryId: 2, name: 'Trà xoài nhiệt đới', priceM: 42000, imageUrl: img('photo-1546173159-315724a31696'), toppings: TEA_TOP, temp: 'coldOnly', quota: 45 },
  { categoryId: 2, name: 'Trà thảo mộc', priceM: 36000, imageUrl: img('photo-1576092768241-dec231879fc3'), toppings: [11, 4], temp: 'both', defaultHot: true, quota: 40 },
  { categoryId: 2, name: 'Trà dâu tây', priceM: 46000, imageUrl: img('photo-1556679343-c7306c1976bc'), toppings: TEA_TOP, temp: 'coldOnly', quota: 40, status: 'SOLD_OUT' },
  { categoryId: 2, name: 'Trà ổi hồng', priceM: 44000, imageUrl: img('photo-1576092768241-dec231879fc3'), toppings: TEA_TOP, temp: 'coldOnly', quota: 35 },

  { categoryId: 3, name: 'Trà sữa trân châu', priceM: 45000, imageUrl: img('photo-1558857563-b371033873b8'), toppings: MILKTEA_TOP, temp: 'coldOnly', quota: 90 },
  { categoryId: 3, name: 'Trà sữa matcha', priceM: 48000, imageUrl: img('photo-1515823064-d6e0c04616a7'), toppings: MILKTEA_TOP, temp: 'coldOnly', quota: 50 },
  { categoryId: 3, name: 'Trà sữa khoai môn', priceM: 46000, imageUrl: img('photo-1558857563-b371033873b8'), toppings: MILKTEA_TOP, temp: 'coldOnly', quota: 45 },
  { categoryId: 3, name: 'Hồng trà sữa', priceM: 40000, imageUrl: img('photo-1558857563-b371033873b8'), toppings: MILKTEA_TOP, temp: 'both', quota: 60 },
  { categoryId: 3, name: 'Trà sữa socola', priceM: 47000, imageUrl: img('photo-1572490122747-3968b75cc699'), toppings: MILKTEA_TOP, temp: 'coldOnly', quota: 40 },
  { categoryId: 3, name: 'Sữa tươi trân châu đường đen', priceM: 50000, imageUrl: img('photo-1558857563-b371033873b8'), toppings: [1, 2, 10], temp: 'coldOnly', quota: 70 },

  { categoryId: 4, name: 'Matcha Latte', priceM: 52000, imageUrl: img('photo-1515823064-d6e0c04616a7'), toppings: BLEND_TOP, temp: 'both', quota: 40 },
  { categoryId: 4, name: 'Đá xay socola Oreo', priceM: 58000, imageUrl: img('photo-1572490122747-3968b75cc699'), toppings: BLEND_TOP, temp: 'coldOnly', quota: 30 },
  { categoryId: 4, name: 'Đá xay cookie', priceM: 56000, imageUrl: img('photo-1572490122747-3968b75cc699'), toppings: BLEND_TOP, temp: 'coldOnly', quota: 30 },
  { categoryId: 4, name: 'Sinh tố bơ', priceM: 55000, imageUrl: img('photo-1600271886742-f049cd451bba'), toppings: [11, 12], temp: 'coldOnly', quota: 25 },
  { categoryId: 4, name: 'Sinh tố xoài', priceM: 50000, imageUrl: img('photo-1546173159-315724a31696'), toppings: [11, 4], temp: 'coldOnly', quota: 25 },
  { categoryId: 4, name: 'Cacao nóng', priceM: 42000, imageUrl: img('photo-1517487881594-2787fef5ebf7'), toppings: [12, 7], temp: 'hotOnly', quota: 30 },

  { categoryId: 5, name: 'Nước cam ép', priceM: 40000, imageUrl: img('photo-1600271886742-f049cd451bba'), toppings: JUICE_TOP, temp: 'coldOnly', quota: 40 },
  { categoryId: 5, name: 'Nước ép dưa hấu', priceM: 38000, imageUrl: img('photo-1600271886742-f049cd451bba'), toppings: JUICE_TOP, temp: 'coldOnly', quota: 35 },
  { categoryId: 5, name: 'Soda chanh bạc hà', priceM: 38000, imageUrl: img('photo-1513558161293-cdaf765ed2fd'), toppings: JUICE_TOP, temp: 'coldOnly', quota: 50 },
  { categoryId: 5, name: 'Soda dâu', priceM: 40000, imageUrl: img('photo-1513558161293-cdaf765ed2fd'), toppings: JUICE_TOP, temp: 'coldOnly', quota: 40 },
  { categoryId: 5, name: 'Nước ép cà rốt', priceM: 38000, imageUrl: img('photo-1600271886742-f049cd451bba'), toppings: [], temp: 'coldOnly', quota: 0, staleStock: true },

  { categoryId: 6, name: 'Bánh quy socola', priceM: 25000, imageUrl: img('photo-1544787219-7f47ccb76574'), toppings: [], noOptions: true, quota: 48 },
  { categoryId: 6, name: 'Bánh crepe dâu', priceM: 48000, imageUrl: img('photo-1587314168485-3236d6710814'), toppings: [], noOptions: true, quota: 20 },
  { categoryId: 6, name: 'Tiramisu', priceM: 52000, imageUrl: img('photo-1587314168485-3236d6710814'), toppings: [], noOptions: true, quota: 20 },
  { categoryId: 6, name: 'Bánh flan', priceM: 25000, imageUrl: img('photo-1544787219-7f47ccb76574'), toppings: [], noOptions: true, quota: 30 },
  { categoryId: 6, name: 'Croissant bơ', priceM: 35000, imageUrl: img('photo-1544787219-7f47ccb76574'), toppings: [], noOptions: true, quota: 25, status: 'LOCKED' },

  { categoryId: 7, name: 'Trà sen vàng', priceM: 48000, imageUrl: img('photo-1576092768241-dec231879fc3'), toppings: TEA_TOP, temp: 'coldOnly', quota: 30 },
];
