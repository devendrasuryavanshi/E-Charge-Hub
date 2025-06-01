<script lang="ts">
import { ref, computed, onMounted } from 'vue'
import { User, Mail, Calendar, MapPin, Zap, Activity, Settings, Edit3, Shield, Award, Clock } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

export default {
  name: 'Profile',
  components: {
    User,
    Mail,
    Calendar,
    MapPin,
    Zap,
    Activity,
    Settings,
    Edit3,
    Shield,
    Award,
    Clock
  },
  setup() {
    const authStore = useAuthStore()
    const { user } = storeToRefs(authStore)
    
    const currentTime = ref(new Date())
    
    const greeting = computed(() => {
      const hour = currentTime.value.getHours()
      if (hour < 12) return 'Good Morning'
      if (hour < 17) return 'Good Afternoon'
      return 'Good Evening'
    })

    const memberSince = computed(() => {
      return new Date('2025-01-15').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })

    const stats = ref([
      {
        icon: Zap,
        label: 'Charging Sessions',
        value: '24',
        change: '+12%',
        positive: true
      },
      {
        icon: Clock,
        label: 'Total Hours',
        value: '156',
        change: '+8%',
        positive: true
      },
      {
        icon: MapPin,
        label: 'Stations Used',
        value: '8',
        change: '+3',
        positive: true
      },
      {
        icon: Award,
        label: 'Eco Points',
        value: '1,240',
        change: '+156',
        positive: true
      }
    ])

    const recentActivity = ref([
      {
        icon: Zap,
        title: 'Charging Session Completed',
        description: 'Downtown Station A - 45 minutes',
        time: '2 hours ago',
        status: 'completed'
      },
      {
        icon: MapPin,
        title: 'New Station Added to Favorites',
        description: 'Mall Parking Station B',
        time: '1 day ago',
        status: 'info'
      },
      {
        icon: Award,
        title: 'Eco Points Earned',
        description: 'Earned 50 points for green charging',
        time: '2 days ago',
        status: 'success'
      },
      {
        icon: Settings,
        title: 'Profile Updated',
        description: 'Notification preferences changed',
        time: '1 week ago',
        status: 'info'
      }
    ])

    onMounted(() => {
      const interval = setInterval(() => {
        currentTime.value = new Date()
      }, 60000)

      return () => clearInterval(interval)
    })

    return {
      user,
      greeting,
      memberSince,
      stats,
      recentActivity
    }
  }
}
</script>

<template>
  <div class="profile-container">
    <div class="profile-content">
      <!-- Header Section -->
      <div class="profile-header">
        <div class="header-content">
          <div class="user-avatar">
            <img 
              src="https://static.vecteezy.com/system/resources/previews/011/490/381/non_2x/happy-smiling-young-man-avatar-3d-portrait-of-a-man-cartoon-character-people-illustration-isolated-on-white-background-vector.jpg" 
              :alt="user?.name || 'User'"
              class="avatar-image"
            >
            <button class="edit-avatar-btn">
              <Edit3 :size="16" />
            </button>
          </div>
          <div class="user-info">
            <h1 class="greeting">{{ greeting }}, {{ user?.name || 'User' }}!</h1>
            <p class="welcome-text">Welcome back to your E-Charge Hub dashboard</p>
            <div class="user-details">
              <div class="detail-item">
                <Mail :size="16" class="detail-icon" />
                <span>{{ user?.email || 'user@example.com' }}</span>
              </div>
              <div class="detail-item">
                <Calendar :size="16" class="detail-icon" />
                <span>Member since {{ memberSince }}</span>
              </div>
              <div class="detail-item">
                <Shield :size="16" class="detail-icon" />
                <span>Verified Account</span>
              </div>
            </div>
          </div>
        </div>
        <button class="edit-profile-btn">
          <Settings :size="18" />
          <span>Edit Profile</span>
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="stats-section">
        <h2 class="section-title">Your Statistics</h2>
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-card">
            <div class="stat-header">
              <component :is="stat.icon" :size="24" class="stat-icon" />
              <span class="stat-change" :class="{ positive: stat.positive }">
                {{ stat.change }}
              </span>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="activity-section">
        <h2 class="section-title">Recent Activity</h2>
        <div class="activity-list">
          <div v-for="activity in recentActivity" :key="activity.title" class="activity-item">
            <div class="activity-icon" :class="activity.status">
              <component :is="activity.icon" :size="20" />
            </div>
            <div class="activity-content">
              <h3 class="activity-title">{{ activity.title }}</h3>
              <p class="activity-description">{{ activity.description }}</p>
              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </div>
        </div>
      </div>
      

      <!-- Quick Actions -->
      <div class="actions-section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <RouterLink to="/station" class="action-card">
            <MapPin :size="24" class="action-icon" />
            <div class="action-content">
              <h3>Find Stations</h3>
              <p>Locate nearby charging stations</p>
            </div>
          </RouterLink>
          <RouterLink to="/dashboard" class="action-card">
            <Activity :size="24" class="action-icon" />
            <div class="action-content">
              <h3>View Dashboard</h3>
              <p>Check your charging analytics</p>
            </div>
          </RouterLink>
          <RouterLink to="/support" class="action-card">
            <Settings :size="24" class="action-icon" />
            <div class="action-content">
              <h3>Get Support</h3>
              <p>Contact our help center</p>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: calc(100vh - 70px);
  padding: 40px 24px;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.profile-content {
  max-width: 1200px;
  margin: 0 auto;
  background-color: transparent;
}

.profile-header {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(12px);
}

.header-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  background-color: transparent;
}

.user-avatar {
  position: relative;
  background-color: transparent;
}

.avatar-image {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  object-fit: cover;
  border: 3px solid var(--accent-primary);
  background-color: transparent;
}

.edit-avatar-btn {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 32px;
  height: 32px;
  background: var(--accent-primary);
  border: 2px solid var(--bg-tertiary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.edit-avatar-btn:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.user-info {
  background-color: transparent;
}

.greeting {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  background-color: transparent;
}

.welcome-text {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 20px;
  background-color: transparent;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: transparent;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 0.95rem;
  background-color: transparent;
}

.detail-icon {
  color: var(--accent-primary);
  background-color: transparent;
}

.edit-profile-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: var(--text-primary);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.edit-profile-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
  background-color: transparent;
}

.stats-section {
  margin-bottom: 32px;
  background-color: transparent;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  background-color: transparent;
}

.stat-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  background-color: transparent;
}

.stat-icon {
  color: var(--accent-primary);
  background-color: transparent;
}

.stat-change {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: transparent;
}

.stat-change.positive {
  color: var(--success);
  background-color: rgba(34, 197, 94, 0.1);
}

.stat-content {
  background-color: transparent;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
  background-color: transparent;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  background-color: transparent;
}

.activity-section {
  margin-bottom: 32px;
  background-color: transparent;
}

.activity-list {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(12px);
}

.activity-item {
  display: flex;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-secondary);
  transition: background-color 0.2s ease;
  background-color: transparent;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background-color: var(--bg-hover);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon.completed {
  background-color: rgba(34, 197, 94, 0.1);
  color: var(--success);
}

.activity-icon.info {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--info);
}

.activity-icon.success {
  background-color: rgba(34, 197, 94, 0.1);
  color: var(--success);
}

.activity-content {
  flex: 1;
  background-color: transparent;
}

.activity-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  background-color: transparent;
}

.activity-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 6px;
  background-color: transparent;
}

.activity-time {
  color: var(--text-muted);
  font-size: 0.8rem;
  background-color: transparent;
}

.actions-section {
  background-color: transparent;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  background-color: transparent;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-primary);
}

.action-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  flex-shrink: 0;
}

.action-content {
  background-color: transparent;
}

.action-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  background-color: transparent;
}

.action-content p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  background-color: transparent;
}

@media (max-width: 768px) {
  .profile-container {
    padding: 20px 16px;
  }

  .profile-header {
    flex-direction: column;
    gap: 24px;
    padding: 24px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .greeting {
    font-size: 1.5rem;
  }

  .user-details {
    align-items: center;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .stat-card {
    padding: 20px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .activity-item {
    padding: 16px 20px;
  }

  .actions-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .action-card {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .profile-container {
    padding: 16px 12px;
  }

  .profile-header {
    padding: 20px;
    border-radius: 16px;
  }

  .avatar-image {
    width: 60px;
    height: 60px;
  }

  .greeting {
    font-size: 1.3rem;
  }

  .welcome-text {
    font-size: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 16px;
  }

  .activity-item {
    padding: 14px 16px;
    gap: 12px;
  }

  .activity-icon {
    width: 36px;
    height: 36px;
  }

  .action-card {
    padding: 16px;
    gap: 12px;
  }

  .action-icon {
    width: 40px;
    height: 40px;
  }

  .section-title {
    font-size: 1.3rem;
  }
}

/* Loading states */
.profile-header.loading {
  opacity: 0.7;
}

.stats-grid.loading .stat-card {
  opacity: 0.7;
  pointer-events: none;
}

/* Focus states for accessibility */
.edit-avatar-btn:focus,
.edit-profile-btn:focus,
.action-card:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Smooth animations */
.stat-card,
.activity-item,
.action-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom scrollbar for activity list */
.activity-list::-webkit-scrollbar {
  width: 6px;
}

.activity-list::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 3px;
}

.activity-list::-webkit-scrollbar-thumb {
  background: var(--border-secondary);
  border-radius: 3px;
}

.activity-list::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}
</style>