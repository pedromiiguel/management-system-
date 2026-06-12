import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CustomerInput, customerSchema, Permission } from '@beverage/shared';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermission(Permission.CUSTOMERS_READ)
  list(@Query('search') search?: string) {
    return this.customersService.list(search);
  }

  @Post()
  @RequirePermission(Permission.CUSTOMERS_WRITE)
  create(@Body(new ZodValidationPipe(customerSchema)) body: CustomerInput) {
    return this.customersService.create(body);
  }

  @Patch(':id')
  @RequirePermission(Permission.CUSTOMERS_WRITE)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(customerSchema)) body: CustomerInput) {
    return this.customersService.update(id, body);
  }

  @Patch(':id/deactivate')
  @RequirePermission(Permission.CUSTOMERS_WRITE)
  deactivate(@Param('id') id: string) {
    return this.customersService.deactivate(id);
  }
}
