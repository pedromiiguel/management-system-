import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PayableInput, payableSchema, Permission } from '@beverage/shared';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PayablesService } from './payables.service';

@Controller('payables')
export class PayablesController {
  constructor(private readonly payablesService: PayablesService) {}

  @Get()
  @RequirePermission(Permission.FINANCIAL_READ)
  list(@Query('status') status?: 'OPEN' | 'PAID') {
    return this.payablesService.list(status);
  }

  @Post()
  @RequirePermission(Permission.FINANCIAL_WRITE)
  create(@Body(new ZodValidationPipe(payableSchema)) body: PayableInput) {
    return this.payablesService.create(body);
  }

  @Post(':id/pay')
  @RequirePermission(Permission.FINANCIAL_WRITE)
  pay(@Param('id') id: string) {
    return this.payablesService.pay(id);
  }
}
