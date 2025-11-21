<template>
  <div class="chat-page-container">
    <!-- Chat List (Always visible on mobile) -->
    <ChatList
      v-show="!chatStore.selectedUserId"
      @select-user="handleSelectUser"
    />

    <!-- Chat Message (Slides in from right) -->
    <ChatMessage
      v-if="chatStore.selectedUserId"
      @close="handleCloseChat"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useChatStore } from '../stores/chat'
import { useChatSocket } from '../composables/useChatSocket'
import ChatList from '../components/ChatList.vue'
import ChatMessage from '../components/ChatMessage.vue'

const chatStore = useChatStore()
const { getUsers } = useChatSocket()

onMounted(() => {
  // Fetch users on mount
  getUsers()

  // Refresh user list every 10 seconds
  const interval = setInterval(() => {
    getUsers()
  }, 10000)

  // Cleanup
  onUnmounted(() => {
    clearInterval(interval)
  })
})

function handleSelectUser(userId: string) {
  chatStore.selectUser(userId)
}

function handleCloseChat() {
  chatStore.clearSelection()
}
</script>

<style scoped>
.chat-page-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: var(--dark-bg);
}
</style>
