import { WebSocket } from 'ws'

export interface User {
  id: string
  username: string
  zodiac: string
}

export interface ConnectedClient {
  userId: string
  username: string
  zodiac: string
  ws: WebSocket
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  type: 'text' | 'image'
  timestamp: number
  status: 'sent' | 'delivered' | 'read'
  conversationId: string  // userId for DM, groupId for group
  isGroup: boolean
}

export interface Group {
  id: string
  name: string
  members: string[]  // userIds
  createdBy: string
  createdAt: number
}

export interface WSMessage {
  type: 'auth' | 'register' | 'message' | 'typing' | 'read' | 'create_group' | 'join_group' | 'get_groups' | 'get_users'
  payload: any
}

export interface AuthPayload {
  username: string
  zodiac: string
}

export interface RegisterPayload {
  username: string
  zodiac: string
}

export interface MessagePayload {
  recipientId?: string  // for DM
  groupId?: string      // for group chat
  content: string
  type: 'text' | 'image'
}

export interface TypingPayload {
  recipientId?: string
  groupId?: string
  isTyping: boolean
}

export interface ReadPayload {
  messageId: string
}

export interface CreateGroupPayload {
  name: string
  memberIds: string[]
}
