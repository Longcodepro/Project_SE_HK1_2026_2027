// Cổng chạy nhiều thao tác trong một giao dịch. Use case không cần biết giao dịch của DB nào:
// mọi repository gọi bên trong run() tự dùng chung giao dịch đó.
export abstract class TransactionRunner {
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}
