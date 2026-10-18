import { createHash } from 'crypto';

export type OtpPurpose = 'REGISTER' | 'RESET_PASSWORD';

export interface OtpRecord {
  id: number;
  phone: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  createdAt: Date;
}

// BR27: mã 6 số, hạn 5 phút, sai quá 5 lần mất hiệu lực, gửi lại cách nhau tối thiểu 60 giây
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const otpResendSeconds = () => Number(process.env.OTP_RESEND_SECONDS ?? 60);

// Gắn mã với số điện thoại để cùng một mã không dùng chéo được giữa hai số
export const hashOtp = (phone: string, code: string) => createHash('sha256').update(`${phone}:${code}`).digest('hex');

export const isOtpUsable = (r: OtpRecord | null, now: Date): r is OtpRecord =>
  !!r && !r.consumedAt && r.expiresAt > now && r.attempts < OTP_MAX_ATTEMPTS;
