import api from './api';
import type { User } from '../types/User';

class UserService {
  async getUserByUsername(username: string): Promise<User> {
    const response = await api.get(`/users/${username}`);
    return response.data;
  }

  async getUserByEmail(email: string): Promise<User> {
    const response = await api.get(`/users/email/${email}`);
    return response.data;
  }

  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const response = await api.get(`/users/check-username/${username}`);
    return response.data;
  }

  async isEmailAvailable(email: string): Promise<boolean> {
    const response = await api.get(`/users/check-email/${email}`);
    return response.data;
  }

  /* ==========================
   *      UPDATE ENDPOINTS
   * ==========================
   */

  async updateBasicInfo(
    username: string,
    info: {
      realName?: string;
      firstSurname?: string;
      secondSurname?: string;
      nick?: string;
      email?: string;
      genderIdentity?: string;
      distinctivePhrase?: string;
      description?: string;
    },
  ): Promise<User> {
    const params = new URLSearchParams();
    // Backend expects all params (non-null)
    params.append('realName', info.realName ?? '');
    params.append('firstSurname', info.firstSurname ?? '');
    params.append('secondSurname', info.secondSurname ?? '');
    params.append('nick', info.nick ?? '');
    params.append('email', info.email ?? '');
    params.append('genderIdentity', info.genderIdentity ?? '');
    params.append('distinctivePhrase', info.distinctivePhrase ?? '');
    params.append('description', info.description ?? '');

    const response = await api.put<User>(`/users/${username}/basic-info?${params.toString()}`);
    return response.data;
  }

  async updateSocialLinks(
    username: string,
    links: {
      github?: string | null;
      instagram?: string | null;
      facebook?: string | null;
      xUsername?: string | null;
      mastodon?: string | null;
      bluesky?: string | null;
      tiktok?: string | null;
      linkedIn?: string | null;
    },
  ): Promise<User> {
    const params = new URLSearchParams();
    Object.entries(links).forEach(([k, v]) => {
      if (v !== undefined) params.append(k, v ?? '');
    });
    const response = await api.put<User>(`/users/${username}/social-links?${params.toString()}`);
    return response.data;
  }
}

const userService = new UserService();
export default userService;
