import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'
import Station from '../views/Station.vue'
import AddStation from '../views/AddStation.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
  },
  {
    path: '/station',
    name: 'Station',
    component: Station,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-station',
    name: 'AddStation',
    component: AddStation,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  if (auth.user === null && auth.loading) {
    await auth.fetchUser()
  }

  if (to.meta.requiresAuth && !auth.user) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
