import { Page, PageRequest } from '../../../shared/domain/page';
import { Topping } from './topping';

export abstract class ToppingRepository {
  abstract listAll(page: PageRequest): Promise<Page<Topping>>;
  abstract findById(id: number): Promise<Topping | null>;
  abstract findByName(name: string): Promise<Topping | null>;
  abstract findByIds(ids: number[]): Promise<Topping[]>;
  abstract create(data: { name: string; price: number }): Promise<Topping>;
  abstract update(id: number, patch: Partial<Omit<Topping, 'id'>>): Promise<Topping>;
}
