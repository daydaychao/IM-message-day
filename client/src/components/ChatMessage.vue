<template>
  <div
    v-if="chatStore.selectedUser"
    class="chat-message-container"
    :class="{ 'slide-in-right': isVisible, 'slide-out-right': isClosing }"
  >
    <!-- Header -->
    <div class="chat-header">
      <button @click="handleBack" class="back-btn">
        <span class="text-[2rem]">←</span>
      </button>
      <div class="header-user-info">
        <span class="text-2xl">{{
          getUserZodiac(chatStore.selectedUser.zodiac)
        }}</span>
        <div class="ml-3">
          <div class="username-header">
            {{ chatStore.selectedUser.username }}
          </div>
          <div class="status-text">
            <span v-if="chatStore.selectedUser.isOnline" class="text-green-400"
              >● Online</span
            >
            <span v-else class="text-gray-500">● Offline</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <div ref="messageListRef" class="message-list">
      <div
        v-for="message in chatStore.currentMessages"
        :key="message.id"
        class="message-wrapper"
        :class="{ sent: message.fromUserId === authStore.userId }"
      >
        <div class="message-bubble hacker-border">
          <!-- Image Message -->
          <img
            v-if="message.type === 'image'"
            :src="message.content"
            class="message-image"
            alt="Image"
            @click="handleImagePopUp"
          />
          <!-- Text/Emoji Message -->
          <div v-else class="message-text">
            {{ message.content }}
          </div>
          <!-- Message Status -->
          <div class="message-meta">
            <span class="message-time">{{
              formatTime(message.timestamp)
            }}</span>
            <span
              v-if="message.fromUserId === authStore.userId"
              class="message-status"
            >
              <span v-if="message.status === 'sent'">✓</span>
              <span v-else-if="message.status === 'delivered'">✓✓</span>
              <span v-else-if="message.status === 'read'" class="text-green-400"
                >✓✓</span
              >
            </span>
          </div>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div v-if="chatStore.isTyping" class="typing-indicator">
        <div class="typing-bubble hacker-border">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>

      <div v-if="chatStore.currentMessages.length === 0" class="empty-messages">
        <div class="text-center">
          <div class="text-4xl mb-4">💬</div>
          <div>START CONVERSATION</div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <!-- Emoji Picker Toggle -->
      <button @click="toggleEmojiPicker" class="input-btn">😀</button>

      <!-- Image Upload -->
      <button @click="triggerImageUpload" class="input-btn">📷</button>
      <input
        ref="imageInputRef"
        type="file"
        accept="image/*"
        @change="handleImageSelect"
        class="hidden"
      />

      <!-- Text Input -->
      <input
        v-model="messageInput"
        @input="handleTyping"
        @keyup.enter="sendTextMessage"
        type="text"
        class="message-input"
        placeholder="> TYPE_MESSAGE..."
      />

      <!-- Send Button -->
      <!-- <button
        @click="sendTextMessage"
        :disabled="!messageInput.trim()"
        class="send-btn hacker-border"
        :class="{ 'opacity-50': !messageInput.trim() }"
      >
        ▶
      </button> -->

      <n-button
        @click="sendTextMessage"
        :disabled="!messageInput.trim()"
        class="send-btn"
        :class="{ 'opacity-50': !messageInput.trim() }"
        :theme-overrides="{
          border: '1px solid #22c55e',
          borderHover: '1px solid #16a34a',
          borderPressed: '1px solid #15803d',
          borderDisabled: '1px solid #14532d',
        }"
      >
        ▶
      </n-button>
    </div>

    <!-- Emoji Picker -->
    <div
      v-if="!hiddenAfterSlideOut"
      class="emoji-panel hacker-border"
      :class="{
        'slide-in-bottom': showEmojiPicker,
        'slide-out-bottom': !showEmojiPicker,
      }"
      @animationend="handleAnimationEnd"
    >
      <div class="relative w-full h-10">
        <button @click="toggleEmojiPicker" class="absolute top-3 right-3">
          返回
        </button>
      </div>
      <div class="emoji-picker">
        <button
          v-for="emoji in EMOJIS"
          :key="emoji"
          @click="sendEmoji(emoji)"
          class="emoji-btn"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { useAuthStore } from "../stores/auth";
import { useChatStore } from "../stores/chat";
import { useChatSocket } from "../composables/useChatSocket";
import { ZODIACS, EMOJIS } from "../types";

const authStore = useAuthStore();
const chatStore = useChatStore();
const { sendMessage, sendTyping } = useChatSocket();

const emit = defineEmits<{
  close: [];
}>();

const messageInput = ref("");
const showEmojiPicker = ref(false);
const imageInputRef = ref<HTMLInputElement | null>(null);
const messageListRef = ref<HTMLDivElement | null>(null);
const isVisible = ref(true);
const isClosing = ref(false);

watch(showEmojiPicker, (v) => {
  if (v) {
    hiddenAfterSlideOut.value = false; // 打開時解除 hidden
  }
});

// animation
const hiddenAfterSlideOut = ref(false);
const handleAnimationEnd = (e: any) => {
  console.log("Animation ended:", e.animationName);
  if (e.animationName === "slideOutBottom") {
    hiddenAfterSlideOut.value = true; // 收起動畫結束後 hidden
  }
};

let typingTimer: ReturnType<typeof setTimeout> | null = null;

// Auto-scroll to bottom
watch(
  () => chatStore.currentMessages.length,
  () => {
    nextTick(() => {
      scrollToBottom();
    });
  }
);

watch(
  () => chatStore.selectedUserId,
  () => {
    isVisible.value = true;
    isClosing.value = false;
    nextTick(() => {
      scrollToBottom();
    });
  }
);

function scrollToBottom() {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
}

function getUserZodiac(zodiacId: string) {
  return ZODIACS.find((z) => z.id === zodiacId)?.emoji || "🐾";
}

function handleBack() {
  isClosing.value = true;
  setTimeout(() => {
    chatStore.clearSelection();
    emit("close");
  }, 300);
}

function handleTyping() {
  if (!chatStore.selectedUserId) return;

  sendTyping(chatStore.selectedUserId, true);

  if (typingTimer) {
    clearTimeout(typingTimer);
  }

  typingTimer = setTimeout(() => {
    sendTyping(chatStore.selectedUserId, false);
  }, 2000);
}

function sendTextMessage() {
  if (!messageInput.value.trim() || !chatStore.selectedUserId) {
    console.log("[sendTextMessage] No message to send or no user selected.");
    return;
  }
  const id = chatStore.selectedUserId;
  const msg = messageInput.value.trim();
  console.log("[sendTextMessage]" + ":" + id + ":" + msg);

  sendMessage(id, msg, "text");
  messageInput.value = "";

  if (typingTimer) clearTimeout(typingTimer);
  sendTyping(chatStore.selectedUserId, false);
}

function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value;
}

function sendEmoji(emoji: string) {
  // Insert emoji into input instead of sending directly
  messageInput.value += emoji;

  // showEmojiPicker.value = false;
}

function triggerImageUpload() {
  imageInputRef.value?.click();
}

function handleImageSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file || !chatStore.selectedUserId) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target?.result as string;
    sendMessage(chatStore.selectedUserId, base64, "image");
  };
  reader.readAsDataURL(file);

  // Reset input
  target.value = "";
}

function handleImagePopUp(event: Event) {
  const target = event.target as HTMLImageElement;
  const imageUrl = target.src;
  window.open(imageUrl, "_blank");
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<style scoped>
.chat-message-container {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100vh;
  background: var(--dark-bg);
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: var(--dark-surface);
  border-bottom: 1px solid var(--dark-border);
}

.back-btn {
  color: var(--hacker-green);
  border-radius: 4px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: var(--hacker-green);
  color: var(--dark-bg);
  box-shadow: 0 0 10px var(--hacker-green);
}

.header-user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.username-header {
  font-weight: bold;
  color: var(--hacker-green);
  font-size: 16px;
}

.status-text {
  font-size: 12px;
  opacity: 0.7;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-wrapper {
  display: flex;
  justify-content: flex-start;
}

.message-wrapper.sent {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--dark-surface);
}

.message-wrapper.sent .message-bubble {
  background: var(--hacker-green-dark);
  color: var(--dark-bg);
}

.message-text {
  word-wrap: break-word;
  font-size: 15px;
  line-height: 1.4;
  margin-bottom: 5px;
  font-weight: bold;
}

.message-image {
  max-width: 100%;
  border-radius: 8px;
  margin-bottom: 5px;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  opacity: 0.7;
  gap: 10px;
}

.message-time {
  white-space: nowrap;
}

.message-status {
  font-size: 12px;
}

.typing-indicator {
  display: flex;
  justify-content: flex-start;
}

.typing-bubble {
  background: var(--dark-surface);
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  gap: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--hacker-green);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.empty-messages {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--hacker-green);
  opacity: 0.5;
}

.input-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: var(--dark-surface);
  border-top: 1px solid var(--dark-border);
}

.input-btn {
  background: var(--dark-bg);
  /* border: 1px solid var(--hacker-green); */
  border-radius: 4px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s ease;
}

.input-btn:hover {
  background: var(--hacker-green);
  transform: scale(1.1);
}

.message-input {
  flex: 1;
  background: var(--dark-bg);
  color: var(--hacker-green);
  padding: 10px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 14px;
  outline: none;
}

.message-input:focus {
  box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
}
.send-btn {
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  background: var(--hacker-green);
  box-shadow: 0 0 15px var(--hacker-green);
  transform: scale(1.1);
}
.emoji-panel {
  position: absolute;
  bottom: 75px;
  left: 0;
  right: 0;
  background: var(--dark-surface);
}

.emoji-picker {
  padding: 10px 5px;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 200;
}

.emoji-btn {
  border: none;
  border-radius: 4px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.emoji-btn:hover {
  background: var(--dark-border);
  transform: scale(1.2);
}

.hidden {
  display: none;
}
</style>
