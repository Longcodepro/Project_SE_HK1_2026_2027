import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Chỉ cần strategy 'jwt' đã được AuthModule đăng ký; guard này dùng được ở mọi module mà không phải import AuthModule
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
