<script lang="ts">
import { Zap, MapPin, Shield, TrendingUp, ArrowRight, Play, Globe, Github, Twitter, Linkedin, Mail } from 'lucide-vue-next'

export default {
  name: 'Footer',
  components: {
    Zap,
    MapPin,
    Shield,
    TrendingUp,
    ArrowRight,
    Play,
    Globe,
    Github,
    Twitter,
    Linkedin,
    Mail
  },
  data() {
    return {
      socialLinks: [
        {
          name: 'Github',
          icon: Github,
          url: 'https://github.com/devendrasuryavanshi'
        },
        {
          name: 'Twitter',
          icon: Twitter,
          url: 'https://x.com/Devendra_Dood'
        },
        {
          name: 'LinkedIn',
          icon: Linkedin,
          url: 'https://www.linkedin.com/in/devendrasuryavanshi'
        },
        {
          name: 'Email',
          icon: Mail,
          url: 'mailto:devendrasooryavanshee@gmail.com'
        }
      ]
    }
  }
}
</script>

<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-main">
        <div class="footer-brand">
          <div class="footer-logo">
            <Zap strokeWidth="2" color="#6366f1" :size="32" />
            <span class="footer-logo-text">E-Charge Hub</span>
          </div>
          <p class="footer-description">
            Powering the future of electric mobility with smart, reliable, and scalable charging solutions.
          </p>
          <div class="footer-social">
            <a v-for="social in socialLinks" :key="social.name" :href="social.url" class="social-link" target="_blank"
              rel="noopener noreferrer">
              <component :is="social.icon" :size="20" />
            </a>
          </div>
        </div>

        <div class="footer-links">
          <div class="footer-column">
            <h3 class="footer-title">Platform</h3>
            <ul class="footer-list">
              <li>
                <RouterLink to="/dashboard" class="footer-link">Dashboard</RouterLink>
              </li>
              <li>
                <RouterLink to="/station" class="footer-link">Stations</RouterLink>
              </li>
              <li>
                <RouterLink to="/price" class="footer-link">Pricing</RouterLink>
              </li>
              <li><a href="#" class="footer-link">Analytics</a></li>
            </ul>
          </div>

          <div class="footer-column">
            <h3 class="footer-title">Support</h3>
            <ul class="footer-list">
              <li>
                <RouterLink to="/support" class="footer-link">Help Center</RouterLink>
              </li>
              <li><a href="#" class="footer-link">Documentation</a></li>
              <li><a href="#" class="footer-link">API Reference</a></li>
              <li><a href="#" class="footer-link">Contact Us</a></li>
            </ul>
          </div>

          <div class="footer-column">
            <h3 class="footer-title">Company</h3>
            <ul class="footer-list">
              <li><a href="#" class="footer-link">About Us</a></li>
              <li><a href="#" class="footer-link">Careers</a></li>
              <li><a href="#" class="footer-link">Blog</a></li>
              <li><a href="#" class="footer-link">Press</a></li>
            </ul>
          </div>

          <div class="footer-column">
            <h3 class="footer-title">Legal</h3>
            <ul class="footer-list">
              <li><a href="#" class="footer-link">Privacy Policy</a></li>
              <li><a href="#" class="footer-link">Terms of Service</a></li>
              <li><a href="#" class="footer-link">Cookie Policy</a></li>
              <li><a href="#" class="footer-link">GDPR</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <p class="footer-copyright">
            © 2024 E-Charge Hub. All rights reserved.
          </p>
          <div class="footer-bottom-links">
            <a href="#" class="footer-bottom-link">Status</a>
            <a href="#" class="footer-bottom-link">Security</a>
            <a href="#" class="footer-bottom-link">Sitemap</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-top: 1px solid var(--border-primary);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px 0;
  background-color: transparent;
}

.footer-main {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 80px;
  margin-bottom: 60px;
  background-color: transparent;
}

.footer-brand {
  background-color: transparent;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  background-color: transparent;
}

.footer-logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 32px;
  max-width: 320px;
  background-color: transparent;
}

.footer-social {
  display: flex;
  gap: 16px;
  background-color: transparent;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.social-link:hover {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--text-primary);
  transform: translateY(-2px);
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  background-color: transparent;
}

.footer-column {
  background-color: transparent;
}

.footer-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
  background-color: transparent;
}

.footer-list {
  list-style: none;
  background-color: transparent;
}

.footer-list li {
  margin-bottom: 12px;
  background-color: transparent;
}

.footer-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background-color: transparent;
}

.footer-link:hover {
  color: var(--accent-primary);
}

.footer-bottom {
  border-top: 1px solid var(--border-primary);
  padding: 32px 0;
  background-color: transparent;
}

.footer-bottom-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: transparent;
}

.footer-copyright {
  color: var(--text-muted);
  font-size: 0.9rem;
  background-color: transparent;
}

.footer-bottom-links {
  display: flex;
  gap: 24px;
  background-color: transparent;
}

.footer-bottom-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
  background-color: transparent;
}

.footer-bottom-link:hover {
  color: var(--accent-primary);
}

 * {
  background-color: transparent;
}

@media (max-width: 768px) {
  .footer-content {
    padding: 60px 16px 0;
  }

  .footer-main {
    grid-template-columns: 1fr;
    gap: 60px;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
    gap: 40px;
  }

  .footer-bottom-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .footer-bottom-links {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .footer-links {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .footer-social {
    justify-content: center;
  }

  .footer-bottom-links {
    flex-wrap: wrap;
    gap: 16px;
  }
}
</style>
