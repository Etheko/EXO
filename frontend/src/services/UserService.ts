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
    const response = await api.put<User>(`/users/${username}/basic-info`, info);
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
    const response = await api.put<User>(`/users/${username}/social-links`, links);
    return response.data;
  }

  /* ==========================
   *      LIKES/DISLIKES MANAGEMENT
   * ==========================
   */

  async addLike(username: string, like: string): Promise<User> {
    const params = new URLSearchParams();
    params.append('like', like);
    const response = await api.post<User>(`/users/${username}/likes?${params.toString()}`);
    return response.data;
  }

  async removeLike(username: string, like: string): Promise<User> {
    const response = await api.delete<User>(`/users/${username}/likes/${encodeURIComponent(like)}`);
    return response.data;
  }

  async addDislike(username: string, dislike: string): Promise<User> {
    const params = new URLSearchParams();
    params.append('dislike', dislike);
    const response = await api.post<User>(`/users/${username}/dislikes?${params.toString()}`);
    return response.data;
  }

  async removeDislike(username: string, dislike: string): Promise<User> {
    const response = await api.delete<User>(`/users/${username}/dislikes/${encodeURIComponent(dislike)}`);
    return response.data;
  }

  async updateProfilePicture(username: string, pfp: File): Promise<User> {
    const formData = new FormData();
    formData.append('pfp', pfp);

    const response = await api.put(`/users/${username}/pfp`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

const userService = new UserService();
export default userService;
