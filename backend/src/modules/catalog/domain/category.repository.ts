import { Page, PageRequest } from '../../../shared/domain/page';
import { Category } from './category';

export abstract class CategoryRepository {
  abstract listVisible(): Promise<Category[]>;
  abstract listAll(page: PageRequest): Promise<Page<Category>>;
  abstract findById(id: number): Promise<Category | null>;
  abstract findByName(name: string): Promise<Category | null>;
  abstract create(name: string): Promise<Category>;
  abstract update(id: number, patch: Partial<Pick<Category, 'name' | 'isVisible'>>): Promise<Category>;
}
