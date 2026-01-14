import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class MattermostSeederService {
  private readonly logger = new Logger(MattermostSeederService.name);

  async waitForHealth(baseUrl: string): Promise<void> {
    const healthUrl = `${baseUrl}/api/v4/system/ping`;
    this.logger.log(`⏳ Checking Health: ${healthUrl}`);
    for (let i = 0; i < 40; i++) {
      try {
        await axios.get(healthUrl, { timeout: 2000 });
        this.logger.log('✅ Server is UP!');
        return;
      } catch (e) {
        if (i % 5 === 0) this.logger.debug(`...waiting (${i}/40)`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    throw new Error('Server Startup Timeout');
  }

  async createFirstAdmin(baseUrl: string, email: string) {
    this.logger.log(`🔑 Setup System Admin: ${email}`);
    const password = 'Admin@123456';
    const username = 'sysadmin';

    try {
      await axios.post(`${baseUrl}/api/v4/users`, {
        email,
        username,
        password,
      });
    } catch (e) {
      /* Ignore exists */
    }

    try {
      const res = await axios.post(`${baseUrl}/api/v4/users/login`, {
        login_id: username,
        password,
      });
      return { token: res.headers['token'], username, password };
    } catch (e) {
      this.logger.error('❌ Admin Login Failed.');
      throw e;
    }
  }

  async seedData(baseUrl: string, token: string, config: any) {
    this.logger.log('🚀 START SEEDING (WITH AUTO-CLEANUP)...');
    const client = axios.create({
      baseURL: `${baseUrl}/api/v4`,
      headers: { Authorization: `Bearer ${token}` },
    });

    const teamIdMap = new Map<string, string>();
    const channelIdMap = new Map<string, string>();

    // 1. TẠO TEAM & CHANNEL
    const teams = config.teams || [];
    const channelsConfig = config.channels || [];

    for (const t of teams) {
      const teamHandle = this.sanitize(t.code);
      let teamId = '';

      // 1.1 Tạo Team
      try {
        const res = await client.post('/teams', {
          name: teamHandle,
          display_name: t.name,
          type: 'I',
        });
        teamId = res.data.id;
      } catch (e) {
        if (e.response?.status === 400) {
          const exist = await client.get(`/teams/name/${teamHandle}`);
          teamId = exist.data.id;
        }
      }

      if (!teamId) continue;
      teamIdMap.set(t.code, teamId);
      this.logger.debug(`Processing Team: ${t.name}`);

      // 1.2 Cleanup & Rename Default Channels
      try {
        const offTopic = await client.get(
          `/teams/${teamId}/channels/name/off-topic`,
        );
        await client.delete(`/channels/${offTopic.data.id}`); // Archive Off-Topic

        const townSquare = await client.get(
          `/teams/${teamId}/channels/name/town-square`,
        );
        await client.put(`/channels/${townSquare.data.id}/patch`, {
          display_name: 'Thông báo chung',
          header: 'Kênh thông báo chính thức của lớp học',
        });
        // Lưu lại ID của Town Square để tí nữa dọn rác
        channelIdMap.set(`${t.code}_TOWNSQUARE`, townSquare.data.id);
      } catch (e) {
        /* Ignore cleanup err */
      }

      // 1.3 Tạo Channel Môn học
      for (const c of channelsConfig) {
        const chanHandle = this.sanitize(c.code);
        try {
          const res = await client.post('/channels', {
            team_id: teamId,
            name: chanHandle,
            display_name: c.name,
            type: c.type === 'P' ? 'P' : 'O',
          });
          channelIdMap.set(`${t.code}_${c.code}`, res.data.id);
        } catch (ce) {
          if (ce.response?.status === 400) {
            try {
              const exist = await client.get(
                `/teams/${teamId}/channels/name/${chanHandle}`,
              );
              channelIdMap.set(`${t.code}_${c.code}`, exist.data.id);
            } catch {}
          }
        }
      }
    }

    // 2. TẠO USER & ADD VÀO CHANNEL
    const users = config.users || [];
    for (const u of users) {
      const uHandle = this.sanitize(u.username);
      let userId = '';

      try {
        const res = await client.post('/users', {
          email: u.email,
          username: uHandle,
          password: u.password || 'Student@123',
          first_name: u.fullname,
        });
        userId = res.data.id;
      } catch (e) {
        if (e.response?.status === 400) {
          try {
            const found = await client.post('/users/search', { term: u.email });
            if (found.data.length > 0) userId = found.data[0].id;
          } catch {}
        }
      }

      if (!userId) continue;

      const teamId = teamIdMap.get(u.class_code);
      if (teamId) {
        try {
          await client.post(`/teams/${teamId}/members`, {
            team_id: teamId,
            user_id: userId,
          });
        } catch {}
        if (u.role === 'teacher') {
          try {
            await client.put(`/teams/${teamId}/members/${userId}/roles`, {
              roles: 'team_user team_admin',
            });
          } catch {}
        }

        // Auto Join Channels
        for (const c of channelsConfig) {
          const channelId = channelIdMap.get(`${u.class_code}_${c.code}`);
          if (channelId) {
            let shouldJoin = false;
            if (c.type !== 'P') shouldJoin = true;
            else {
              if (
                c.code === 'PARENTS' &&
                (u.role === 'parent' || u.role === 'teacher')
              )
                shouldJoin = true;
              else if (c.code === 'TEACHERS' && u.role === 'teacher')
                shouldJoin = true;
            }

            if (shouldJoin) {
              try {
                await client.post(`/channels/${channelId}/members`, {
                  user_id: userId,
                });
              } catch {}
            }
          }
        }
      }
    }

    // 3. CLEANUP SYSTEM MESSAGES (MỚI)
    this.logger.log('🧹 Cleaning up system messages (User joined)...');

    // Duyệt qua tất cả channel ID đã lưu để xóa post
    for (const [key, channelId] of channelIdMap.entries()) {
      await this.clearChannelPosts(client, channelId);
    }

    this.logger.log('✅ SEEDING FINISHED & CLEANED.');
  }

  // --- HÀM XÓA POST ---
  private async clearChannelPosts(client: AxiosInstance, channelId: string) {
    try {
      // Lấy 200 post gần nhất (thường là post 'user joined')
      const postsRes = await client.get(
        `/channels/${channelId}/posts?per_page=200`,
      );
      const posts = postsRes.data.posts;
      const order = postsRes.data.order; // Mảng ID post theo thứ tự

      if (!order || order.length === 0) return;

      this.logger.debug(
        `   🗑️ Deleting ${order.length} posts in channel ${channelId}`,
      );

      // Xóa từng post (Mattermost API chưa support bulk delete clean)
      // Dùng Promise.all để xóa song song cho nhanh
      const deletePromises = order.map((postId) =>
        client.delete(`/posts/${postId}`).catch(() => {}),
      );

      await Promise.all(deletePromises);
    } catch (e) {
      this.logger.warn(`Failed to clean channel ${channelId}: ${e.message}`);
    }
  }

  private sanitize(str: string): string {
    if (!str) return 'unknown';
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
