import { Page, PageRequest } from '../../../shared/domain/page';
import { ItemIssueRow, ItemResolution, NewItemIssue } from './item-issue';

export abstract class ItemIssueRepository {
  abstract create(data: NewItemIssue): Promise<{ id: number }>;
  // Số ly của một dòng đơn đã được xử lý, để biết còn lại bao nhiêu
  abstract handledQuantity(orderItemId: number): Promise<number>;
  abstract list(filter: { from?: Date; to?: Date; resolution?: ItemResolution }, page: PageRequest): Promise<Page<ItemIssueRow>>;
}
