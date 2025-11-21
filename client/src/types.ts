export interface User {
  id: string;
  username: string;
  zodiac: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  type: "text" | "image" | "emoji";
  timestamp: number;
  status: "sent" | "delivered" | "read";
}

export interface Conversation {
  userId: string;
  username: string;
  zodiac: string;
  isOnline: boolean;
  lastMessage?: Message;
  unreadCount: number;
}

export interface WSMessage {
  type:
    | "auth"
    | "register"
    | "message"
    | "typing"
    | "read"
    | "get_users"
    | "user_status";
  userId?: string;
  username?: string;
  zodiac?: string;
  toUserId?: string;
  content?: string;
  messageType?: "text" | "image" | "emoji";
  typing?: boolean;
  messageId?: string;
  users?: User[];
  messages?: Message[];
  success?: boolean;
  error?: string;

  payload: any;
}

export const ZODIACS = [
  { name: "鼠", emoji: "🐭", id: "rat" },
  { name: "牛", emoji: "🐮", id: "ox" },
  { name: "虎", emoji: "🐯", id: "tiger" },
  { name: "兔", emoji: "🐰", id: "rabbit" },
  { name: "龍", emoji: "🐲", id: "dragon" },
  { name: "蛇", emoji: "🐍", id: "snake" },
  { name: "馬", emoji: "🐴", id: "horse" },
  { name: "羊", emoji: "🐑", id: "goat" },
  { name: "猴", emoji: "🐵", id: "monkey" },
  { name: "雞", emoji: "🐔", id: "rooster" },
  { name: "狗", emoji: "🐶", id: "dog" },
  { name: "豬", emoji: "🐷", id: "pig" },
];

export const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "😭",
  "😱",
  "🔥",
  "💯",
  "👍",
  "❤️",
  "🎉",
  "✨",
  "💪",
  "🙏",
];
