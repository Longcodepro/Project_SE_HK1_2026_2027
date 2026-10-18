import { GatewayRequest, GatewayResult } from './payment';

// Cổng thanh toán. Hiện chỉ có bản giả lập (MockPaymentGateway); muốn nối cổng thật chỉ cần viết lớp khác cho port này.
export abstract class PaymentGateway {
  abstract charge(request: GatewayRequest): Promise<GatewayResult>;
}
