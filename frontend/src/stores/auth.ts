import { checkAuth } from '@/middleware/auth'
import api from '@/plugins/axios'
import { defineStore } from 'pinia'

interface User {
  name: string
  email: string
}

interface AuthState {
  user: User | null
  loading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: true
  }),

  actions: {
    async fetchUser() {
      this.loading = true
      try {
        this.user = await checkAuth();
      } catch (err) {
        this.user = null
      } finally {
        this.loading = false
      }
    },

    setUser(user: User) {
      this.user = user
    },

    clearUser() {
      this.user = null
    },

    async logout() {
      await api.post('/auth/logout', {}, { withCredentials: true })
      this.clearUser()
    }
  }
})
