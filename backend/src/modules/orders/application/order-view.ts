import { OrderDetail, pickupCodeFor } from '../domain/order';

// Dạng trả cho khách: chỉ thấy mã nhận hàng khi đơn READY (UC26)
export const toCustomerView = (o: OrderDetail) => ({
  id: o.id,
  orderCode: o.orderCode,
  status: o.status,
  subtotal: o.subtotal,
  discountAmount: o.discountAmount,
  totalAmount: o.totalAmount,
  promotionCode: o.promotionCode,
  pointsAwarded: o.pointsAwarded,
  pickupCode: pickupCodeFor(o),
  cancelReason: o.cancelReason,
  cancelNote: o.cancelNote,
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
  items: o.items,
  payments: o.payments,
  feedback: o.feedback,
});

// Dạng trả cho nhân viên và quản lý (UC32, UC33): thêm khách, hoàn tiền, người hủy, mã nhận hàng
export const toStaffView = (o: OrderDetail) => ({
  ...toCustomerView(o),
  pickupCode: o.pickupCode,
  customer: { id: o.user.id, phone: o.user.phone, fullName: o.user.fullName },
  refunds: o.refunds,
  cancelledByUserId: o.cancelledByUserId,
});
