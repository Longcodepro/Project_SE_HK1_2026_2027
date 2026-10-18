import { OtpPurpose, OtpRecord } from './otp';

export abstract class OtpRepository {
  abstract create(data: { phone: string; purpose: OtpPurpose; codeHash: string; expiresAt: Date }): Promise<void>;
  abstract findLatest(phone: string, purpose: OtpPurpose): Promise<OtpRecord | null>;
  abstract increaseAttempts(id: number): Promise<void>;
  abstract consume(id: number, at: Date): Promise<void>;
}
