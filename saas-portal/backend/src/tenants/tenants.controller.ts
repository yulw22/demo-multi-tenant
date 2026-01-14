import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ExcelParserService } from './excel-parser.service';
import { TenantStatus } from './tenants.entity'; // Import Enum
import { ProvisioningService } from 'src/provisioning/provisioning.service';
import type { Express } from 'express';

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

    // Lưu config và chuyển trạng thái sang READY
    await this.tenantsService.saveConfig(
      id,
      parsed as unknown as Record<string, unknown>,
    );
    return parsed;
  }

  @Post(':id/deploy')
  async deploy(@Param('id') id: string) {
    // 1. Tìm Tenant
    const tenant = await this.tenantsService.findOne(id);

    // SỬA: Dùng Enum để so sánh cho chuẩn
    if (tenant?.deploymentStatus !== TenantStatus.READY) {
      throw new BadRequestException(
        'Tenant not ready for deployment (Upload config first)',
      );
    }

    // 2. Update status -> DEPLOYING
    await this.tenantsService.updateStatus(id, TenantStatus.DEPLOYING);

    try {
      // 3. Gọi Deploy (Hàm này trả về credentials và containerId)
      // Đảm bảo method trong ProvisioningService tên là deployTenant nhé
      const result = await this.provisioningService.deployTenant(tenant);

      // 4. Update status -> ACTIVE (Kèm containerId)
      // Hàm updateStatus bây giờ đã nhận tham số thứ 3
      await this.tenantsService.updateStatus(
        id,
        TenantStatus.ACTIVE,
        result.containerId,
      );

      return {
        message: 'Deployment successful',
        credentials: result,
      };
    } catch (error) {
      // 5. Nếu lỗi -> Update status -> FAILED
      // Bắt buộc phải catch lỗi để DB không bị treo ở trạng thái DEPLOYING mãi mãi
      await this.tenantsService.updateStatus(id, TenantStatus.FAILED);
      throw error;
    }
  }
}
