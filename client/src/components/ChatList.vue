<template>
  <div class="chat-list-container">
    <!-- Header -->
    <div class="chat-list-header">
      <div class="header-title">
        <span class="hacker-glow">[ TERMINAL ]</span>
      </div>
      <div class="user-info">
        <span class="user-emoji">{{ getUserZodiac(authStore.zodiac) }}</span>
        <span class="user-name">{{ authStore.username }}</span>
      </div>

      <!-- <div class="warning-border">zodiac ID: {{ authStore.zodiac }}</div> -->
    </div>

    <!-- Search/Filter -->
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="> SEARCH_USER..."
      />
    </div>

    <!-- Online Count -->
    <div class="online-status">
      <span class="online-indicator">●</span>
      <span>{{ onlineCount }} ONLINE</span>
    </div>

    <!-- User List -->
    <div class="user-list">
      <!-- Anime -->
      <TransitionGroup name="user-item-anim" tag="div">
        <div
          v-for="conversation in filteredConversations"
          :key="conversation.userId"
          @click="selectUser(conversation.userId)"
          class="user-item"
          :class="{
            active: chatStore.selectedUserId === conversation.userId,
            online: conversation.isOnline,
            offline: !conversation.isOnline,
          }"
        >
          <div class="user-avatar">
            <!-- <div class="warning-border">
            conversation.zodiac:{{ conversation.zodiac }}
          </div> -->
            <span class="text-3xl">{{
              getUserZodiac(conversation.zodiac)
            }}</span>
            <span v-if="conversation.isOnline" class="online-dot"></span>
          </div>

          <div class="user-details">
            <div class="user-name-row">
              <span class="username">{{ conversation.username }}</span>
              <span v-if="conversation.unreadCount > 0" class="unread-badge">
                {{ conversation.unreadCount }}
              </span>
            </div>
            <div v-if="conversation.lastMessage" class="last-message">
              <span v-if="conversation.lastMessage.type === 'image'"
                >📷 Image</span
              >
              <span v-else-if="conversation.lastMessage.type === 'emoji'">{{
                conversation.lastMessage.content
              }}</span>
              <span v-else>{{
                truncate(conversation.lastMessage.content, 30)
              }}</span>
            </div>
            <div v-else class="last-message">No messages yet</div>
          </div>
        </div>

        <div v-if="filteredConversations.length === 0" class="empty-state">
          <div class="text-center py-8">
            <div class="text-2xl mb-2">¯\_(ツ)_/¯</div>
            <div>NO USERS FOUND</div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from "../stores/auth";
import { useChatStore } from "../stores/chat";
import { ZODIACS } from "../types";

const authStore = useAuthStore();
const chatStore = useChatStore();
const searchQuery = ref("");

const emit = defineEmits<{
  selectUser: [userId: string];
}>();

const filteredConversations = computed(() => {
  let conversations = chatStore.conversations;

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    conversations = conversations.filter((c) =>
      c.username.toLowerCase().includes(query)
    );
  }

  // Sort: online users first, then offline users
  return [...conversations].sort((a, b) => {
    // First, sort by online status (online first)
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;

    // Then sort by last message timestamp
    const aTime = a.lastMessage?.timestamp || 0;
    const bTime = b.lastMessage?.timestamp || 0;
    return bTime - aTime;
  });
});

const onlineCount = computed(() => {
  return chatStore.users.filter((u) => u.isOnline).length;
});

function getUserZodiac(zodiacId: string) {
  return ZODIACS.find((z) => z.id === zodiacId)?.emoji || "🐾";
}

function selectUser(userId: string) {
  chatStore.selectUser(userId);
  emit("selectUser", userId);
}

function truncate(text: string, length: number) {
  return text.length > length ? text.substring(0, length) + "..." : text;
}
</script>

<style scoped>
/* 進場 / 離場 */
.user-item-anim-enter-from,
.user-item-anim-leave-to {
  opacity: 0;
  transform: translateX(-8px) scale(0.96);
}

.user-item-anim-enter-to,
.user-item-anim-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.user-item-anim-enter-active,
.user-item-anim-leave-active {
  transition: all 0.18s cubic-bezier(0.3, 0.7, 0.4, 1.2);
}

/* sort / 重新排列時的位移動畫 */
.user-item-anim-move {
  transition: transform 0.18s ease-out;
}

/* 進場時 hacker 綠微微發光一下（不影響原本 box-shadow） */
.user-item-anim-enter-active {
  animation: user-item-flash 0.35s ease-out;
}

@keyframes user-item-flash {
  0% {
    filter: drop-shadow(0 0 0 rgba(0, 255, 65, 0));
  }
  40% {
    filter: drop-shadow(0 0 12px rgba(0, 255, 65, 0.9));
  }
  100% {
    filter: drop-shadow(0 0 0 rgba(0, 255, 65, 0));
  }
}

.chat-list-container {
  width: 100%;
  height: 100vh;
  background: var(--dark-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-list-header {
  padding: 15px;
  border-bottom: 1px solid var(--dark-border);
  background: var(--dark-surface);
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--hacker-green);
}

.user-emoji {
  font-size: 20px;
}

.user-name {
  opacity: 0.8;
}

.search-container {
  padding: 15px;
  border-bottom: 1px solid var(--dark-border);
}

.search-input {
  width: 100%;
  background: var(--dark-surface);
  color: var(--hacker-green);
  padding: 10px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
}

.online-status {
  padding: 10px 15px;
  font-size: 12px;
  color: var(--hacker-green);
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--dark-border);
}

.online-indicator {
  color: var(--hacker-green);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  margin-bottom: 10px;
  background: var(--dark-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

/* Online users - green border */
.user-item.online {
  border: 1px solid var(--hacker-green);
  box-shadow: 0 0 5px rgba(0, 255, 65, 0.3);
}

.user-item.online:hover {
  background: var(--dark-border);
  transform: translateX(5px);
  box-shadow: 0 0 15px rgba(0, 255, 65, 0.2);
}

.user-item.online.active {
  background: var(--dark-border);
  box-shadow: 0 0 15px rgba(0, 255, 65, 0.4);
}

/* Offline users - gray border and text */
.user-item.offline {
  border: 1px solid #3a3a3a;
  box-shadow: 0 0 5px rgba(128, 128, 128, 0.1);
}

.user-item.offline:hover {
  background: var(--dark-border);
  transform: translateX(5px);
  box-shadow: 0 0 10px rgba(128, 128, 128, 0.2);
}

.user-item.offline .username,
.user-item.offline .last-message {
  color: #666666;
}

.user-item.offline .user-avatar {
  opacity: 0.6;
}

.user-avatar {
  position: relative;
  flex-shrink: 0;
}

.online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: var(--hacker-green);
  border: 2px solid var(--dark-surface);
  border-radius: 50%;
  box-shadow: 0 0 5px var(--hacker-green);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.username {
  font-weight: bold;
  color: var(--hacker-green);
  font-size: 16px;
}

.unread-badge {
  background: var(--hacker-green);
  color: var(--dark-bg);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.last-message {
  font-size: 14px;
  color: var(--hacker-green);
  opacity: 0.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--hacker-green);
  opacity: 0.5;
}
</style>
