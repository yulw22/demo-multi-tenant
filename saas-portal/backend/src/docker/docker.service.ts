import { Injectable } from '@nestjs/common';
import Docker from 'dockerode';

@Injectable()
export class DockerService {
  private readonly docker = new Docker({ socketPath: '/var/run/docker.sock' });

  async getHealth() {
    return this.docker.version();
  }

  getClient() {
    return this.docker;
  }
}
