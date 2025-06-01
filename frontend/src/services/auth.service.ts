import api from "@/plugins/axios";

export const login = async (data: any) => {
  try {
    return await api.post("/auth/login", data);
  } catch (error: any) {
    if (error.response) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
};

export const register = async (data: any) => {
  try {
    return await api.post("/auth/register", data);
  } catch (error: any) {
    if (error.response) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
};

export const logout = async () => {
  try {
    return await api.post("/auth/logout");
  } catch (error: any) {
    if (error.response) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
};