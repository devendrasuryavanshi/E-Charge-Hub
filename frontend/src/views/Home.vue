<script lang="ts">
import { RouterLink } from 'vue-router'
import { Zap, MapPin, Shield, TrendingUp, ArrowRight, Play, Globe } from 'lucide-vue-next'

export default {
  name: 'Home',
  components: {
    RouterLink
  },
  data() {
    return {
      stats: [
        { label: 'Active Stations', value: '2,500+', icon: Zap },
        { label: 'Cities Covered', value: '150+', icon: MapPin },
        { label: 'Uptime', value: '99.9%', icon: Shield },
        { label: 'Growth Rate', value: '300%', icon: TrendingUp }
      ],
      features: [
        {
          title: 'Smart Management',
          description: 'Monitor and control your charging stations with real-time analytics and automated management.',
          icon: Zap
        },
        {
          title: 'Global Coverage',
          description: 'Expand your network across multiple locations with our comprehensive mapping system.',
          icon: Globe
        },
        {
          title: 'Secure & Reliable',
          description: 'Enterprise-grade security with 99.9% uptime guarantee for uninterrupted service.',
          icon: Shield
        }
      ]
    }
  }
}
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            Power the Future of
            <span class="gradient-text">Electric Mobility</span>
          </h1>
          <p class="hero-description">
            Manage, monitor, and scale your EV charging network with our comprehensive platform.
            Built for the next generation of sustainable transportation.
          </p>
          <div class="hero-actions">
            <RouterLink to="/dashboard" class="btn-primary">
              Get Started
              <ArrowRight :size="20" />
            </RouterLink>
            <button class="btn-secondary">
              <Play :size="18" />
              Watch Demo
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="charging-animation">
            <div class="station-icon">
              <Zap :size="48" color="#6366f1" />
            </div>
            <div class="energy-rings">
              <div class="ring ring-1"></div>
              <div class="ring ring-2"></div>
              <div class="ring ring-3"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="stats">
      <div class="container">
        <div class="stats-header">
          <h2 class="stats-title">Trusted by Industry Leaders</h2>
          <p class="stats-subtitle">Join thousands of businesses powering the future</p>
        </div>
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-card">
            <div class="stat-icon-wrapper">
              <component :is="stat.icon" :size="28" class="stat-icon" />
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="features-content">
        <div class="section-header">
          <h2 class="section-title">Why Choose E-Charge Hub</h2>
          <p class="section-description">
            Everything you need to build and manage a successful EV charging network
          </p>
        </div>
        <div class="features-grid">
          <div v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-icon">
              <component :is="feature.icon" :size="32" class="feature-icon" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.hero {
  padding: 80px 24px 120px;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

.hero-text {
  background-color: transparent;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 24px;
  color: var(--text-primary);
  background-color: transparent;
}

.gradient-text {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.25rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 40px;
  background-color: transparent;
}

.hero-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  background-color: transparent;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-md);
}

.btn-primary>* {
  background-color: transparent;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-secondary);
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
}

.charging-animation {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
}

.station-icon {
  position: relative;
  z-index: 2;
  background: var(--bg-secondary);
  padding: 24px;
  border-radius: 50%;
  border: 2px solid var(--accent-primary);
}

.station-icon>* {
  background-color: transparent;
}

.energy-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: transparent;
}

.ring {
  position: absolute;
  border: 2px solid var(--accent-primary);
  border-radius: 50%;
  opacity: 0.3;
  animation: pulse 2s infinite;
}

.ring-1 {
  width: 120px;
  height: 120px;
  top: -60px;
  left: -60px;
  animation-delay: 0s;
}

.ring-2 {
  width: 160px;
  height: 160px;
  top: -80px;
  left: -80px;
  animation-delay: 0.5s;
}

.ring-3 {
  width: 200px;
  height: 200px;
  top: -100px;
  left: -100px;
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }

  50% {
    transform: scale(1);
    opacity: 0.3;
  }

  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.stats {
  padding: 100px 24px;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-top: 1px solid var(--border-primary);
  border-bottom: 1px solid var(--border-primary);
  position: relative;
  overflow: hidden;
}

.stats::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: transparent;
  position: relative;
  z-index: 1;
}

.stats-header {
  text-align: center;
  margin-bottom: 60px;
  background-color: transparent;
}

.stats-title {
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  background-color: transparent;
}

.stats-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  background-color: transparent;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  background-color: transparent;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 32px 28px;
  background: rgba(42, 42, 56, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  border: 1px solid var(--border-secondary);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
  transition: left 0.6s ease;
}

.stat-card:hover::before {
  left: 100%;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border-color: var(--accent-primary);
  background: rgba(42, 42, 56, 0.8);
}

.stat-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.1);
  box-shadow: var(--shadow-lg);
}

.stat-icon {
  color: var(--text-primary);
  background-color: transparent;
}

.stat-content {
  background-color: transparent;
  flex: 1;
}

.stat-value {
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--text-primary);
  background-color: transparent;
  margin-bottom: 4px;
  background: linear-gradient(135deg, var(--text-primary), var(--accent-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.95rem;
  color: var(--text-muted);
  background-color: transparent;
  font-weight: 500;
  letter-spacing: 0.5px;
}


.features {
  padding: 120px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.features-content {
  background-color: transparent;
}

.section-header {
  text-align: center;
  margin-bottom: 80px;
  background-color: transparent;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
  background-color: transparent;
}

.section-description {
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
  background-color: transparent;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 40px;
  background-color: transparent;
}

.feature-card {
  padding: 40px 32px;
  background-color: var(--bg-secondary);
  border-radius: 20px;
  border: 1px solid var(--border-primary);
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-primary);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 24px;
  background-color: transparent;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  background-color: transparent;
}

.feature-description {
  color: var(--text-secondary);
  line-height: 1.6;
  background-color: transparent;
}

@media (max-width: 768px) {
  .hero {
    padding: 40px 16px 80px;
  }

  .hero-content {
    grid-template-columns: 1fr;
    gap: 60px;
    text-align: center;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-description {
    font-size: 1.1rem;
  }

  .hero-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .stats {
    padding: 40px 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .features {
    padding: 80px 16px;
  }

  .section-title {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .btn-primary,
  .btn-secondary {
    padding: 14px 24px;
    font-size: 1rem;
  }

  .charging-animation {
    width: 150px;
    height: 150px;
  }

  .ring-1 {
    width: 90px;
    height: 90px;
    top: -45px;
    left: -45px;
  }

  .ring-2 {
    width: 120px;
    height: 120px;
    top: -60px;
    left: -60px;
  }

  .ring-3 {
    width: 150px;
    height: 150px;
    top: -75px;
    left: -75px;
  }
}
</style>
