import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from './tenants.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
// Bỏ import ProvisioningService ở đây để tránh vòng lặp (Circular Dependency)
// vì Service này không cần gọi Deploy nữa (Controller sẽ gọi)

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
  ) {}

  // --- SỬA LOGIC CŨ ---
  // Hàm này giờ chỉ tạo Tenant ở trạng thái DRAFT hoặc PROVISIONING (chờ config)
  // Không tự động gọi Docker nữa để đảm bảo quy trình Concierge.
  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantsRepo.create({
      ...createTenantDto,
      deploymentStatus: TenantStatus.DRAFT, // Mặc định là Draft
      containerId: null,
    });
    return this.tenantsRepo.save(tenant);
  }

  async createDraft(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantsRepo.create({
      ...createTenantDto,
      deploymentStatus: TenantStatus.DRAFT,
      containerId: null,
    });
    return this.tenantsRepo.save(tenant);
  }

  findAll(): Promise<Tenant[]> {
    return this.tenantsRepo.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<Tenant | null> {
    return this.tenantsRepo.findOne({ where: { id } });
  }

  async save(tenant: Tenant): Promise<Tenant> {
    return this.tenantsRepo.save(tenant);
  }

  // --- SỬA LỖI QUAN TRỌNG TẠI ĐÂY ---
  // Thêm tham số containerId (optional)
  async updateStatus(
    id: string,
    status: TenantStatus,
    containerId?: string, // <--- Thêm cái này
  ): Promise<Tenant> {
    const tenant = await this.findOne(id);
    if (!tenant) throw new NotFoundException('Tenant not found');

    tenant.deploymentStatus = status;

    // Nếu có containerId truyền vào thì cập nhật luôn
    if (containerId) {
      tenant.containerId = containerId;
    }

    return this.tenantsRepo.save(tenant);
  }

  async saveConfig(
    id: string,
    config: Record<string, unknown>,
  ): Promise<Tenant> {
    const tenant = await this.findOne(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    tenant.schoolConfig = config;
    tenant.deploymentStatus = TenantStatus.READY;
    return this.tenantsRepo.save(tenant);
  }
}