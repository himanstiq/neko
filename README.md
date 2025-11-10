# Neko - WebRTC Video Conferencing App

A full-stack multi-party audio/video conferencing application built with the MERN stack and WebRTC for peer-to-peer media streaming.

## 🚀 Features

### Core Functionality

- ✅ **Multi-party video conferencing** - Support for up to 10 participants per room
- ✅ **WebRTC P2P mesh** - Direct peer-to-peer connections for optimal performance
- ✅ **Real-time signaling** - WebSocket-based signaling server for session orchestration
- ✅ **Screen sharing** - Share your screen with other participants
- ✅ **In-room chat** - Text messaging with typing indicators
- ✅ **Active speaker detection** - Visual highlighting of who's speaking
- ✅ **Device selection** - Choose microphone, camera, and speakers
- ✅ **Quality control** - Adjustable video quality (360p, 480p, 720p)

### Advanced Features

- 🔄 **ICE restart** - Automatic connection recovery on network issues
- 📊 **Network quality monitoring** - Real-time connection statistics
- 🎯 **Adaptive bitrate** - Automatic quality adjustment based on network conditions
- 🔐 **JWT authentication** - Secure user authentication and room access
- 💾 **Session persistence** - MongoDB storage for rooms and participant history
- 🛡️ **Error boundaries** - Graceful error handling throughout the app
- ⚡ **Auto-reconnect** - Exponential backoff for WebSocket reconnection

## 🏗️ Architecture

### Frontend (React 19 + Vite)

```
client/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── AudioLevelIndicator.jsx
│   │   ├── Chat.jsx
│   │   ├── ConnectionStatus.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── NetworkQualityIndicator.jsx
│   │   ├── QualitySelector.jsx
│   │   └── Layout/
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.jsx
│   │   └── SignalingContext.jsx
│   ├── hooks/           # Custom React hooks
│   │   └── useActiveSpeaker.js
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Room.jsx
│   │   └── ...
│   ├── services/        # Business logic & WebRTC
│   │   ├── PeerConnection.js          # WebRTC peer wrapper
│   │   ├── peerConnectionManager.js   # Manages all peers
│   │   ├── mediaService.js            # Media device handling
│   │   ├── websocket.js               # WebSocket client
│   │   ├── audioMonitor.js            # Audio level detection
│   │   └── networkQualityMonitor.js   # Network stats monitoring
│   └── config/
│       └── webrtc.js    # STUN/TURN configuration
```

### Backend (Node.js + Express + MongoDB)

```
server/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth & validation
│   ├── models/         # Mongoose schemas
│   │   ├── Room.js
│   │   └── User.js
│   ├── routes/         # API routes
│   ├── websocket/      # WebSocket signaling
│   │   ├── server.js           # WebSocket server
│   │   └── messageHandler.js   # Message routing
│   └── utils/          # Helpers
```

## 📋 Prerequisites

- **Node.js** v18+
- **MongoDB** v6+
- **npm** or **yarn**

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd neko
```

### 2. Server Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/neko
# JWT_SECRET=your-secret-key-here
# NODE_ENV=development

# Start server
npm run dev
```

### 3. Client Setup

```bash
cd client
npm install

# Create .env file
cp .env.example .env

# Edit .env:
# VITE_API_URL=http://localhost:5000
# VITE_WS_URL=ws://localhost:5000/ws

# Start client
npm run dev
```

### 4. MongoDB Setup

```bash
# Start MongoDB (if not already running)
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 🌐 STUN/TURN Server Configuration

### Using Public STUN Servers (Default)

The app is pre-configured with Google's public STUN servers in `client/src/config/webrtc.js`:

```javascript
export const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun1.l.google.com:19302" },
];
```

### Setting up TURN Server (coturn) for NAT Traversal

For production or restrictive networks, set up a TURN server:

#### Install coturn (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install coturn
```

#### Configure coturn

Edit `/etc/turnserver.conf`:

```conf
listening-port=3478
fingerprint
lt-cred-mech
user=username:password
realm=yourdomain.com
```

#### Start coturn

```bash
sudo systemctl start coturn
sudo systemctl enable coturn
```

#### Update WebRTC config

```javascript
export const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:yourdomain.com:3478",
      username: "username",
      credential: "password",
    },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};
```

## 🎮 Usage

1. **Register/Login** at `http://localhost:5173`
2. **Create a room** from the dashboard
3. **Share the room ID** with participants
4. **Join the room** and start conferencing!

### Controls

- 🎤 **Mute/Unmute** - Toggle microphone
- 📹 **Video On/Off** - Toggle camera
- 🖥️ **Share Screen** - Share your screen
- 💬 **Chat** - Send text messages
- ⚙️ **Settings** - Change devices and quality
- 🚪 **Leave Room** - Exit the conference

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Room Access Tokens** - Unique tokens for room access
- **CORS Protection** - Configured CORS for API security
- **WebSocket Origin Checks** - Validate WebSocket connections
- **Input Validation** - Sanitize and validate all inputs

## 📊 Network Quality Monitoring

The app automatically monitors:

- **RTT (Round Trip Time)** - Network latency
- **Jitter** - Packet delay variation
- **Packet Loss** - Lost packets count
- **Bitrate** - Current transmission rate

Quality levels:

- 🟢 **Excellent** - RTT < 100ms, No jitter/loss
- 🟡 **Good** - RTT < 200ms, Low jitter
- 🟠 **Fair** - RTT < 300ms, Some packet loss
- 🔴 **Poor** - RTT > 300ms, High packet loss

## 🐛 Troubleshooting

### Camera/Microphone not working

- Check browser permissions
- Ensure HTTPS (or localhost for testing)
- Try different browsers

### Connection issues

- Check STUN/TURN configuration
- Verify firewall settings
- Check network connectivity

### Audio echo

- Use headphones
- Enable echo cancellation in settings

### Screen share not working

- Chrome/Edge: Should work by default
- Firefox: Enable in about:config
- Safari: Requires macOS 13+

## 🚀 Production Deployment

### Environment Variables

```bash
# Server
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-random-secret>

# Client
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com/ws
```

### Build

```bash
# Client
cd client
npm run build

# Serve static files with nginx or similar
```

### SSL Certificate

WebRTC requires HTTPS in production. Use Let's Encrypt:

```bash
sudo certbot --nginx -d yourdomain.com
```

## 🛠️ Tech Stack

### Frontend

- **React 19.1** - UI framework
- **Tailwind CSS 4.1** - Styling
- **Vite 7.1** - Build tool
- **React Router 7.9** - Routing

### Backend

- **Node.js** - Runtime
- **Express 5.1** - Web framework
- **WebSocket (ws 8.18)** - Real-time communication
- **MongoDB 8.19** - Database
- **JWT** - Authentication

### WebRTC

- **getUserMedia** - Media capture
- **RTCPeerConnection** - P2P connections
- **getDisplayMedia** - Screen sharing
- **getStats()** - Connection statistics

## 📝 API Endpoints

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Rooms

- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/:roomId` - Get room details

### WebSocket Events

- `join-room` - Join a conference room
- `leave-room` - Leave room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Exchange ICE candidates
- `chat-message` - Send chat message
- `typing` - Typing indicator

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- WebRTC documentation and community
- Google's STUN servers
- MongoDB and Mongoose teams
- React and Vite communities

## 📞 Support

For issues or questions:

- Open an issue on GitHub
- Check existing documentation
- Review WebRTC documentation

---

Built with ❤️ using React, Node.js, and WebRTC
"# neko" 
