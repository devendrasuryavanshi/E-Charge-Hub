<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { User, Menu, X, LogOut, Settings, Zap } from 'lucide-vue-next'
import router from '@/router'

export default defineComponent({
  name: 'Navbar',
  components: {
    Zap,
    User,
    Menu,
    X,
    LogOut,
    Settings
  },
  data() {
    return {
      showMobileMenu: false,
      showUserPopup: false
    }
  },
  setup() {
    const auth = useAuthStore()
    const router = useRouter()

    const isAuthenticated = computed(() => !!auth.user)

    const handleLogout = async () => {
      await auth.logout()
      router.push('/login')
    }

    return {
      auth,
      isAuthenticated,
      handleLogout
    }
  },
  methods: {
    toggleMobileMenu(event: Event) {
      event.stopPropagation()
      this.showMobileMenu = !this.showMobileMenu
    },
    toggleUserPopup(event: Event) {
      event.stopPropagation()
      this.showUserPopup = !this.showUserPopup
    },
    closeMobileMenu() {
      this.showMobileMenu = false
    },
    closeUserPopup() {
      this.showUserPopup = false
    },
    handleProfile() {
      this.closeUserPopup()
      router.push('/profile')
    },
  },
  mounted() {
    document.addEventListener('click', (e) => {
      if (!this.$el.contains(e.target)) {
        this.showUserPopup = false
        this.showMobileMenu = false
      }
    })
  }
})
</script>

<template>
  <nav class="navbar">
    <RouterLink to="/" class="logo-link">
      <div class="logo">
        <Zap class="logo-icon" strokeWidth="2" color="#fff" :size="28" />
        <span class="logo-text">E-Charge Hub</span>
      </div>
    </RouterLink>

    <div class="nav-links desktop-nav">
      <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
      <RouterLink to="/stations" class="nav-link">Stations</RouterLink>
      <RouterLink to="/price" class="nav-link">Pricings</RouterLink>
      <RouterLink to="/stations/create" class="nav-link">Create Station</RouterLink>
    </div>

    <div class="nav-actions">
      <div v-if="isAuthenticated" class="user-menu">
        <button class="user-btn" @click="toggleUserPopup">
          <img class="user-icon"
            src="https://static.vecteezy.com/system/resources/previews/011/490/381/non_2x/happy-smiling-young-man-avatar-3d-portrait-of-a-man-cartoon-character-people-illustration-isolated-on-white-background-vector.jpg"
            alt="User" />
        </button>
        <div v-if="showUserPopup" class="user-popup">
          <button class="popup-item" @click="handleProfile">
            <User :size="16" /> Profile
          </button>
          <button class="popup-item logout" @click="handleLogout">
            <LogOut :size="16" /> Logout
          </button>
        </div>
      </div>

      <RouterLink v-else to="/login" class="nav-link">Login</RouterLink>

      <button class="mobile-menu-btn" @click="toggleMobileMenu">
        <Menu v-if="!showMobileMenu" strokeWidth="2" color="#b4b4c7" :size="24" />
        <X v-else strokeWidth="2" color="#b4b4c7" :size="24" />
      </button>
    </div>


    <div v-if="showMobileMenu" class="mobile-nav">
      <RouterLink to="/dashboard" class="mobile-nav-link" @click="closeMobileMenu">Dashboard</RouterLink>
      <RouterLink to="/stations" class="mobile-nav-link" @click="closeMobileMenu">Stations</RouterLink>
      <RouterLink to="/price" class="mobile-nav-link" @click="closeMobileMenu">Pricings</RouterLink>
      <RouterLink to="/stations/create" class="mobile-nav-link" @click="closeMobileMenu">Create Station</RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  height: 70px;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-primary);
  padding: 0 24px;
  background-color: var(--bg-secondary);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-sm);
}

.logo-link {
  text-decoration: none;
  color: inherit;
  background-color: transparent;
}

.user-icon {
  background-color: transparent;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  background-color: transparent;
}

.logo-icon {
  background-color: transparent;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  background-clip: text;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: transparent;
}

.nav-link {
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: transparent;
  font-size: 0.95rem;
}

.nav-link:hover {
  color: var(--text-primary);
  transform: translateY(-1px);
}

.popup-item>* {
  background-color: transparent;
}

.nav-link.router-link-active {
  color: var(--text-primary);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: transparent;
}

.user-menu {
  position: relative;
  background-color: transparent;
}

.user-btn {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

.user-btn:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.user-popup {
  position: absolute;
  top: 50px;
  right: 0;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  min-width: 180px;
  overflow: hidden;
  backdrop-filter: blur(12px);
}

.popup-item {
  width: 100%;
  padding: 14px 18px;
  border: none;
  background-color: transparent;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.popup-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.popup-item.logout {
  color: var(--danger);
  border-top: 1px solid var(--border-secondary);
}

.popup-item.logout:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.mobile-menu-btn {
  display: none;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-menu-btn>* {
  background-color: transparent;
}

.mobile-menu-btn:hover {
  background-color: var(--bg-hover);
}

.mobile-nav {
  display: none;
  position: absolute;
  top: 70px;
  left: 0;
  right: 0;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  box-shadow: var(--shadow-lg);
  flex-direction: column;
  padding: 16px 0;
  backdrop-filter: blur(12px);
}

.mobile-nav-link {
  text-decoration: none;
  color: var(--text-secondary);
  padding: 14px 24px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: transparent;
}

.mobile-nav-link:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.mobile-nav-link.router-link-active {
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 16px;
    height: 60px;
  }

  .desktop-nav {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-nav {
    display: flex;
    top: 60px;
  }

  .logo-text {
    font-size: 1.3rem;
  }

  .user-btn {
    width: 36px;
    height: 36px;
  }

  .user-popup {
    top: 45px;
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: 0 12px;
  }

  .logo-text {
    font-size: 1.2rem;
  }

  .nav-actions {
    gap: 12px;
  }
}
</style>