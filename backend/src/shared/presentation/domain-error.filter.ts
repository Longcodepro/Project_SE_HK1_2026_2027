import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainError, NotFoundError } from '../domain/domain.error';

// Đổi lỗi nghiệp vụ thành response, giữ dạng { statusCode, message } như API-CONTRACT
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    const statusCode =
      error instanceof NotFoundError ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
    host.switchToHttp().getResponse<Response>().status(statusCode).json({
      statusCode,
      message: error.message,
    });
  }
}
