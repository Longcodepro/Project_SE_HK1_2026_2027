// Lỗi nghiệp vụ thuần, không biết gì về HTTP. Lớp presentation tự map sang mã HTTP.
export class DomainError extends Error {}

export class NotFoundError extends DomainError {}
