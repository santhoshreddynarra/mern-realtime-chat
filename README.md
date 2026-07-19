# MERN Real-Time Chat

A full-stack, real-time messaging application built with the MERN stack and Socket.IO, featuring a responsive WhatsApp-style interface.

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-blue)
![React](https://img.shields.io/badge/react-19-blue)

---

## Features

- **Authentication** — JWT-based login and registration with secure HTTP-only cookies
- **JWT-Authenticated Sockets** — Every Socket.IO connection is verified server-side via the JWT cookie; no client-supplied identity is trusted
- **Real-time messaging** — Instant message delivery using Socket.IO WebSockets
- **Message status** — Sent → Delivered → Read receipt tracking with visual indicators
- **Typing indicators** — Live "typing..." status in the chat header
- **Reply to messages** — Quote and reply to any message inline
- **Scheduled messages** — Schedule a message to be sent at a future date/time
- **Online / Last Seen** — Real-time online presence and last-seen timestamps
- **Contact search** — Discover any registered user by name, username, email, or phone
- **Sidebar search** — Filter existing conversations by name or username
- **Unread message badges** — Per-conversation unread count updated in real-time
- **Clear / Delete chat** — Clear your message history or permanently delete a conversation
- **Export chat** — Download a `.txt` transcript of any conversation
- **Contact info panel** — View profile details of the other user inside an active chat
- **Dark / Light mode** — System-preference detection with manual toggle; persisted to `localStorage`
- **Responsive layout** — Mobile-first design that works on phones, tablets, and desktops
- **Polished empty & loading states** — Animated Lucide icons for all empty states and loading feedback

---

## Tech Stack

**Frontend**
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | 4 | Utility-first styling |
| Zustand | 5 | Global state management |
| Socket.IO Client | 4 | Real-time communication |
| Axios | 1 | HTTP requests |
| React Hot Toast | 2 | Toast notifications |
| Lucide React | 1 | Icon library |
| React Router DOM | 7 | Client-side routing |

**Backend**
| Technology | Version | Purpose |
|---|---|---|
| Node.js | ≥18 | Runtime |
| Express | 5 | Web framework |
| MongoDB + Mongoose | 9 | Database & ODM |
| Socket.IO | 4 | WebSocket server |
| JSON Web Token | 9 | Authentication |
| bcryptjs | 3 | Password hashing |
| cookie-parser | 1 | Cookie parsing |
| node-cron | 4 | Scheduled message delivery |
| dotenv | 17 | Environment variables |

---

## Project Structure

```
chatApp/
├── backend/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── cloudinary.js          # Cloudinary config (reserved)
│   ├── controllers/
│   │   ├── authController.js      # Register / Login / Logout
│   │   ├── messageController.js   # Send / Get / Mark read messages
│   │   ├── conversationController.js
│   │   └── userController.js      # Sidebar, search, profile update
│   ├── cron/
│   │   └── scheduleWorker.js      # Delivers scheduled messages
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT protect middleware (REST)
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── userModel.js
│   │   ├── messageModel.js
│   │   └── conversationModel.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── conversationRoutes.js
│   │   └── userRoutes.js
│   ├── socket/
│   │   └── socket.js              # JWT-authenticated Socket.IO server
│   ├── utils/
│   │   └── generateToken.js
│   ├── server.js
│   └── .env
│
└── frontend/
    └── src/
        ├── api/
        │   └── axiosInstance.js   # Axios with base URL from env
        ├── components/
        │   ├── ErrorBoundary.jsx
        │   ├── MessageContainer.jsx
        │   ├── NewChatSidebar.jsx
        │   ├── ProfileSidebar.jsx
        │   ├── SettingsSidebar.jsx
        │   ├── Sidebar.jsx
        │   └── Spinner.jsx
        ├── hooks/
        │   ├── useListenMessages.js
        │   └── useTyping.js
        ├── layouts/
        │   └── MainLayout.jsx
        ├── pages/
        │   ├── Chat.jsx
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   └── Signup.jsx
        ├── store/
        │   ├── useAuthStore.js
        │   ├── useConversationStore.js
        │   └── useSocketStore.js
        └── index.css
```

---

## Installation & Setup

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- A MongoDB Atlas cluster (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/santhoshreddynarra/mern-realtime-chat.git
cd mern-realtime-chat
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure environment variables

**`backend/.env`**
```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_strong_random_secret_key

# Comma-separated list of allowed frontend origins
CLIENT_URL=http://localhost:5173,http://localhost:5174
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Run in development

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:5174` (Vite auto-selects port)

---

## Environment Variables Reference

### Backend

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `5000`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `CLIENT_URL` | Yes | Comma-separated list of allowed frontend origins |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Backend API base URL (default: `/api` for same-origin) |
| `VITE_SOCKET_URL` | No | Socket.IO server URL (default: `/` for same-origin) |

> **Tip**: In production, when the frontend and backend are served from the same domain (e.g., deployed as a monorepo on Render), you can omit `VITE_API_URL` and `VITE_SOCKET_URL` — they default to the same origin automatically.

---

## Screenshots

> _Screenshots will be added after the first production deployment._

| Login | Chat | Dark Mode |
|---|---|---|
| _(coming soon)_ | _(coming soon)_ | _(coming soon)_ |

---

## Deployment

### Render (Recommended — Full Stack)

1. Push your code to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Root Directory** to `/backend` and **Build Command** to `npm install`.
4. Set **Start Command** to `node server.js`.
5. Add all `backend/.env` variables in the Render dashboard.
6. For the frontend, create a separate **Static Site** with **Root Directory** `/frontend`, **Build Command** `npm run build`, and **Publish Directory** `dist`.
7. Set `VITE_API_URL` and `VITE_SOCKET_URL` in the frontend Static Site environment to your Render backend URL.
8. Set `CLIENT_URL` in the backend service to your Render frontend URL.

### Vercel + Railway

- **Frontend** → Vercel (static site from `frontend/`)
- **Backend** → Railway (Node.js service from `backend/`)
- Set all environment variables in their respective dashboards.

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login and set JWT cookie |
| POST | `/api/auth/logout` | ✅ | Logout and clear cookie |
| GET | `/api/users` | ✅ | Get conversations (sidebar) |
| GET | `/api/users/search?q=` | ✅ | Search users by name/email |
| PUT | `/api/users/profile` | ✅ | Update name and about |
| GET | `/api/messages/:id` | ✅ | Get messages with a user |
| POST | `/api/messages/send/:id` | ✅ | Send a message |
| PUT | `/api/messages/read/:id` | ✅ | Mark messages as read |
| PUT | `/api/conversations/:id/clear` | ✅ | Clear chat history |
| DELETE | `/api/conversations/:id` | ✅ | Delete conversation |

---

## Future Improvements

- [ ] Group chats
- [ ] Video calling (WebRTC)
- [ ] End-to-end encryption
- [ ] Push notifications (PWA)
- [ ] Message reactions / emoji
- [ ] Message deletion / editing
- [ ] User blocking
- [ ] Pagination for large message histories

---

## License

MIT © [Santhosh Reddy Narra](https://github.com/santhoshreddynarra)
