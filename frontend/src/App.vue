<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from './components/layout/Navbar.vue';
import Footer from './components/layout/Footer.vue';
import { useAuthStore } from './stores/auth';
import { onMounted } from 'vue';

const auth = useAuthStore()
const currentPath = window.location.pathname
onMounted(() => {
  auth.fetchUser()
})
</script>

<template>
  <div class="app">
    <NavBar />
    <main class="main-content">
      <RouterView />
    </main>
    <Footer  v-if="currentPath !== '/station'" />
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  width: 100%;
  background-color: var(--bg-primary);
}

.main-content {
  margin-top: 70px;
  min-height: calc(100vh - 70px);
  width: 100%;
  background-color: var(--bg-primary);
}

@media (max-width: 768px) {
  .main-content {
    margin-top: 60px;
    min-height: calc(100vh - 60px);
  }
}
</style>
