import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'
import Station from '../views/Station.vue'
import StationCreate from '../views/StationCreate.vue'
import StationEdit from '../views/StationEdit.vue'
import Dashboard from '../views/Dashboard.vue'
import Price from '../views/Price.vue'
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
    path: '/stations',
    name: 'station',
    component: Station,
    meta: { requiresAuth: true }
  },
  {
    path: '/stations/create',
    name: 'station-create',
    component: StationCreate,
    meta: { requiresAuth: true }
  },
  {
    path: '/stations/:id/edit',
    name: 'station-edit',
    component: StationEdit,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
  },
  {
    path: '/price',
    name: 'price',
    component: Price,
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
