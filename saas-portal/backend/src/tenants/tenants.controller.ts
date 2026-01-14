import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ExcelParserService } from './excel-parser.service';
import type { Express } from 'express';
import { TenantStatus } from './tenants.entity';
import { ProvisioningService } from 'src/provisioning/provisioning.service';

@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly excelParserService: ExcelParserService,
    private readonly provisioningService: ProvisioningService,
  ) {}

  @Post()
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post(':id/upload-config')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadConfig(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }
    const parsed = this.excelParserService.parseSchoolConfig(file.buffer);
    await this.tenantsService.saveConfig(
      id,
      parsed as unknown as Record<string, unknown>,
    );
    return parsed;
  }

  @Post(':id/deploy')
  async deploy(@Param('id') id: string) {
    const tenant = await this.tenantsService.findOne(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    if (tenant.deploymentStatus !== TenantStatus.READY) {
      throw new BadRequestException('Tenant configuration missing');
    }

    tenant.deploymentStatus = TenantStatus.DEPLOYING;
    await this.tenantsService.save(tenant);

    try {
      const result = await this.provisioningService.deployTenant(tenant);
      tenant.containerId = result.containerId;
      tenant.deploymentStatus = TenantStatus.ACTIVE;
      await this.tenantsService.save(tenant);

      return {
        message: 'Deployment succeeded',
        tenant,
        adminCredentials: {
          email: result.sysadminEmail,
          password: result.sysadminPassword,
        },
      };
    } catch (error) {
      tenant.deploymentStatus = TenantStatus.ERROR;
      await this.tenantsService.save(tenant);
      throw new InternalServerErrorException('Deployment failed');
    }
  }
}
