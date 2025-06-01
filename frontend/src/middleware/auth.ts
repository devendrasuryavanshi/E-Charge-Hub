import api from '@/plugins/axios'

export const checkAuth = async () => {
  try {
    const response = await api.get('/auth/me', { withCredentials: true });
    const user = response.data?.data?.user;
    console.log('me:', user);
    return user;
  } catch (err) {
    return null;
  }
}
