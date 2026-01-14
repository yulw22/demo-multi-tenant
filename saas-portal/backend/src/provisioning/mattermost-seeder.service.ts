import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MattermostSeederService {
  private readonly logger = new Logger(MattermostSeederService.name);

  // 1. Hàm đợi Server khởi động (Quan trọng để tránh lỗi Connection Refused)
  async waitForHealth(baseUrl: string): Promise<void> {
    this.logger.log(`⏳ Waiting for Mattermost at ${baseUrl}...`);
    const healthUrl = `${baseUrl}/api/v4/system/ping`;

    // Thử lại 30 lần, mỗi lần cách nhau 2s (Tổng 60s)
    for (let i = 0; i < 30; i++) {
      try {
        await axios.get(healthUrl);
        this.logger.log('✅ Mattermost is healthy!');
        return;
      } catch (error) {
        this.logger.debug(`Ping failed (${i + 1}/30). Retrying in 2s...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    throw new Error('Mattermost startup timeout after 60s');
  }

  // 2. Tạo System Admin đầu tiên (Mattermost cho phép tạo user đầu không cần auth)
  async createFirstAdmin(baseUrl: string, email: string) {
    this.logger.log('🔑 Creating System Admin...');
    const password = 'Admin@123456'; // Password mặc định
    const username = 'sysadmin';

    try {
      // Tạo User
      const userRes = await axios.post(`${baseUrl}/api/v4/users`, {
        email,
        username,
        password,
      });

      // Login để lấy Token
      const loginRes = await axios.post(`${baseUrl}/api/v4/users/login`, {
        login_id: email,
        password,
      });

      const token = loginRes.headers['token'];
      this.logger.log('✅ System Admin created & Logged in.');

      return { token, username, password };
    } catch (error) {
      // Nếu user đã tồn tại (do deploy lại), thử login luôn
      if (error.response?.status === 400 || error.response?.status === 403) {
        this.logger.warn('User might already exist, trying to login...');
        const loginRes = await axios.post(`${baseUrl}/api/v4/users/login`, {
          login_id: email,
          password,
        });
        return { token: loginRes.headers['token'], username, password };
      }
      this.logger.error('Failed to create admin', error.response?.data);
      throw error;
    }
  }

  // 3. Bơm dữ liệu từ Config JSON
  async seedData(baseUrl: string, token: string, config: any) {
    this.logger.log('🌱 Seeding data from config...');
    const headers = { Authorization: `Bearer ${token}` };

    if (!config) {
      this.logger.warn('No config found to seed.');
      return;
    }

    // A. Tạo Teams (Lớp học)
    const teamMap = new Map<string, string>(); // Map: class_code -> team_id
    if (config.teams) {
      for (const team of config.teams) {
        try {
          // name: phải viết thường, không dấu, không cách (vd: 10a1)
          const cleanName = team.code.toLowerCase().replace(/[^a-z0-9]/g, '');
          const res = await axios.post(
            `${baseUrl}/api/v4/teams`,
            {
              name: cleanName,
              display_name: team.name,
              type: 'I', // Invite only
            },
            { headers },
          );
          teamMap.set(team.code, res.data.id);
          this.logger.log(`Created Team: ${team.name}`);
        } catch (e) {
          this.logger.error(
            `Failed to create team ${team.code}`,
            e.response?.data,
          );
        }
      }
    }

    // B. Tạo Users và Add vào Team
    if (config.users) {
      for (const user of config.users) {
        try {
          // Tạo User
          const userRes = await axios.post(
            `${baseUrl}/api/v4/users`,
            {
              email: user.email,
              username: user.username,
              password: user.password,
              first_name: user.fullname,
            },
            { headers },
          );

          const userId = userRes.data.id;

          // Add vào Team (Lớp)
          if (user.class_code && teamMap.has(user.class_code)) {
            const teamId = teamMap.get(user.class_code);

            // Add member
            await axios.post(
              `${baseUrl}/api/v4/teams/${teamId}/members`,
              {
                team_id: teamId,
                user_id: userId,
              },
              { headers },
            );

            // Nếu là GV -> Set làm Team Admin
            if (user.role === 'teacher') {
              // Update roles (Logic update role hơi phức tạp, tạm thời add member trước)
              // Mattermost API update role: PUT /api/v4/teams/{team_id}/members/{user_id}/roles
              await axios.put(
                `${baseUrl}/api/v4/teams/${teamId}/members/${userId}/roles`,
                {
                  roles: 'team_user team_admin',
                },
                { headers },
              );
            }
          }
        } catch (e) {
          this.logger.warn(`User ${user.username} maybe exists or error.`);
        }
      }
    }
    this.logger.log('✅ Seeding completed.');
  }
}
