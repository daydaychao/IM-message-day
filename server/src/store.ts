import { redisClient } from './redis'
import { User, ConnectedClient, Message, Group } from './types'

export class DataStore {
  private connectedClients: Map<string, ConnectedClient> = new Map()

  // User methods
  async createUser(user: User): Promise<void> {
    // Store user data
    await redisClient.hset(`user:${user.id}`,
      'id', user.id,
      'username', user.username,
      'zodiac', user.zodiac
    )
    // Create username index
    await redisClient.set(`user:username:${user.username}`, user.id)
    // Add to users set
    await redisClient.sadd('users', user.id)
  }

  async getUserById(id: string): Promise<User | null> {
    const userData = await redisClient.hgetall(`user:${id}`)
    if (!userData || !userData.id) return null
    return {
      id: userData.id,
      username: userData.username,
      zodiac: userData.zodiac
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const userId = await redisClient.get(`user:username:${username}`)
    if (!userId) return null
    return this.getUserById(userId)
  }

  async getAllUsers(): Promise<User[]> {
    const userIds = await redisClient.smembers('users')
    const users: User[] = []

    for (const userId of userIds) {
      const user = await this.getUserById(userId)
      if (user) users.push(user)
    }

    return users
  }

  // Connected clients methods (still in memory for WebSocket connections)
  addConnectedClient(client: ConnectedClient): void {
    this.connectedClients.set(client.userId, client)
  }

  removeConnectedClient(userId: string): void {
    this.connectedClients.delete(userId)
  }

  getConnectedClient(userId: string): ConnectedClient | undefined {
    return this.connectedClients.get(userId)
  }

  getAllConnectedClients(): ConnectedClient[] {
    return Array.from(this.connectedClients.values())
  }

  // Message methods
  async addMessage(message: Message): Promise<void> {
    await redisClient.hset(`message:${message.id}`,
      'id', message.id,
      'senderId', message.senderId,
      'senderName', message.senderName,
      'content', message.content,
      'type', message.type,
      'timestamp', message.timestamp.toString(),
      'status', message.status,
      'conversationId', message.conversationId,
      'isGroup', message.isGroup.toString()
    )
    // Add to conversation messages list
    await redisClient.lpush(`conversation:${message.conversationId}:messages`, message.id)
  }

  async getMessageById(id: string): Promise<Message | null> {
    const messageData = await redisClient.hgetall(`message:${id}`)
    if (!messageData || !messageData.id) return null

    return {
      id: messageData.id,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      content: messageData.content,
      type: messageData.type as 'text' | 'image',
      timestamp: parseInt(messageData.timestamp),
      status: messageData.status as 'sent' | 'delivered' | 'read',
      conversationId: messageData.conversationId,
      isGroup: messageData.isGroup === 'true'
    }
  }

  async updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read'): Promise<void> {
    await redisClient.hset(`message:${messageId}`, 'status', status)
  }

  async getConversationMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const messageIds = await redisClient.lrange(`conversation:${conversationId}:messages`, 0, limit - 1)
    const messages: Message[] = []

    for (const messageId of messageIds) {
      const message = await this.getMessageById(messageId)
      if (message) messages.push(message)
    }

    return messages.reverse() // Oldest first
  }

  // Group methods
  async createGroup(group: Group): Promise<void> {
    await redisClient.hset(`group:${group.id}`,
      'id', group.id,
      'name', group.name,
      'createdBy', group.createdBy,
      'createdAt', group.createdAt.toString()
    )

    // Add members
    if (group.members.length > 0) {
      await redisClient.sadd(`group:${group.id}:members`, ...group.members)
    }

    // Add to each user's groups
    for (const memberId of group.members) {
      await redisClient.sadd(`user:${memberId}:groups`, group.id)
    }
  }

  async getGroupById(id: string): Promise<Group | null> {
    const groupData = await redisClient.hgetall(`group:${id}`)
    if (!groupData || !groupData.id) return null

    const members = await redisClient.smembers(`group:${id}:members`)

    return {
      id: groupData.id,
      name: groupData.name,
      members: members,
      createdBy: groupData.createdBy,
      createdAt: parseInt(groupData.createdAt)
    }
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const groupIds = await redisClient.smembers(`user:${userId}:groups`)
    const groups: Group[] = []

    for (const groupId of groupIds) {
      const group = await this.getGroupById(groupId)
      if (group) groups.push(group)
    }

    return groups
  }

  async addGroupMember(groupId: string, userId: string): Promise<void> {
    await redisClient.sadd(`group:${groupId}:members`, userId)
    await redisClient.sadd(`user:${userId}:groups`, groupId)
  }

  async getAllGroups(): Promise<Group[]> {
    // Scan for all group keys
    const groupKeys: string[] = []
    let cursor = '0'

    do {
      const result = await redisClient.scan(cursor, 'MATCH', 'group:*', 'COUNT', '100')
      cursor = result[0]
      groupKeys.push(...result[1].filter(key => !key.includes(':members')))
    } while (cursor !== '0')

    const groups: Group[] = []
    for (const key of groupKeys) {
      const groupId = key.replace('group:', '')
      const group = await this.getGroupById(groupId)
      if (group) groups.push(group)
    }

    return groups
  }
}

export const store = new DataStore()
