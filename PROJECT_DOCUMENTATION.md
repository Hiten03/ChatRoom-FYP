# PROJECT DOCUMENTATION: ChatRoom — Connect & Collaborate

## 🏠 1. Project Overview
**ChatRoom** is a real-time, audio-first social platform designed for seamless collaboration and community engagement. Built as a full-stack web application, it allows users to create and join various types of voice rooms, interact through real-time audio, text chat, and dynamic emoji reactions. The platform emphasizes security and social connection with a mutual-follow "Social Room" system and password-protected "Private Rooms."

### Problem it Solves
ChatRoom addresses the need for low-latency, high-quality audio communication without the overhead of complex conferencing tools. It provides a lightweight, browser-based alternative for informal meetups, professional collaboration, and interest-based community discussions, featuring roles and moderation tools to maintain order in larger gatherings.

### Target Audience
- **Communities & Clubs**: For hosting live discussions and Q&A sessions.
- **Remote Teams**: For quick audio check-ins and coworking sessions.
- **Creators & Experts**: For hosting small-scale podcasts or audio events.
- **Social Groups**: For casual group voice chats with friends.

### Current Status
The project is fully functional and ready for deployment.
- **Frontend**: Designed to be deployed on platforms like Vercel.
- **Backend**: Designed for platforms like Render or Heroku.
- **Database**: Uses MongoDB Atlas for cloud-based data persistence.

### Tech Stack Summary
- **Frontend**: React (v18), Redux Toolkit, React Router DOM v6, Axios.
- **Backend**: Node.js, Express (v5).
- **Database**: MongoDB with Mongoose ODM.
- **Real-time Communication**: Socket.io for signaling and state; WebRTC for peer-to-peer audio.
- **Authentication**: Phone-based OTP (Twilio) with JWT Access/Refresh tokens.
- **Styling**: Vanilla CSS with CSS Modules and Theme Context (Light/Dark mode).
- **Storage**: Local server storage for avatars (extensible to Cloudinary/S3).

---

## ✨ 2. Complete Features List

| Feature | Description |
|:--- |:--- |
| **OTP Auth** | Secure login using phone numbers and 4-digit OTPs sent via Twilio. |
| **Voice Rooms** | Three distinct types: Open (Public), Social (Mutual Follows Only), and Private (Password Protected). |
| **Roles & Moderation** | Moderator (Creator), Speaker, and Listener roles. Moderators can promote/demote or set member limits. |
| **Real-time Audio** | High-quality audio streaming using WebRTC mesh architecture. |
| **Room Member Limit** | Dynamic cap on room capacity (2-100 members) manageable by the moderator. |
| **Room Timer** | Live countdown/duration display showing how long a room has been active. |
| **Text Chat** | In-room real-time messaging with 300-character limit and auto-scrolling history. |
| **Emoji Reactions** | Floating emoji animations (👏, ❤️, 😂, etc.) that appear over the UI for all participants. |
| **Hand Raise System** | Users can "Raise Hand" to signal they want to speak; Moderators get real-time toast notifications. |
| **Follow System** | Robust relationship system with Follow/Unfollow, mutual follow tracking, and follower/following lists. |
| **User Profiles** | Detailed profiles with Bio, Social Media links (Twitter, Instagram, LinkedIn), and real-time stats. |
| **Avatar Customization** | Integrated image uploader with a professional cropping tool (`react-easy-crop`). |
| **Theme Toggle** | Seamless switching between premium Light and Dark modes. |
| **Notification Center** | In-app bell notifications for new rooms from followed users and new followers. |
| **Room Management** | Moderators can delete rooms; rooms automatically clean up state (messages/hands) when empty. |
| **Adaptive Layout** | Responsive dock and UI that adapts between PC (inline) and Mobile (toggle) experiences. |

---

## 🗂 3. Project Structure

### Frontend (`frontend/src/`)
- **`components/`**: Modular UI elements.
  - `AddRoomModal/`: Logic for creating new rooms with type and limit selection.
  - `RoomCard/`: Dashboard preview of active rooms with topic and speaker avatars.
  - `ProfileModal/`: Full profile view with edit mode, following lists, and avatar cropper.
  - `RoomTimer/`: Logic for tracking and formatting room duration.
- **`pages/`**: Primary route views.
  - `Home/`: Animated landing page for guest users.
  - `Authenticate/`: Multi-step login flow (Phone input -> OTP Verification).
  - `Activate/`: Onboarding step for name and avatar setup for new users.
  - `Rooms/`: Dashboard listing all accessible rooms with search and filtering.
  - `Room/`: The core voice-room experience with audio tracks, chat, and action dock.
- **`context/`**: `ThemeContext.js` manages global light/dark mode state.
- **`hooks/`**: Custom logic.
  - `useWebRTC.js`: Complex hook managing Socket.io signaling, mesh connections, and room state.
  - `useLoadingWithRefresh.js`: Handles session persistence on page reload.
  - `useStateWithCallback.js`: Utility for state updates with callback support.
- **`http/`**: `index.js` contains the Axios instance and all API endpoint definitions.
- **`store/`**: Redux Toolkit slices (`authSlice.js`, `activateSlice.js`) for global state.

### Backend (`backend/`)
- **`models/`**: MongoDB schemas.
  - `user-model.js`: Users with phone, profile details, and virtual follower counts.
  - `room-model.js`: Room metadata including topic, type, password, and member limits.
  - `follow-model.js`: Relationship mapping between follower and following IDs.
  - `refresh-model.js`: Storage for JWT refresh tokens.
- **`controllers/`**: Business logic.
  - `auth-controller.js`: OTP sending/verification and JWT token management.
  - `rooms-controller.js`: Room CRUD operations and access control.
  - `follow-controller.js`: Follow/Unfollow logic and relationship status.
- **`services/`**: Low-level helpers for OTP, hashing, token logic, and DB queries.
- **`middlewares/`**: `auth-middleware.js` protects private routes by verifying JWTs.
- **`server.js`**: Main entry point; initializes Express, DB connection, and Socket.io handlers.

---

## 🔄 4. Application Flow

### 1. New User Onboarding
1. **Landing**: User arrives at `Home` and clicks "Let's Go".
2. **Phone**: Enters phone number. Backend sends OTP via Twilio and returns a hashed payload.
3. **Verify**: User enters OTP. Backend verifies hash against input and creates a User record if new.
4. **Profile**: User is forced to `Activate` page to enter Name and upload an Avatar.
5. **Success**: User is redirected to the `Rooms` dashboard.

### 2. Room Creation & Joining
1. **Create**: User clicks "Start a room", chooses topic, type (Open/Social/Private), and optional limit.
2. **Persistence**: Backend saves room to DB; creator joins via Socket.io as **Moderator/Speaker**.
3. **Join**: Another user clicks a `RoomCard`.
4. **Validation**: Backend checks:
   - **Private**: Must provide correct password.
   - **Social**: Must be a mutual follower of the host.
   - **Full**: Must not exceed the `maxMembers` limit.
5. **RTC Setup**: Joining signals the `useWebRTC` hook to start signaling for audio exchange.

### 3. Real-Time Audio (WebRTC Mesh)
1. **Capture**: Client captures local microphone stream.
2. **Signaling**: Socket.io exchanges "offers", "answers", and "ICE candidates" between peers.
3. **Connection**: Each user establishes a direct peer-to-peer connection with every other user in the room.
4. **Stream**: Audio tracks are added to the connection and rendered via fixed `<audio>` elements.

---

## 🗄 5. Database Schema

### `User` Collection (users)
| Field | Type | Description |
|:--- |:--- |:--- |
| `phone` | String | Unique identifier (required) |
| `name` | String | Display name |
| `avatar` | String | Path to image (stores full URL via getter) |
| `activated` | Boolean | Registration completion flag |
| `bio` | String | Profile biography (max 160 chars) |
| `socials` | Object | Nested fields: `twitter`, `instagram`, `linkedin` |

### `Room` Collection (rooms)
| Field | Type | Description |
|:--- |:--- |:--- |
| `topic` | String | Room name/topic (required) |
| `roomType` | String | 'open', 'social', or 'private' |
| `password` | String | For private rooms only (default null) |
| `ownerId` | ObjectId | Reference to the creator (User) |
| `maxMembers` | Number | Capacity limit (2-100, default null/unlimited) |

---

## 🔌 6. API Endpoints Reference

### Auth Routes
| Method | Endpoint | Auth | Description |
|:--- |:--- |:--- |:--- |
| POST | `/api/send-otp` | No | Sends OTP via SMS to phone number |
| POST | `/api/verify-otp` | No | Verifies OTP and returns user + JWT cookies |
| GET | `/api/refresh` | No | Uses refresh cookie to generate new access token |
| POST | `/api/logout` | Yes | Clears tokens from DB and cookies |
| POST | `/api/activate` | Yes | Sets initial name and avatar for new user |

### Room Routes
| Method | Endpoint | Auth | Description |
|:--- |:--- |:--- |:--- |
| POST | `/api/rooms` | Yes | Creates a new room with topic/type/limit |
| GET | `/api/rooms` | Yes | Lists all rooms accessible to the user |
| GET | `/api/rooms/:id` | Yes | Fetches specific room details |
| DELETE | `/api/rooms/:id` | Yes | Deletes a room (Owner only) |
| POST | `/api/rooms/:id/verify` | Yes | Verifies password for private rooms |

### User & Follow Routes
| Method | Endpoint | Auth | Description |
|:--- |:--- |:--- |:--- |
| PUT | `/api/user/profile` | Yes | Updates name, bio, and social links |
| POST | `/api/user/avatar` | Yes | Updates user avatar (base64 string) |
| GET | `/api/user/:id/profile`| No | Fetches public profile stats and details |
| POST | `/api/follow/:id` | Yes | Follows a target user |
| DELETE | `/api/follow/:id` | Yes | Unfollows a target user |
| GET | `/api/follow/mutual` | Yes | Fetches list of mutual followers |

---

## ⚡ 7. Socket.io Events Reference

| Event Name | Direction | Payload | Description |
|:--- |:--- |:--- |:--- |
| `join` | C -> S | `{roomId, user}` | Joins a room and starts peer discovery |
| `add-peer` | S -> C | `{peerId, createOffer, remoteUser}` | Signals a new client has joined for RTC |
| `relay-ice` | Both | `{peerId, icecandidate}` | Relays ICE candidates for NAT traversal |
| `relay-sdp` | Both | `{peerId, sessionDescription}` | Relays SDP offers/answers |
| `mute` / `un-mute` | Both | `{roomId, userId}` | Broadcasts mic status changes |
| `set-role` | C -> S | `{targetUserId, role}` | Changes user role (Moderator only) |
| `reaction` | Both | `{emoji, userName}` | Broadcasts floating emoji animations |
| `room-message` | Both | `{messageObj}` | Broadcasts real-time text chat |
| `raise-hand` | Both | `{raisedHands, justRaisedBy}` | Syncs Raised Hand state and notifies |

---

## 📦 8. Dependencies

### Frontend Dependencies
| Package | Version | Purpose |
|:--- |:--- |:--- |
| `react` | 18.3.1 | UI Library |
| `@reduxjs/toolkit` | 2.9.2 | Global State Management |
| `socket.io-client` | 4.8.3 | Real-time signaling |
| `axios` | 1.12.2 | HTTP Client for API calls |
| `react-easy-crop` | 5.5.6 | Professional image cropping |
| `react-hot-toast` | 2.6.0 | Modern UI notifications |
| `freeice` | 2.2.2 | STUN/TURN server list provider |

### Backend Dependencies
| Package | Version | Purpose |
|:--- |:--- |:--- |
| `express` | 5.1.0 | Web Framework |
| `mongoose` | 8.23.0 | MongoDB ODM |
| `socket.io` | 4.8.3 | Real-time server logic |
| `jsonwebtoken` | (via script)| JWT Authentication |
| `twilio` | 5.10.3 | SMS OTP Infrastructure |
| `jimp` | 1.6.0 | Server-side image processing |
| `cookie-parser` | 1.4.7 | JWT cookie handling |

---

## 🧩 9. Key Components Guide

### `Room` Page (`Room.jsx`)
- **Purpose**: The main interactive hub for voice rooms.
- **State**: Manages chat visibility, emoji panel toggles, and participant menu states.
- **Logic**: Consumes `useWebRTC` to handle all signaling and audio track management.
- **Interactions**: Handles Hand Raising logic and Moderator actions (Demote/Promote/Set Limit).

### `ProfileModal` (`ProfileModal.jsx`)
- **Purpose**: Multi-functional modal for profile viewing and editing.
- **Features**: integrated `react-easy-crop` for avatar updates, bio/social editing, and followers/following list views with "Follow Back" buttons.
- **Optimistic UI**: Updates follower counts instantly via `window.dispatchEvent` on follow actions.

### `Navigation` (`Navigation.jsx`)
- **Purpose**: Global app bar with search, notifications, and profile access.
- **Real-time**: Listens for the `FOLLOWED` and `room-started` socket events to fire global toasts and update the notification bell.

---

## 🏗 10. Deployment Guide

### Frontend (Vercel)
1. Link your GitHub repository to Vercel.
2. Set the **Build Command**: `npm run build`.
3. Set the **Output Directory**: `build`.
4. Add **Environment Variable**: `REACT_APP_API_URL` (your backend URL).

### Backend (Render / Heroku)
1. Create a new Web Service and link the repo.
2. Set the **Root Directory** to `backend`.
3. Set the **Start Command**: `npm start`.
4. Add all Backend Environment Variables (Section 9) from your `.env`.

### Database (MongoDB Atlas)
1. Whitelist `0.0.0.0/0` (or specific IPs from Render/Vercel).
2. Create a Database User.
3. Use the `SRV` connection string in your backend's `DB_URL` variable.

---

## 🔐 11. Authentication Flow (Deep Dive)
ChatRoom uses a dual-token (Access + Refresh) JWT strategy for maximum security.
1. **Access Token**: Valid for 1 hour; sent with every request as a protected cookie.
2. **Refresh Token**: Valid for 1 year; stored in MongoDB and used to regenerate Access Tokens if they expire, allowing users to stay logged in without re-authenticating with OTP.
3. **Middleware**: Every private API call passes through `auth-middleware.js`, which verifies the JWT signature and attaches the user object to the request.

---

## 🛠 8. Setup & Installation

### Prerequisites
- **Node.js**: v16+ recommended
- **MongoDB**: Atlas Cluster or local instance
- **Twilio**: Account SID, Auth Token, and a valid From number for SMS.

### Steps
1. **Clone the Repo**: `git clone <repo-url>`
2. **Install Backend Dependencies**: 
   ```bash
   cd backend && npm install
   ```
3. **Install Frontend Dependencies**:
   ```bash
   cd frontend && npm install
   ```
4. **Configure Environment Variables**: Create `.env` files (see section 9).
5. **Start Backend**: `npm run dev` (runs on port 5500)
6. **Start Frontend**: `npm start` (runs on port 3000)

---

## 🌐 9. Environment Variables

### Backend `.env`
| Variable | Description | Example |
|:--- |:--- |:--- |
| `HASH_SECRET` | Secret for hashing OTPs | `your_hash_secret` |
| `SMS_SID` | Twilio Account SID | `AC...` |
| `SMS_AUTH_TOKEN`| Twilio Auth Token | `...` |
| `SMS_FROM_NUMBER`| Twilio Phone Number | `+1...` |
| `DB_URL` | MongoDB Connection String | `mongodb+srv://...` |
| `JWT_ACCESS_TOKEN_SECRET` | Secret for Access Token | `access_secret` |
| `JWT_REFRESH_TOKEN_SECRET`| Secret for Refresh Token| `refresh_secret` |
| `BASE_URL` | URL of the backend | `http://localhost:5500` |
| `FRONTEND_URL` | URL of the frontend | `http://localhost:3000` |

### Frontend `.env`
| Variable | Description | Example |
|:--- |:--- |:--- |
| `REACT_APP_API_URL` | URL of the backend API | `http://localhost:5500` |

---

## 🔐 10. Security & Scalability
- **Security**: JWT tokens are stored in `httpOnly` cookies to prevent XSS. Routes are protected by an `auth-middleware` that verifies these tokens. Private rooms use server-side password validation.
- **Scalability**: The current WebRTC implementation uses a **Mesh Network**. While perfect for small groups (4-8 people), it may experience performance degradation with more concurrent audio streams. For 100+ members, migrating to an **SFU (Selective Forwarding Unit)** like Mediasoup or LiveKit is recommended.

---

## 🗺 11. Known Issues & Future Roadmap
- **Mesh Limits**: WebRTC performance slows down as room size increases beyond 10-15 active speakers.
- **In-Memory Chat**: Room messages are currently stored in server memory and cleared when the last person leaves. Permanent database storage for chat is a planned feature.
- **Planned Features**: Room recording, Direct Messaging, and Screen Sharing.

---

### 👥 Credits
**Project Developed by**: Hiten & Team  
**Institution**: Final Year Project (2026)
