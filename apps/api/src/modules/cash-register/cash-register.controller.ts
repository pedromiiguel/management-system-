import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  CashMovementInput,
  cashMovementSchema,
  CloseRegisterInput,
  closeRegisterSchema,
  OpenRegisterInput,
  openRegisterSchema,
  Permission,
} from '@beverage/shared';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CashRegisterService } from './cash-register.service';

@Controller('cash-register')
@RequirePermission(Permission.CASH_OPERATE)
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Get('current')
  getCurrent() {
    return this.cashRegisterService.getCurrent();
  }

  @Get('history')
  listHistory() {
    return this.cashRegisterService.listHistory();
  }

  @Post('open')
  open(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(openRegisterSchema)) body: OpenRegisterInput,
  ) {
    return this.cashRegisterService.open(user.id, body);
  }

  @Post('movements')
  addMovement(@Body(new ZodValidationPipe(cashMovementSchema)) body: CashMovementInput) {
    return this.cashRegisterService.addMovement(body);
  }

  @Post('close')
  close(@Body(new ZodValidationPipe(closeRegisterSchema)) body: CloseRegisterInput) {
    return this.cashRegisterService.close(body);
  }
}
