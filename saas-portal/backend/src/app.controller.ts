import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DockerService } from './docker/docker.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dockerService: DockerService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/health')
  getHealth() {
    return this.dockerService.getHealth();
  }
}
