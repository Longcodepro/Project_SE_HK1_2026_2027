// Cổng hỏi "các món này có tồn tại không" mà không kéo cả module thực đơn vào domain của khuyến mãi
export abstract class ProductExistence {
  abstract allExist(ids: number[]): Promise<boolean>;
}
