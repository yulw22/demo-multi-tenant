import { Module } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';
import { DockerModule } from 'src/docker/docker.module';
import { MattermostSeederService } from './mattermost-seeder.service';

@Module({
  imports: [DockerModule],
  providers: [ProvisioningService, MattermostSeederService],
  exports: [ProvisioningService],
})
export class ProvisioningModule {}
