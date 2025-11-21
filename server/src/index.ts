import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { connectRedis, redisClient } from "./redis";
import { store } from "./store";
import {
  WSMessage,
  AuthPayload,
  RegisterPayload,
  MessagePayload,
  TypingPayload,
  ReadPayload,
  CreateGroupPayload,
  Message,
  ConnectedClient,
} from "./types";

const PORT = 8080;
const GREEN = "\x1b[92m";
const RESET = "\x1b[0m";

// Initialize Redis connection
connectRedis()
  .then(async () => {
    console.log("Redis connected successfully");

    // 皜祈岫 Redis
    const pong = await redisClient.ping();
    console.log("Redis PING response:", pong); // ?府??"PONG"

    // 皜祈岫撖怠????    await redisClient.set("test", "test value is okay");
    const value = await redisClient.get("test");
    console.log(`${GREEN}Test value: ${value}${RESET}`); // should log "hello"
    startServer();
  })
  .catch((err) => {
    console.error("Failed to connect to Redis:", err);
    console.log("Please make sure Redis is running on localhost:6379");
    process.exit(1);
  });

function startServer() {
  const wss = new WebSocketServer({ port: PORT });
  console.log(`WebSocket server started on port ${PORT}`);

  // Map to track which userId belongs to which WebSocket
  const wsToUserId = new WeakMap<WebSocket, string>();

  wss.on("connection", (ws: WebSocket) => {
    console.log("New client connected");

    ws.on("message", async (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        console.log(
          `${GREEN}📥 Received WebSocket message: ${message.type}${RESET}`
        );
        console.log("   Payload:", JSON.stringify(message.payload, null, 2));
        await handleMessage(ws, message);
      } catch (error) {
        console.error("Error parsing message:", error);
        sendError(ws, "Invalid message format");
      }
    });

    ws.on("close", async () => {
      try {
        const userId = wsToUserId.get(ws);
        if (userId) {
          await store.removeConnectedClient(userId);
          console.log(`User ${userId} disconnected`);

          // Notify other users
          await broadcastUserList();
        }
      } catch (error) {
        console.error("Error handling close:", error);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  async function handleMessage(ws: WebSocket, message: WSMessage) {
    try {
      switch (message.type) {
        case "register":
          await handleRegister(ws, message.payload as RegisterPayload);
          break;
        case "auth":
          await handleAuth(ws, message.payload as AuthPayload);
          break;
        case "message":
          await handleChatMessage(ws, message.payload as MessagePayload);
          break;
        case "typing":
          await handleTyping(ws, message.payload as TypingPayload);
          break;
        case "read":
          await handleRead(ws, message.payload as ReadPayload);
          break;
        case "create_group":
          await handleCreateGroup(ws, message.payload as CreateGroupPayload);
          break;
        case "get_groups":
          await handleGetGroups(ws);
          break;
        case "get_users":
          await handleGetUsers(ws);
          break;
        default:
          sendError(ws, "Unknown message type");
      }
    } catch (error) {
      console.error("Error handling message:", error);
      sendError(ws, "Internal server error");
    }
  }

  async function handleRegister(ws: WebSocket, payload: RegisterPayload) {
    const { username, zodiac } = payload;

    console.log(
      `Registration attempt: username="${username}", zodiac="${zodiac}"`
    );

    // Check if user already exists
    const existingUser = await store.getUserByUsername(username);
    if (existingUser) {
      console.log(`Username already exists: ${username}`);
      sendError(ws, "Username already exists");
      return;
    }

    // Create new user
    const userId = uuidv4();
    await store.createUser({
      id: userId,
      username,
      zodiac,
    });

    // Store connection (auto-login after registration)
    wsToUserId.set(ws, userId);
    await store.addConnectedClient({
      userId: userId,
      username: username,
      zodiac: zodiac,
      ws,
    });

    console.log(`User registered successfully: ${username}`);
    const allUsers = await store.getAllUsers();
    console.log(`Total users in database: ${allUsers.length}`);

    send(ws, {
      type: "register_success",
      payload: {
        userId,
        username,
        zodiac,
      },
    });

    // Broadcast updated user list
    await broadcastUserList();
  }

  async function handleAuth(ws: WebSocket, payload: AuthPayload) {
    const { username, zodiac } = payload;

    console.log(`Login attempt: username="${username}", zodiac="${zodiac}"`);
    let user = await store.getUserByUsername(username);

    // If user doesn't exist, auto-register
    if (!user) {
      console.log(`Auto-registering new user: ${username}`);
      const userId = uuidv4();
      await store.createUser({
        id: userId,
        username,
        zodiac,
      });
      user = await store.getUserByUsername(username);
    }

    if (!user) {
      console.log(`Failed to create/find user: ${username}`);
      sendError(ws, "Authentication failed");
      return;
    }

    // Store connection
    wsToUserId.set(ws, user.id);
    await store.addConnectedClient({
      userId: user.id,
      username: user.username,
      zodiac: user.zodiac,
      ws,
    });

    console.log(`User authenticated: ${username}`);

    // Send success response
    send(ws, {
      type: "auth_success",
      payload: {
        userId: user.id,
        username: user.username,
        zodiac: user.zodiac,
      },
    });

    // Send user groups
    const groups = await store.getUserGroups(user.id);
    send(ws, {
      type: "groups_list",
      payload: { groups },
    });

    // Broadcast updated user list
    await broadcastUserList();
  }

  async function handleChatMessage(ws: WebSocket, payload: MessagePayload) {
    console.log(
      "? handleChatMessage called with payload:",
      JSON.stringify(payload, null, 2)
    );

    const userId = wsToUserId.get(ws);
    if (!userId) {
      console.log("??User not authenticated");
      sendError(ws, "Not authenticated");
      return;
    }
    console.log("??User authenticated:", userId);

    const user = await store.getUserById(userId);
    if (!user) {
      console.log("??User not found:", userId);
      return;
    }
    console.log("??User found:", user.username);

    const messageId = uuidv4();
    const isGroup = !!payload.groupId;
    const conversationId = payload.groupId || payload.recipientId || "";

    console.log("?? Creating message:", { messageId, conversationId, isGroup });

    const message: Message = {
      id: messageId,
      senderId: userId,
      senderName: user.username,
      content: payload.content,
      type: payload.type,
      timestamp: Date.now(),
      status: "sent",
      conversationId,
      isGroup,
    };

    await store.addMessage(message);
    console.log("??Message saved to store");

    // Send confirmation to sender
    console.log("? Sending message_sent to sender");
    send(ws, {
      type: "message_sent",
      payload: { message },
    });

    // Deliver to recipients
    if (isGroup) {
      // Group message
      console.log("? Group message, finding group:", conversationId);
      const group = await store.getGroupById(conversationId);
      if (group) {
        for (const memberId of group.members) {
          if (memberId !== userId) {
            const client = await store.getConnectedClient(memberId);
            if (client) {
              console.log("? Sending to group member:", memberId);
              send(client.ws, {
                type: "message_received",
                payload: { message },
              });
              // Update to delivered
              await store.updateMessageStatus(messageId, "delivered");
            }
          }
        }
      }
    } else {
      // DM
      console.log("? DM message, finding recipient:", conversationId);
      const recipient = await store.getConnectedClient(conversationId);
      if (recipient) {
        console.log("??Recipient found, sending message_received");
        send(recipient.ws, {
          type: "message_received",
          payload: { message },
        });
        // Update to delivered
        await store.updateMessageStatus(messageId, "delivered");

        // Notify sender of delivery
        console.log("? Sending message_delivered to sender");
        send(ws, {
          type: "message_delivered",
          payload: { messageId },
        });
      } else {
        console.log("??Recipient not found or offline:", conversationId);
      }
    }
    console.log("??handleChatMessage completed");
  }

  async function handleTyping(ws: WebSocket, payload: TypingPayload) {
    const userId = wsToUserId.get(ws);
    if (!userId) return;

    const user = await store.getUserById(userId);
    if (!user) return;

    if (payload.groupId) {
      // Broadcast to group
      const group = await store.getGroupById(payload.groupId);
      if (group) {
        for (const memberId of group.members) {
          if (memberId !== userId) {
            const client = await store.getConnectedClient(memberId);
            if (client) {
              send(client.ws, {
                type: "user_typing",
                payload: {
                  userId,
                  username: user.username,
                  groupId: payload.groupId,
                  isTyping: payload.isTyping,
                },
              });
            }
          }
        }
      }
    } else if (payload.recipientId) {
      // Send to specific user
      const recipient = await store.getConnectedClient(payload.recipientId);
      if (recipient) {
        send(recipient.ws, {
          type: "user_typing",
          payload: {
            userId,
            username: user.username,
            isTyping: payload.isTyping,
          },
        });
      }
    }
  }

  async function handleRead(ws: WebSocket, payload: ReadPayload) {
    const userId = wsToUserId.get(ws);
    if (!userId) return;

    const message = await store.getMessageById(payload.messageId);
    if (!message) return;

    await store.updateMessageStatus(payload.messageId, "read");

    // Notify sender
    const sender = await store.getConnectedClient(message.senderId);
    if (sender) {
      send(sender.ws, {
        type: "message_read",
        payload: { messageId: payload.messageId },
      });
    }
  }

  async function handleCreateGroup(ws: WebSocket, payload: CreateGroupPayload) {
    const userId = wsToUserId.get(ws);
    if (!userId) {
      sendError(ws, "Not authenticated");
      return;
    }

    const groupId = uuidv4();
    const group = {
      id: groupId,
      name: payload.name,
      members: [userId, ...payload.memberIds],
      createdBy: userId,
      createdAt: Date.now(),
    };

    await store.createGroup(group);

    // Notify all members
    for (const memberId of group.members) {
      const client = await store.getConnectedClient(memberId);
      if (client) {
        send(client.ws, {
          type: "group_created",
          payload: { group },
        });
      }
    }

    console.log(`Group created: ${payload.name}`);
  }

  async function handleGetGroups(ws: WebSocket) {
    const userId = wsToUserId.get(ws);
    if (!userId) {
      sendError(ws, "Not authenticated");
      return;
    }

    const groups = await store.getUserGroups(userId);
    send(ws, {
      type: "groups_list",
      payload: { groups },
    });
  }

  async function handleGetUsers(ws: WebSocket) {
    const userId = wsToUserId.get(ws);
    if (!userId) {
      sendError(ws, "Not authenticated");
      return;
    }

    const allUsers = await store.getAllUsers();
    const usersWithStatus = [];

    for (const u of allUsers) {
      const client = await store.getConnectedClient(u.id);
      usersWithStatus.push({
        id: u.id,
        username: u.username,
        zodiac: u.zodiac,
        isOnline: !!client,
      });
    }

    send(ws, {
      type: "users_list",
      payload: { users: usersWithStatus },
    });
  }

  async function broadcastUserList() {
    const connectedClients = await store.getAllConnectedClients();
    const allUsers = await store.getAllUsers();
    const usersWithStatus: Array<{
      id: string;
      username: string;
      zodiac: string;
      isOnline: boolean;
    }> = [];

    for (const u of allUsers) {
      const client = await store.getConnectedClient(u.id);
      usersWithStatus.push({
        id: u.id,
        username: u.username,
        zodiac: u.zodiac,
        isOnline: !!client,
      });
    }

    connectedClients.forEach((client) => {
      send(client.ws, {
        type: "users_list",
        payload: { users: usersWithStatus },
      });
    });
  }

  function send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  function sendError(ws: WebSocket, error: string) {
    send(ws, {
      type: "error",
      payload: { error },
    });
  }
}
