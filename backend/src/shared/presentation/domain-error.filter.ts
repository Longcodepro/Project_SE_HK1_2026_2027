import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../domain/domain.error';

// Đổi lỗi nghiệp vụ thành response, giữ dạng { statusCode, message } như API-CONTRACT
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().status(error.status).json({
      statusCode: error.status,
      message: error.message,
    });
  }
}
