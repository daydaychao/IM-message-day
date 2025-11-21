<template>
  <div class="app-container">
    <LoginPage v-if="!authStore.isAuthenticated" />
    <ChatPage v-else />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth'
import LoginPage from './pages/LoginPage.vue'
import ChatPage from './pages/ChatPage.vue'

const authStore = useAuthStore()
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0a0a;
}
</style>
