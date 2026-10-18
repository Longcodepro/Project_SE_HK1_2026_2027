import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, MANAGER_ONLY, STAFF_UP } from '../../../shared/domain/auth-user';
import { Auth, CurrentUser } from '../../../shared/presentation/auth/auth.decorator';
import { HandleMissingItemUseCase, ListItemIssuesUseCase } from '../application/item-issue.use-cases';
import { HandleMissingItemDto, ItemIssueQuery } from './dto/item-issues.dto';

@ApiTags('item-issues')
@Controller('admin')
export class ItemIssuesController {
  constructor(
    private readonly handle: HandleMissingItemUseCase,
    private readonly list: ListItemIssuesUseCase,
  ) {}

  @Post('orders/:id/item-issues')
  @Auth(...STAFF_UP)
  create(@CurrentUser() staff: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: HandleMissingItemDto) {
    return this.handle.execute({ orderId: id, actorId: staff.id, ...dto });
  }

  @Get('item-issues')
  @Auth(...MANAGER_ONLY)
  findAll(@Query() q: ItemIssueQuery) {
    return this.list.execute({ from: q.from, to: q.to, resolution: q.resolution }, { page: q.page, pageSize: q.pageSize });
  }
}
