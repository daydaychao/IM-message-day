import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useChatStore } from "../stores/chat";
import type { WSMessage, Message } from "../types";

const WS_URL = "ws://localhost:8080";

// Singleton WebSocket - shared across all components
const socket = ref<WebSocket | null>(null);
const isConnected = ref(false);
const authError = ref<string>("");

export function useChatSocket() {
  const authStore = useAuthStore();
  const chatStore = useChatStore();

  function connect() {
    if (socket.value?.readyState === WebSocket.OPEN) {
      return;
    }

    socket.value = new WebSocket(WS_URL);

    socket.value.onopen = () => {
      console.log("WebSocket connected");
      isConnected.value = true;
    };

    socket.value.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    socket.value.onclose = () => {
      console.log("WebSocket disconnected");
      isConnected.value = false;

      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        if (authStore.isAuthenticated) {
          connect();
        }
      }, 3000);
    };

    socket.value.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  function disconnect() {
    if (socket.value) {
      socket.value.close();
      socket.value = null;
      isConnected.value = false;
    }
  }

  function send(message: WSMessage) {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }

  function handleMessage(message: any) {
    console.log("Received message:", message);

    switch (message.type) {
      case "auth_success":
      case "register_success":
        if (message.payload) {
          authStore.setUser(
            message.payload.userId,
            message.payload.username,
            message.payload.zodiac
          );
          getUsers();
        }
        break;

      case "users_list":
        if (message.payload?.users) {
          chatStore.setUsers(
            message.payload.users.filter((u: any) => u.id !== authStore.userId)
          );
        }
        break;

      case "message_sent":
        // Confirmation that message was sent to server
        if (message.payload?.message) {
          const msg = message.payload.message;
          // Add sent message to local store
          const sentMessage: Message = {
            id: msg.id,
            fromUserId: msg.senderId,
            toUserId: msg.conversationId, // recipientId
            content: msg.content,
            type: msg.type,
            timestamp: msg.timestamp,
            status: "sent",
          };
          chatStore.addMessage(sentMessage);
        }
        break;

      case "message_received":
        // Received message from another user
        if (message.payload?.message) {
          const msg = message.payload.message;
          const newMessage: Message = {
            id: msg.id,
            fromUserId: msg.senderId,
            toUserId: authStore.userId,
            content: msg.content,
            type: msg.type,
            timestamp: msg.timestamp,
            status: "delivered",
          };
          chatStore.addMessage(newMessage);
        }
        break;

      case "message_delivered":
        // Notification that message was delivered to recipient
        if (message.payload?.messageId) {
          chatStore.updateMessageStatus(message.payload.messageId, "delivered");
        }
        break;

      case "user_typing":
        if (
          message.payload?.userId &&
          message.payload?.isTyping !== undefined
        ) {
          chatStore.setTyping(message.payload.userId, message.payload.isTyping);

          if (message.payload.isTyping) {
            setTimeout(() => {
              chatStore.setTyping(message.payload.userId, false);
            }, 3000);
          }
        }
        break;

      case "message_read":
        if (message.payload?.messageId) {
          chatStore.updateMessageStatus(message.payload.messageId, "read");
        }
        break;

      case "error":
        console.error("Server error:", message.payload?.error);
        authError.value = message.payload?.error || "Unknown error";
        break;
    }
  }

  function login(username: string, zodiac: string) {
    authError.value = ""; // Clear previous errors
    send({
      type: "auth",
      payload: {
        username,
        zodiac,
      },
    });
  }

  function clearAuthError() {
    authError.value = "";
  }

  function getUsers() {
    send({
      type: "get_users",
      payload: {},
    });
  }

  function sendMessage(
    toUserId: string,
    content: string,
    type: "text" | "image" | "emoji" = "text"
  ) {
    send({
      type: "message",
      payload: {
        recipientId: toUserId,
        content,
        type,
      },
    });

    // Note: Message will be added when we receive 'message_sent' confirmation from server
  }

  function sendTyping(toUserId: string, typing: boolean) {
    console.log("[sendTyping]" + ":" + toUserId + ":" + typing);
    send({
      type: "typing",
      payload: {
        recipientId: toUserId,
        isTyping: typing,
      },
    });
  }

  function markAsRead(messageId: string) {
    send({
      type: "read",
      payload: {
        messageId,
      },
    });
  }

  return {
    isConnected,
    authError,
    connect,
    disconnect,
    login,
    getUsers,
    sendMessage,
    sendTyping,
    markAsRead,
    clearAuthError,
  };
}
