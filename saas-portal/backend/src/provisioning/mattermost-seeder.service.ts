import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import type { ParsedSchoolConfig } from '../tenants/excel-parser.service';

const slugify = (input: string) =>
  input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class MattermostSeederService {
  private getAxios(baseUrl: string, token?: string): AxiosInstance {
    return axios.create({
      baseURL: baseUrl,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  async waitForHealth(baseUrl: string): Promise<void> {
    const client = this.getAxios(baseUrl);
    for (let i = 0; i < 30; i++) {
      try {
        const res = await client.get('/api/v4/system/ping');
        if (res.status === 200) return;
      } catch (err) {
        // ignore and retry
      }
      await wait(2000);
    }
    throw new InternalServerErrorException('Mattermost health check timed out');
  }

  async loginSysAdmin(baseUrl: string): Promise<string> {
    const loginId =
      process.env.MM_SYSADMIN_EMAIL ??
      process.env.MM_ADMIN_EMAIL ??
      'sysadmin@example.com';
    const password =
      process.env.MM_SYSADMIN_PASSWORD ??
      process.env.MM_ADMIN_PASSWORD ??
      'Sys@dmin-sample1';

    const client = this.getAxios(baseUrl);
    const res = await client.post(
      '/api/v4/users/login',
      {
        login_id: loginId,
        password,
      },
      { validateStatus: () => true },
    );

    if (res.status !== 200 || !res.headers.token) {
      throw new InternalServerErrorException(
        `Failed to login sysadmin: status ${res.status}`,
      );
    }

    return String(res.headers.token);
  }

  async seedStructure(
    baseUrl: string,
    token: string,
    config: ParsedSchoolConfig,
  ): Promise<void> {
    const client = this.getAxios(baseUrl, token);

    const teamIds = new Map<string, string>();
    for (const cls of config.classes) {
      const teamName = slugify(cls.code || cls.name || `class-${Date.now()}`);
      const displayName = cls.name || cls.code;
      const res = await client.post(
        '/api/v4/teams',
        {
          name: teamName,
          display_name: displayName,
          type: 'I',
        },
        { validateStatus: () => true },
      );
      if (res.status !== 201) {
        throw new InternalServerErrorException(
          `Failed to create team ${teamName}: ${res.status}`,
        );
      }
      teamIds.set(cls.code, res.data.id);
    }

    for (const user of config.users) {
      const userRes = await client.post(
        '/api/v4/users',
        {
          email: user.email,
          username: user.username || slugify(user.email),
          password: user.password,
          first_name: user.fullname ?? '',
        },
        { validateStatus: () => true },
      );
      if (userRes.status !== 201 && userRes.status !== 409) {
        throw new InternalServerErrorException(
          `Failed to create user ${user.email}: ${userRes.status}`,
        );
      }

      const userId = userRes.data?.id;
      const teamId = teamIds.get(user.classCode);
      if (userId && teamId) {
        const memberRes = await client.post(
          `/api/v4/teams/${teamId}/members`,
          { team_id: teamId, user_id: userId },
          { validateStatus: () => true },
        );
        if (memberRes.status !== 201 && memberRes.status !== 409) {
          throw new InternalServerErrorException(
            `Failed to add user ${user.email} to team ${user.classCode}: ${memberRes.status}`,
          );
        }

        if (user.role?.toLowerCase() === 'teacher') {
          await client.put(
            `/api/v4/teams/${teamId}/members/${userId}/roles`,
            { roles: 'team_user team_admin' },
            { validateStatus: () => true },
          );
        }
      }
    }
  }
}
