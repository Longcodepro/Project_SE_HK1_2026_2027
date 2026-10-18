import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { GatewayRequest, GatewayResult } from '../domain/payment';
import { PaymentGateway } from '../domain/payment.gateway';

const TEN_MINUTES = 10 * 60 * 1000;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Cổng giả lập mô phỏng Momo/VNPay/Stripe (BR41):
//  - EWALLET: luôn thành công (chưa có số dư thật)
//  - CARD: 4000 0000 0000 0002 luôn bị từ chối, mọi số thẻ hợp lệ khác thành công (4111 1111 1111 1111 là thẻ thử chuẩn)
//  - TRANSFER: sinh mã tham chiếu hiệu lực 10 phút, "tự xác nhận" sau vài giây rồi báo thành công
@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  async charge(req: GatewayRequest): Promise<GatewayResult> {
    const ref = (prefix: string) => `${prefix}-${Date.now()}-${randomInt(1000, 10000)}`;

    if (req.method === 'EWALLET') return { success: true, gatewayRef: ref('MOCK-EW') };

    if (req.method === 'CARD') {
      if (req.card?.number === '4000000000000002') return { success: false, gatewayRef: null, failureReason: 'Thẻ bị từ chối' };
      return { success: true, gatewayRef: ref('MOCK-CARD') };
    }

    const transferRef = `BL${String(Date.now()).slice(-6)}${randomInt(1000, 10000)}`;
    await wait(Number(process.env.MOCK_TRANSFER_DELAY_MS ?? 1500));
    return { success: true, gatewayRef: ref('MOCK-TF'), transferRef, expiresAt: new Date(Date.now() + TEN_MINUTES) };
  }
}
