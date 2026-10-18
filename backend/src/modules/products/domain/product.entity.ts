export class Product {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly price: number,
    readonly imageUrl: string | null,
    readonly stock: number,
  ) {}
}
