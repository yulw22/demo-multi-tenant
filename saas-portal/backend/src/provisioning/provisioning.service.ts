import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DockerService } from '../docker/docker.service';
import { Tenant, TenantStatus } from '../tenants/tenants.entity';
import { MattermostSeederService } from './mattermost-seeder.service';
import type { ParsedSchoolConfig } from '../tenants/excel-parser.service';

@Injectable()
export class ProvisioningService {
  private readonly DOCKER_NETWORK = 'saas-infra_saas-network';

  constructor(
    private readonly dataSource: DataSource,
    private readonly dockerService: DockerService,
    private readonly seeder: MattermostSeederService,
  ) {}

  async provisionTenant(tenant: Tenant): Promise<{
    containerId: string;
    sysadminEmail: string;
    sysadminPassword: string;
  }> {
    // 1. Tạo Schema
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(
        `CREATE SCHEMA IF NOT EXISTS "${tenant.dbSchema}"`,
      );
    } catch (error) {
      console.error('Lỗi tạo Schema:', error);
      throw new InternalServerErrorException('Failed to create DB Schema');
    } finally {
      await queryRunner.release();
    }

    // 2. Tạo Container
    const docker = this.dockerService.getClient();
    let containerId = '';
    try {
      const container = await docker.createContainer({
        Image: 'mattermost/mattermost-team-edition:9.5',
        name: `mm-${tenant.subdomain}`,
        HostConfig: {
          NetworkMode: this.DOCKER_NETWORK,
          RestartPolicy: { Name: 'unless-stopped' },
          SecurityOpt: ['no-new-privileges:true'],
          PidsLimit: 200,
        },
        NetworkingConfig: {
          EndpointsConfig: {
            [this.DOCKER_NETWORK]: {},
          },
        },
        Env: [
          'MM_SQLSETTINGS_DRIVERNAME=postgres',
          `MM_SQLSETTINGS_DATASOURCE=postgres://postgres:mysecretpassword@citus-coordinator:5432/postgres?search_path=${tenant.dbSchema}&sslmode=disable&connect_timeout=10`,
          `MM_SERVICESETTINGS_SITEURL=http://${tenant.subdomain}.localhost`,
        ],
        Labels: {
          'traefik.enable': 'true',
          [`traefik.http.routers.mm-${tenant.subdomain}.rule`]: `Host(\`${tenant.subdomain}.localhost\`)`,
          [`traefik.http.services.mm-${tenant.subdomain}.loadbalancer.server.port`]:
            '8065',
          'managed.by': 'saas-portal',
        },
      });

      await container.start();
      containerId = container.id;
    } catch (error) {
      console.error('Lỗi Docker:', error);
      throw new InternalServerErrorException(`Docker failed: ${error.message}`);
    }

    const baseUrl = `http://${tenant.subdomain}.localhost`;

    // 3. Chờ service sẵn sàng
    await this.seeder.waitForHealth(baseUrl);

    // 4. Đăng nhập SysAdmin
    const sysadminEmail =
      process.env.MM_SYSADMIN_EMAIL ??
      process.env.MM_ADMIN_EMAIL ??
      'sysadmin@example.com';
    const sysadminPassword =
      process.env.MM_SYSADMIN_PASSWORD ??
      process.env.MM_ADMIN_PASSWORD ??
      'Sys@dmin-sample1';
    const token = await this.seeder.loginSysAdmin(baseUrl);

    // 5. Seed cấu trúc
    if (!tenant.schoolConfig) {
      throw new InternalServerErrorException(
        'Missing schoolConfig for seeding',
      );
    }
    await this.seeder.seedStructure(
      baseUrl,
      token,
      tenant.schoolConfig as ParsedSchoolConfig,
    );

    // 6. Cập nhật trạng thái ACTIVE
    const repo = this.dataSource.getRepository(Tenant);
    tenant.containerId = containerId;
    tenant.deploymentStatus = TenantStatus.ACTIVE;
    await repo.save(tenant);

    return { containerId, sysadminEmail, sysadminPassword };
  }

  async deployTenant(tenant: Tenant): Promise<{
    containerId: string;
    sysadminEmail: string;
    sysadminPassword: string;
  }> {
    return this.provisionTenant(tenant);
  }
}
