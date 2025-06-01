<script lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { login } from '../services/auth.service'
import { CLIENT_URL } from '../data/urls'
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

export default {
  name: 'Login',
  components: {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2
  },
  setup() {
    const router = useRouter()
    const isLoading = ref(false)
    const showPassword = ref(false)

    const form = reactive({
      email: '',
      password: ''
    })

    const errors = reactive({
      email: '',
      password: ''
    })

    const validateForm = () => {
      let isValid = true

      errors.email = ''
      errors.password = ''

      if (!form.email) {
        errors.email = 'Email is required'
        isValid = false
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Please enter a valid email address'
        isValid = false
      }

      // Password validation
      if (!form.password) {
        errors.password = 'Password is required'
        isValid = false
      } else if (form.password.length < 6 || form.password.length > 20) {
        errors.password = 'Password must be at least 6 characters'
        isValid = false
      }

      return isValid
    }

    const handleSubmit = async () => {
      if (!validateForm()) {
        return
      }

      isLoading.value = true

      try {
        const response = await login({ email: form.email, password: form.password })

        if (response.data.success) {
          toast.success(response.data.message || 'Login successful! Welcome back.')
          window.location.href = CLIENT_URL;
        } else {
          toast.error(response.data.message || 'Login failed. Please try again.')
        }
      } catch (error: any) {
        console.error('Login error:', error)

        // backend error messages
        if (error.response?.data?.message) {
          toast.error(error.response.data.message)
        } else if (error.message) {
          toast.error(error.message)
        } else {
          toast.error('Network error. Please check your connection and try again.')
        }
      } finally {
        isLoading.value = false
      }
    }

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    return {
      form,
      errors,
      isLoading,
      showPassword,
      handleSubmit,
      togglePasswordVisibility
    }
  },
  mounted() {
    const auth = useAuthStore();
    if (auth.user) {
      router.push('/')
    }
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <div class="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
          <span class="logo-text">E-Charge Hub</span>
        </div>
        <h1 class="login-title">Welcome Back</h1>
        <p class="login-subtitle">Sign in to your account to continue</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <div class="input-wrapper">
            <Mail :size="20" class="input-icon" />
            <input id="email" v-model="form.email" type="email" class="form-input" :class="{ 'error': errors.email }"
              placeholder="Enter your email" autocomplete="email" :disabled="isLoading" />
          </div>
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <div class="input-wrapper">
            <Lock :size="20" class="input-icon" />
            <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" class="form-input"
              :class="{ 'error': errors.password }" placeholder="Enter your password" autocomplete="current-password"
              :disabled="isLoading" :min="6" :max="20" />
            <button type="button" @click="togglePasswordVisibility" class="password-toggle" :disabled="isLoading">
              <Eye v-if="!showPassword" :size="20" />
              <EyeOff v-else :size="20" />
            </button>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <div class="form-actions">
          <button type="submit" class="login-button" :disabled="isLoading">
            <Loader2 v-if="isLoading" :size="20" class="spinner" />
            <span>{{ isLoading ? 'Signing In...' : 'Sign In' }}</span>
          </button>
        </div>

        <div class="login-footer">
          <p class="signup-link">
            Don't have an account?
            <RouterLink to="/register" class="link">Sign up here</RouterLink>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

* {
  background-color: transparent;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(26, 26, 36, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-secondary);
  border-radius: 24px;
  padding: 40px;
  box-shadow: var(--shadow-lg);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
  background-color: transparent;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  background-color: transparent;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 12px;
  color: var(--text-primary);
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  background-color: transparent;
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  background-color: transparent;
}

.login-form {
  background-color: transparent;
}

.form-group {
  margin-bottom: 24px;
  background-color: transparent;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  background-color: transparent;
}

.input-wrapper {
  position: relative;
  background-color: transparent;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background-color: var(--bg-hover);
}

.form-input.error {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: var(--text-muted);
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.password-toggle:hover {
  color: var(--text-secondary);
  background-color: var(--bg-hover);
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  display: block;
  color: var(--danger);
  font-size: 0.85rem;
  margin-top: 6px;
  background-color: transparent;
}

.form-actions {
  margin-bottom: 24px;
  background-color: transparent;
}

.login-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: var(--text-primary);
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: var(--shadow-md);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.login-footer {
  text-align: center;
  background-color: transparent;
}

.signup-link {
  color: var(--text-secondary);
  font-size: 0.9rem;
  background-color: transparent;
}

.link {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
  background-color: transparent;
}

.link:hover {
  color: var(--accent-hover);
}

@media (max-width: 768px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    padding: 32px 24px;
    border-radius: 20px;
  }

  .login-title {
    font-size: 1.75rem;
  }

  .form-input {
    padding: 14px 14px 14px 44px;
  }

  .login-button {
    padding: 14px;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px 20px;
  }

  .login-title {
    font-size: 1.5rem;
  }

  .logo-text {
    font-size: 1.3rem;
  }
}
</style>
