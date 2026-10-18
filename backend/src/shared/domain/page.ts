// Danh sách phân trang dùng chung cho mọi màn quản trị (BR47)
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageRequest {
  page: number;
  pageSize: number;
}

export const toPage = <T>(items: T[], total: number, req: PageRequest): Page<T> => ({
  items,
  total,
  page: req.page,
  pageSize: req.pageSize,
});
