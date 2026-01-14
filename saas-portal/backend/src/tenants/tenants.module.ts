import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { Tenant } from './tenants.entity';
import { ProvisioningModule } from 'src/provisioning/provisioning.module';
import { ExcelParserService } from './excel-parser.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    ProvisioningModule
  ],
  controllers: [TenantsController],
  providers: [TenantsService, ExcelParserService],
  exports: [TenantsService],
})
export class TenantsModule {}
