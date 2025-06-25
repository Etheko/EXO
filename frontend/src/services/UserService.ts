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
}

const userService = new UserService();
export default userService;
