import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuthModule } from './modules/auth/auth.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { CustomersModule } from './modules/customers/customers.module';
import { FinancialModule } from './modules/financial/financial.module';
import { PayablesModule } from './modules/payables/payables.module';
import { ProductsModule } from './modules/products/products.module';
import { ReceivablesModule } from './modules/receivables/receivables.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SalesModule } from './modules/sales/sales.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StockModule } from './modules/stock/stock.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    StockModule,
    CustomersModule,
    SalesModule,
    CashRegisterModule,
    FinancialModule,
    ReceivablesModule,
    PayablesModule,
    ReportsModule,
  ],
  providers: [
    // Autenticação e autorização globais (NFR-05)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
