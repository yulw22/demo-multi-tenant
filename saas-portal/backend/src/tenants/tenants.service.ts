import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from './tenants.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ProvisioningService } from 'src/provisioning/provisioning.service';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepo: Repository<Tenant>,
    private readonly provisioningService: ProvisioningService,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<{
    tenant: Tenant;
    adminCredentials: { email: string; password: string };
  }> {
    const tenant = this.tenantsRepo.create({
      ...createTenantDto,
      deploymentStatus: TenantStatus.PROVISIONING,
    });
    const savedTenant = await this.tenantsRepo.save(tenant);

    try {
      const { containerId, sysadminEmail, sysadminPassword } =
        await this.provisioningService.provisionTenant(savedTenant);
      savedTenant.containerId = containerId;
      savedTenant.deploymentStatus = TenantStatus.ACTIVE;
      const finalTenant = await this.tenantsRepo.save(savedTenant);
      return {
        tenant: finalTenant,
        adminCredentials: { email: sysadminEmail, password: sysadminPassword },
      };
    } catch (error) {
      savedTenant.deploymentStatus = TenantStatus.ERROR;
      await this.tenantsRepo.save(savedTenant);
      throw error;
    }
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
    return this.tenantsRepo.find();
  }

  findOne(id: string): Promise<Tenant | null> {
    return this.tenantsRepo.findOne({ where: { id } });
  }

  async save(tenant: Tenant): Promise<Tenant> {
    return this.tenantsRepo.save(tenant);
  }

  async updateStatus(id: string, status: TenantStatus): Promise<Tenant> {
    const tenant = await this.findOne(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    tenant.deploymentStatus = status;
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
