// Lỗi nghiệp vụ thuần, không biết gì về HTTP. Mỗi lỗi mang sẵn mã trạng thái tương ứng
// để lớp presentation (DomainErrorFilter) đổi thành response mà không cần if-else.
export class DomainError extends Error {
  readonly status: number = 400;
}

export class BadRequestError extends DomainError {
  readonly status = 400;
}
export class UnauthorizedError extends DomainError {
  readonly status = 401;
}
export class ForbiddenError extends DomainError {
  readonly status = 403;
}
export class NotFoundError extends DomainError {
  readonly status = 404;
}
export class ConflictError extends DomainError {
  readonly status = 409;
}
// Vi phạm quy tắc nghiệp vụ (BRxx) dù dữ liệu đúng dạng
export class UnprocessableError extends DomainError {
  readonly status = 422;
}
