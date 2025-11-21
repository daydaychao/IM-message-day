# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IM Chat Demo - A desktop instant messaging application built for portfolio demonstration.

**Tech Stack:**
- **Frontend**: Vue 3 + Vite + TypeScript + Tailwind CSS + Pinia
- **Backend**: Node.js + TypeScript + WebSocket (ws library)
- **Desktop**: Electron
- **Goal**: Working IM demo for IM engineer position interviews (14-day timeline)

## Features Implemented

✅ User registration and login (basic auth with in-memory storage)
✅ One-on-one chat
✅ Group chat
✅ Message status tracking (sent/delivered/read)
✅ Typing indicators
✅ Image upload from local machine (base64 encoding, no memory feature)
✅ Real-time online status
✅ Local message storage (Pinia stores)

## Project Structure

```
IM-message-day/
├── server/                    # WebSocket server (Node.js + ws)
│   ├── src/
│   │   ├── index.ts          # Main server with WebSocket handlers
│   │   ├── types.ts          # TypeScript type definitions
│   │   └── store.ts          # In-memory data store
│   ├── package.json
│   └── tsconfig.json
│
├── client/                    # Vue 3 + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginPage.vue          # Login/Register UI
│   │   │   ├── ConversationList.vue   # Chat list sidebar
│   │   │   └── MessageList.vue        # Messages + input
│   │   ├── composables/
│   │   │   └── useChatSocket.ts       # WebSocket composable
│   │   ├── stores/
│   │   │   ├── auth.ts                # Authentication state
│   │   │   └── chat.ts                # Chat messages & conversations
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── App.vue           # Main app component
│   │   ├── main.ts           # App entry point
│   │   └── style.css         # Tailwind CSS imports
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── tsconfig.json
│
└── electron/                  # Electron desktop wrapper
    ├── src/
    │   ├── main.ts           # Electron main process
    │   └── preload.ts        # Preload script
    ├── package.json
    └── tsconfig.json
```

## Development Commands

### Installation
```bash
# Install dependencies for each package
cd server && npm install
cd ../client && npm install
cd ../electron && npm install
```

### Running the Application

**Web Development Mode (Recommended for testing):**
```bash
# Terminal 1: Start WebSocket server
cd server
npm run dev              # Runs on ws://localhost:8080

# Terminal 2: Start Vue frontend
cd client
npm run dev              # Runs on http://localhost:3000
```

**Desktop Mode (Electron):**
```bash
# Ensure server and client are running first
# Terminal 3: Start Electron
cd electron
npm run dev
```

### Building for Production
```bash
# Build client
cd client
npm run build

# Build server
cd server
npm run build

# Build electron
cd electron
npm run build
```

## Architecture & Key Concepts

### WebSocket Communication (server/src/index.ts)

The server handles all real-time communication via WebSocket messages with the following types:
- `register` - Create new user account
- `auth` - Login with username/password
- `message` - Send text/image message (DM or group)
- `typing` - Broadcast typing status
- `read` - Mark message as read
- `create_group` - Create group chat
- `get_users` - Fetch all users and online status
- `get_groups` - Fetch user's groups

**Important**: All data is stored in memory (`store.ts`). Server restart = data loss.

### State Management (client/src/stores/)

**auth.ts**: Manages user authentication state
- `userId`, `username`, `isAuthenticated`
- `setUser()`, `clearUser()`

**chat.ts**: Manages all chat-related state
- `users[]`, `groups[]`, `messages[]`, `typingStatuses[]`
- Computed: `conversations` (combines DMs + groups), `currentMessages`, `currentTypingUsers`
- Methods for adding messages, updating status, handling typing indicators

### WebSocket Composable (client/src/composables/useChatSocket.ts)

Central WebSocket client that:
- Manages connection lifecycle (connect, disconnect, auto-reconnect)
- Sends messages: `login()`, `sendMessage()`, `sendTyping()`, `createGroup()`, etc.
- Handles incoming messages and updates Pinia stores
- Auto-reconnects after 3 seconds on disconnect

### Message Flow

1. **Sending**: User types → `MessageList.vue` → `useChatSocket.sendMessage()` → WebSocket → Server
2. **Receiving**: Server → WebSocket → `useChatSocket.handleMessage()` → Pinia store → Vue reactivity updates UI
3. **Status Updates**:
   - `sent` - Confirmed by server
   - `delivered` - Recipient is online and received
   - `read` - Recipient marked as read

### Image Upload

Images are converted to base64 in `MessageList.vue:handleImageSelect()` using FileReader API, then sent as message type `image`. No server-side storage - images live in message content as base64 strings.

### Typing Indicators

- Triggered on input in `MessageList.vue:handleTyping()`
- Sends `typing: true` immediately
- Auto-sends `typing: false` after 2 seconds of no input
- Displayed as animated dots in `MessageList.vue`

## Common Development Tasks

### Adding a New Message Type

1. Add type to `server/src/types.ts` (WSMessage interface)
2. Add handler in `server/src/index.ts:handleMessage()`
3. Add send method in `client/src/composables/useChatSocket.ts`
4. Add response handler in `useChatSocket.ts:handleMessage()`

### Modifying UI Components

All components use Tailwind CSS. Key classes:
- Message bubbles: `bg-blue-600` (sent), `bg-white border` (received)
- Status indicators: `text-green-600` (online), `text-gray-500` (offline)
- Animations: `animate-bounce` (typing dots)

### Testing Multiple Users

1. Open multiple browser tabs/windows
2. Register different usernames in each
3. Users will appear in each other's conversation lists
4. Test DM by clicking username, test group by creating group

## Important Notes

- **WebSocket URL**: Hardcoded as `ws://localhost:8080` in `useChatSocket.ts`
- **Dev Server Port**: Vite runs on `http://localhost:3000` (configured in `vite.config.ts`)
- **No Persistence**: All data (users, messages, groups) stored in memory only
- **Image Size**: No validation on image size - large images may cause performance issues
- **Security**: Basic auth with plaintext passwords - suitable for demo only
- **Auto-scroll**: Messages auto-scroll to bottom on new message (watch in `MessageList.vue`)

## Future Enhancements (Not Yet Implemented)

- [ ] IndexedDB persistence for messages
- [ ] Message search functionality
- [ ] File transfer (non-image files)
- [ ] Voice/video calls
- [ ] End-to-end encryption
- [ ] Push notifications
- [ ] Emoji picker
- [ ] Message reply/quote
- [ ] User profiles/avatars
- [ ] Dark mode
