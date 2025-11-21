import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Message, Conversation } from '../types'
import { useAuthStore } from './auth'

export const useChatStore = defineStore('chat', () => {
  const users = ref<User[]>([])
  const messages = ref<Message[]>([])
  const typingUsers = ref<Map<string, boolean>>(new Map())
  const selectedUserId = ref<string>('')
  const authStore = useAuthStore()

  const conversations = computed<Conversation[]>(() => {
    const myId = authStore.userId
    return users.value.map(user => {
      const userMessages = messages.value.filter(
        msg =>
          // Messages I sent to this user
          (msg.fromUserId === myId && msg.toUserId === user.id) ||
          // Messages this user sent to me
          (msg.fromUserId === user.id && msg.toUserId === myId)
      )
      const lastMessage = userMessages[userMessages.length - 1]
      const unreadCount = userMessages.filter(
        msg => msg.fromUserId === user.id && msg.toUserId === myId && msg.status !== 'read'
      ).length

      return {
        userId: user.id,
        username: user.username,
        zodiac: user.zodiac,
        isOnline: user.isOnline,
        lastMessage,
        unreadCount
      }
    }).sort((a, b) => {
      if (!a.lastMessage) return 1
      if (!b.lastMessage) return -1
      return b.lastMessage.timestamp - a.lastMessage.timestamp
    })
  })

  const currentMessages = computed<Message[]>(() => {
    if (!selectedUserId.value) return []
    const myId = authStore.userId
    return messages.value
      .filter(msg =>
        // Messages I sent to selected user
        (msg.fromUserId === myId && msg.toUserId === selectedUserId.value) ||
        // Messages selected user sent to me
        (msg.fromUserId === selectedUserId.value && msg.toUserId === myId)
      )
      .sort((a, b) => a.timestamp - b.timestamp)
  })

  const selectedUser = computed<User | undefined>(() => {
    return users.value.find(u => u.id === selectedUserId.value)
  })

  const isTyping = computed<boolean>(() => {
    return typingUsers.value.get(selectedUserId.value) || false
  })

  function setUsers(newUsers: User[]) {
    users.value = newUsers
  }

  function updateUserStatus(userId: string, isOnline: boolean) {
    const user = users.value.find(u => u.id === userId)
    if (user) {
      user.isOnline = isOnline
    }
  }

  function addMessage(message: Message) {
    messages.value.push(message)
  }

  function updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read') {
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.status = status
    }
  }

  function setTyping(userId: string, typing: boolean) {
    typingUsers.value.set(userId, typing)
  }

  function selectUser(userId: string) {
    selectedUserId.value = userId

    // Mark all messages from this user as read
    messages.value
      .filter(msg => msg.fromUserId === userId && msg.status !== 'read')
      .forEach(msg => {
        msg.status = 'read'
      })
  }

  function clearSelection() {
    selectedUserId.value = ''
  }

  return {
    users,
    messages,
    typingUsers,
    selectedUserId,
    conversations,
    currentMessages,
    selectedUser,
    isTyping,
    setUsers,
    updateUserStatus,
    addMessage,
    updateMessageStatus,
    setTyping,
    selectUser,
    clearSelection
  }
})
