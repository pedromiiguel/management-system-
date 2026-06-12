import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import {
  AddSaleItemInput,
  addSaleItemSchema,
  CompleteSaleInput,
  completeSaleSchema,
  DiscountInput,
  discountSchema,
  Permission,
  UpdateSaleItemInput,
  updateSaleItemSchema,
} from '@beverage/shared';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @RequirePermission(Permission.SALES_OPERATE)
  open(@CurrentUser() user: AuthUser) {
    return this.salesService.open(user.id);
  }

  @Get('history')
  @RequirePermission(Permission.SALES_HISTORY)
  history(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
  ) {
    return this.salesService.history({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      status,
      page: page ? Number(page) : undefined,
    });
  }

  @Get(':id')
  @RequirePermission(Permission.SALES_OPERATE)
  getById(@Param('id') id: string) {
    return this.salesService.getById(id);
  }

  @Post(':id/items')
  @RequirePermission(Permission.SALES_OPERATE)
  addItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addSaleItemSchema)) body: AddSaleItemInput,
  ) {
    return this.salesService.addItem(id, body);
  }

  @Patch(':id/items/:itemId')
  @RequirePermission(Permission.SALES_OPERATE)
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateSaleItemSchema)) body: UpdateSaleItemInput,
  ) {
    return this.salesService.updateItem(id, itemId, body.quantity);
  }

  @Delete(':id/items/:itemId')
  @RequirePermission(Permission.SALES_OPERATE)
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.salesService.removeItem(id, itemId);
  }

  @Put(':id/discount')
  @RequirePermission(Permission.SALES_OPERATE)
  setDiscount(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(discountSchema.nullable())) body: DiscountInput | null,
  ) {
    return this.salesService.setDiscount(id, body);
  }

  @Post(':id/complete')
  @RequirePermission(Permission.SALES_OPERATE)
  complete(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(completeSaleSchema)) body: CompleteSaleInput,
  ) {
    return this.salesService.complete(id, body);
  }

  @Post(':id/cancel')
  @RequirePermission(Permission.SALES_OPERATE)
  cancelInProgress(@Param('id') id: string) {
    return this.salesService.cancelInProgress(id);
  }

  @Post(':id/void')
  @RequirePermission(Permission.SALES_VOID)
  void(@Param('id') id: string) {
    return this.salesService.void(id);
  }
}
