<template>
  <div class="login-container">
    <!-- Terminal Header -->
    <div class="terminal-header">
      <div class="terminal-title hacker-glow">[ TERMINAL_CHAT_V1.0 ]</div>
      <div class="terminal-subtitle">SELECT YOUR AVATAR</div>
    </div>

    <!-- Zodiac Grid -->
    <div class="zodiac-grid">
      <button
        v-for="zodiac in ZODIACS"
        :key="zodiac.id"
        @click="selectZodiac(zodiac)"
        class="zodiac-card hacker-border"
      >
        <div class="zodiac-emoji">{{ zodiac.emoji }}</div>
        <div class="zodiac-name">{{ zodiac.name }}</div>
      </button>
    </div>

    <!-- Name Input Modal -->
    <div v-if="showNameModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content hacker-border">
        <div class="modal-header">
          <span class="hacker-glow">IDENTITY_VERIFICATION</span>
          <button @click="closeModal" class="close-btn">[X]</button>
        </div>

        <div class="selected-zodiac">
          <span class="text-4xl">{{ selectedZodiac?.emoji }}</span>
          <span class="ml-2">{{ selectedZodiac?.name }}</span>
        </div>

        <div class="input-group">
          <label class="input-label">&gt; ENTER_YOUR_NAME:</label>
          <input
            v-model="username"
            @keyup.enter="confirmLogin"
            type="text"
            class="terminal-input hacker-border"
            placeholder="Type your name..."
            maxlength="20"
            autofocus
          />
        </div>

        <button
          @click="confirmLogin"
          :disabled="!username.trim()"
          class="login-btn hacker-border"
          :class="{ 'opacity-50 cursor-not-allowed': !username.trim() }"
        >
          [ CONNECT ]
        </button>

        <div v-if="authError" class="error-message">
          ! ERROR: {{ authError }}
        </div>
      </div>
    </div>

    <!-- Connection Status -->
    <div v-if="isConnecting" class="connecting-overlay">
      <div class="connecting-text hacker-glow">
        <div class="text-2xl mb-4">CONNECTING...</div>
        <div class="loading-dots">
          <span>▓</span>
          <span>▓</span>
          <span>▓</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ZODIACS } from "../types";
import { useChatSocket } from "../composables/useChatSocket";

const { connect, login, authError, clearAuthError } = useChatSocket();

const showNameModal = ref(false);
const selectedZodiac = ref<(typeof ZODIACS)[0] | null>(null);
const username = ref("");
const isConnecting = ref(false);

function selectZodiac(zodiac: (typeof ZODIACS)[0]) {
  selectedZodiac.value = zodiac;
  showNameModal.value = true;
  username.value = "";
  clearAuthError();
}

function closeModal() {
  showNameModal.value = false;
  selectedZodiac.value = null;
  username.value = "";
  clearAuthError();
  isConnecting.value = false;
}

async function confirmLogin() {
  if (!username.value.trim() || !selectedZodiac.value) return;

  isConnecting.value = true;
  clearAuthError();

  // Connect to WebSocket
  connect();
  console.log("Connecting to WebSocket...");

  // Wait a bit for connection
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Send login
  login(username.value.trim(), selectedZodiac.value.id);

  // Wait for response (success or error)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // If no error, modal will auto-close when auth succeeds
  // If error, keep modal open and show error
  if (!authError.value) {
    showNameModal.value = false;
  }
  isConnecting.value = false;
}
</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
  padding: 20px;
}

.terminal-header {
  text-align: center;
  margin-bottom: 40px;
}

.terminal-title {
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.terminal-subtitle {
  font-size: 14px;
  color: var(--hacker-green);
  opacity: 0.7;
  letter-spacing: 1px;
}

.zodiac-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  max-width: 400px;
  width: 100%;
}

.zodiac-card {
  background: var(--dark-surface);
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.zodiac-card:hover {
  background: var(--dark-border);
  transform: scale(1.05);
  animation: pulse-glow 1s infinite;
}

.zodiac-card:active {
  transform: scale(0.95);
}

.zodiac-emoji {
  font-size: 48px;
}

.zodiac-name {
  font-size: 14px;
  color: var(--hacker-green);
  font-weight: bold;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: var(--dark-surface);
  padding: 30px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: var(--hacker-green);
  cursor: pointer;
  font-size: 20px;
  padding: 5px;
}

.close-btn:hover {
  color: #ff0000;
}

.selected-zodiac {
  text-align: center;
  font-size: 20px;
  margin-bottom: 30px;
  color: var(--hacker-green);
}

.input-group {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  margin-bottom: 10px;
  color: var(--hacker-green);
  font-size: 14px;
}

.terminal-input {
  width: 100%;
  background: var(--dark-bg);
  border-radius: 4px;
  padding: 12px;
  color: var(--hacker-green);
  font-family: "Courier New", monospace;
  font-size: 16px;
  outline: none;
}

.terminal-input:focus {
  animation: pulse-glow 1s infinite;
}

.login-btn {
  width: 100%;
  background: var(--dark-bg);
  color: var(--hacker-green);
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  background: var(--hacker-green-dark);
  color: var(--dark-bg);
  animation: pulse-glow 1s infinite;
}

.error-message {
  margin-top: 15px;
  color: #ff0000;
  text-align: center;
  font-size: 14px;
}

.connecting-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.connecting-text {
  text-align: center;
}

.loading-dots {
  display: flex;
  gap: 10px;
  justify-content: center;
  font-size: 24px;
}

.loading-dots span {
  animation: blink 1.4s infinite both;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
}
</style>
