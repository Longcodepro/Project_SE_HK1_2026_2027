// Sinh mã OTP. Môi trường dev dùng mã cố định để dễ test, production sinh ngẫu nhiên.
export abstract class OtpCodeProvider {
  abstract generate(): string;
}
