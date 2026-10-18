import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

// BR22: số điện thoại gồm đúng 10 chữ số, bắt đầu bằng 0
export const IsPhone = () => applyDecorators(IsString(), Matches(/^0\d{9}$/, { message: 'Số điện thoại gồm 10 chữ số và bắt đầu bằng 0' }));

// Cắt khoảng trắng hai đầu chuỗi trước khi validate
export const Trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

// Email lưu chữ thường (BR22)
export const LowerCase = () => Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));

// Mã OTP đúng 6 chữ số
export const IsOtpCode = () => applyDecorators(IsString(), Matches(/^\d{6}$/, { message: 'Mã xác thực gồm đúng 6 chữ số' }));
