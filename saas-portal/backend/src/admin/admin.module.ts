import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { LeadsModule } from 'src/leads/leads.module';
import { TenantsModule } from 'src/tenants/tenants.module';

@Module({
  imports: [
    LeadsModule,
    TenantsModule
  ],
  controllers: [AdminController],
  providers: [AdminController],
  exports: [AdminController],
})
export class AdminModule {}
