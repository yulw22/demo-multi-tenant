import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DockerService } from '../docker/docker.service';
import { Tenant } from '../tenants/tenants.entity';
import { MattermostSeederService } from './mattermost-seeder.service'; // Import

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);
  private readonly DOCKER_NETWORK = 'saas-infra_saas-network';

  constructor(
    private readonly dataSource: DataSource,
    private readonly dockerService: DockerService,
    private readonly seederService: MattermostSeederService, // Inject
  ) {}

  async deployTenant(tenant: Tenant) {
    this.logger.log(`🚀 Starting deployment for ${tenant.schoolName}...`);

    // 1. Tạo Schema DB
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(
        `CREATE SCHEMA IF NOT EXISTS "${tenant.dbSchema}"`,
      );
    } finally {
      await queryRunner.release();
    }

    // 2. Tạo Container
    const docker = this.dockerService.getClient();
    let container;

    try {
      // Lưu ý: Đảm bảo biến Env dùng 'search_path' thay vì 'currentSchema'
      container = await docker.createContainer({
        Image: 'mattermost/mattermost-team-edition:9.5',
        name: `mm-${tenant.subdomain}`,
        HostConfig: {
          NetworkMode: this.DOCKER_NETWORK,
          RestartPolicy: { Name: 'unless-stopped' },
          SecurityOpt: ['no-new-privileges:true'],
          PidsLimit: 200,
        },
        NetworkingConfig: {
          EndpointsConfig: { [this.DOCKER_NETWORK]: {} },
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
      this.logger.log(`🐳 Container started. ID: ${container.id}`);
    } catch (error) {
      // Nếu container đã tồn tại (do retry), thử lấy container cũ để chạy tiếp seeder
      if (error.statusCode === 409) {
        this.logger.warn('Container already exists. Proceeding to seeding...');
        // Logic lấy container cũ (tạm bỏ qua để đơn giản hóa)
      } else {
        throw new InternalServerErrorException(
          `Docker Error: ${error.message}`,
        );
      }
    }

    // 3. SEEDING DATA (Phần mới thêm)
    const siteUrl = `http://${tenant.subdomain}.localhost`; // URL nội bộ mà máy dev truy cập được
    // Mẹo: Vì code backend chạy bên ngoài Docker (Host), nên gọi localhost là gọi vào Traefik -> vào Container.

    try {
      // A. Đợi Server lên
      await this.seederService.waitForHealth(siteUrl);

      // B. Tạo Admin & Lấy Token
      const adminCreds = await this.seederService.createFirstAdmin(
        siteUrl,
        tenant.adminEmail,
      );

      // C. Bơm dữ liệu
      await this.seederService.seedData(
        siteUrl,
        adminCreds.token,
        tenant.schoolConfig,
      );

      return {
        containerId: container?.id || 'existing',
        adminUsername: adminCreds.username,
        adminPassword: adminCreds.password,
        siteUrl: siteUrl,
      };
    } catch (error) {
      this.logger.error('Seeding Failed', error);
      // Container chạy rồi nhưng seeding lỗi -> vẫn throw lỗi để Controller set status là ERROR
      throw new InternalServerErrorException(`Seeding Error: ${error.message}`);
    }
  }
}
