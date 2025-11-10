# Neko WebRTC - Quick Reference Guide

## 🚀 Quick Start (Under 5 Minutes)

### Prerequisites

```bash
node --version  # v18+
mongo --version # v6+
```

### Installation

```bash
# Terminal 1 - Server
cd server
npm install
cp .env.example .env
npm run dev

# Terminal 2 - Client
cd client
npm install
cp .env.example .env
npm run dev

# Terminal 3 - MongoDB (if not running)
mongod
# OR
docker run -d -p 27017:27017 mongo:latest
```

### Access

```
http://localhost:5173
```

---

## 🎮 User Actions

### Create a Room

1. Register/Login
2. Dashboard → "Create Room"
3. Enter room name
4. Click "Create"
5. Share room ID

### Join a Room

1. Login
2. Dashboard → "Join Room"
3. Enter room ID
4. Click "Join"
5. Allow camera/mic

### In-Room Controls

| Icon | Action        | Shortcut |
| ---- | ------------- | -------- |
| 🎤   | Mute/Unmute   | M        |
| 📹   | Camera On/Off | V        |
| 🖥️   | Screen Share  | S        |
| 💬   | Toggle Chat   | C        |
| ⚙️   | Settings      | -        |
| 🚪   | Leave Room    | L        |

---

## 🔧 Common Commands

### Development

```bash
# Start dev servers
cd server && npm run dev
cd client && npm run dev

# Build for production
cd client && npm run build

# Lint code
cd client && npm run lint
```

### Database

```bash
# Connect to MongoDB
mongosh

# Show databases
show dbs

# Use neko database
use neko

# Show collections
show collections

# Find all rooms
db.rooms.find()

# Find all users
db.users.find()
```

### Git

```bash
# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to origin
git push origin feature/my-feature

# Update from main
git fetch origin
git rebase origin/main
```

---

## 🐛 Troubleshooting

### Camera/Mic Not Working

```bash
# Check browser permissions
chrome://settings/content/camera
chrome://settings/content/microphone

# Check if media devices are available
navigator.mediaDevices.enumerateDevices()
  .then(devices => console.log(devices))
```

### WebSocket Not Connecting

```bash
# Check server is running
curl http://localhost:5000/api/health

# Check WebSocket endpoint
# In browser console:
new WebSocket('ws://localhost:5000/ws?token=YOUR_TOKEN')
```

### Peer Connection Failed

```javascript
// In browser console, check WebRTC internals
//webrtc-internals/

// Check ICE connection state
chrome: peerConnection.iceConnectionState;

// Check connection state
peerConnection.connectionState;
```

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Start MongoDB
sudo systemctl start mongodb

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/neko
```

---

## 📁 Key Files Reference

### Client Structure

```
client/src/
├── components/
│   ├── Chat.jsx                    # In-room chat
│   ├── ErrorBoundary.jsx           # Error handling
│   ├── NetworkQualityIndicator.jsx # Connection quality
│   ├── QualitySelector.jsx         # Settings panel
│   └── AudioLevelIndicator.jsx     # Voice activity
├── contexts/
│   ├── AuthContext.jsx             # User authentication
│   └── SignalingContext.jsx        # WebSocket signaling
├── pages/
│   ├── Room.jsx                    # Main conference room
│   ├── Dashboard.jsx               # Room management
│   └── Login.jsx                   # Authentication
├── services/
│   ├── PeerConnection.js           # WebRTC peer wrapper
│   ├── peerConnectionManager.js    # Peer orchestration
│   ├── mediaService.js             # Media devices
│   ├── websocket.js                # WebSocket client
│   ├── audioMonitor.js             # Audio analysis
│   └── networkQualityMonitor.js    # Quality monitoring
└── config/
    └── webrtc.js                   # STUN/TURN config
```

### Server Structure

```
server/src/
├── controllers/
│   ├── authController.js           # Auth endpoints
│   └── roomController.js           # Room endpoints
├── middleware/
│   └── auth.js                     # JWT verification
├── models/
│   ├── User.js                     # User schema
│   └── Room.js                     # Room schema
├── routes/
│   ├── auth.js                     # Auth routes
│   └── room.js                     # Room routes
├── websocket/
│   ├── server.js                   # WebSocket server
│   └── messageHandler.js           # Message routing
└── utils/
    ├── jwt.js                      # Token management
    └── logger.js                   # Logging utility
```

---

## 🔐 Environment Variables

### Server (.env)

```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neko
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173
```

### Client (.env)

```bash
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000/ws
```

---

## 📊 WebRTC Configuration

### STUN Servers (Default)

```javascript
{
  urls: "stun:stun.l.google.com:19302";
}
```

### TURN Server (Production)

```javascript
{
  urls: "turn:yourdomain.com:3478",
  username: "username",
  credential: "password"
}
```

### Media Constraints

```javascript
// High Quality
{
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
}
```

---

## 🧪 Testing WebRTC

### Check Media Devices

```javascript
navigator.mediaDevices.enumerateDevices().then((devices) => {
  devices.forEach((device) => {
    console.log(device.kind, device.label);
  });
});
```

### Test Camera

```javascript
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  const video = document.querySelector("video");
  video.srcObject = stream;
});
```

### Test Microphone

```javascript
navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  source.connect(analyser);
  // Analyze audio levels
});
```

### Check STUN Connectivity

```javascript
const pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});

pc.createOffer()
  .then((offer) => pc.setLocalDescription(offer))
  .then(() => {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE Candidate:", event.candidate);
      }
    };
  });
```

---

## 📞 API Endpoints

### Authentication

```bash
POST /api/auth/register
{
  "username": "user123",
  "email": "user@example.com",
  "password": "securePassword123"
}

POST /api/auth/login
{
  "username": "user123",
  "password": "securePassword123"
}
```

### Rooms

```bash
GET /api/rooms
# Returns list of active rooms

POST /api/rooms
{
  "name": "Team Meeting",
  "description": "Weekly sync",
  "isPublic": false,
  "maxParticipants": 6
}

GET /api/rooms/:roomId
# Returns room details
```

---

## 🔊 WebSocket Events

### Client → Server

| Event         | Payload                     | Description        |
| ------------- | --------------------------- | ------------------ |
| join-room     | { roomId, username }        | Join conference    |
| leave-room    | {}                          | Leave conference   |
| offer         | { targetUserId, offer }     | Send WebRTC offer  |
| answer        | { targetUserId, answer }    | Send WebRTC answer |
| ice-candidate | { targetUserId, candidate } | Send ICE candidate |
| chat-message  | { text }                    | Send chat message  |
| typing        | { isTyping }                | Typing indicator   |

### Server → Client

| Event         | Payload                         | Description            |
| ------------- | ------------------------------- | ---------------------- |
| room-joined   | { roomId, participants }        | Joined successfully    |
| user-joined   | { userId, username }            | New user joined        |
| user-left     | { userId, username }            | User left room         |
| offer         | { fromUserId, offer }           | Received offer         |
| answer        | { fromUserId, answer }          | Received answer        |
| ice-candidate | { fromUserId, candidate }       | Received ICE candidate |
| chat-message  | { fromUserId, text, timestamp } | Received message       |
| typing        | { userId, isTyping }            | Typing status          |
| error         | { message }                     | Error occurred         |

---

## 🎨 Tailwind v4 Classes

### Common Patterns

```jsx
// Flex layouts
<div className="flex items-center justify-between gap-4">

// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Responsive text
<h1 className="text-2xl md:text-4xl lg:text-6xl">

// Buttons
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">

// Cards
<div className="bg-white rounded-lg shadow-lg p-6">
```

---

## 🔍 Debug Commands

### Browser Console

```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// Check WebRTC stats
chrome://webrtc-internals/

// Check service worker
chrome://serviceworker-internals/

// Check media devices
navigator.mediaDevices.enumerateDevices()
```

### Server Logs

```bash
# View real-time logs
tail -f logs/app.log

# Search for errors
grep ERROR logs/app.log

# Filter by user
grep "userId:12345" logs/app.log
```

---

## 📚 Useful Resources

### Documentation

- [WebRTC Docs](https://webrtc.org/)
- [MDN WebRTC Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [React Docs](https://react.dev/)
- [Tailwind v4](https://tailwindcss.com/)

### Tools

- [WebRTC Samples](https://webrtc.github.io/samples/)
- [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)
- [MongoDB Compass](https://www.mongodb.com/products/compass)

### Community

- [WebRTC GitHub](https://github.com/webrtc)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/webrtc)
- [Reddit r/webrtc](https://reddit.com/r/webrtc)

---

## 💡 Pro Tips

1. **Always use HTTPS in production** - WebRTC requires secure contexts
2. **Implement TURN servers** - Essential for restrictive networks
3. **Monitor connection stats** - Proactively manage quality
4. **Test on real networks** - Not just localhost
5. **Handle all error cases** - Network failures are common
6. **Limit participants** - Mesh topology scales to ~10 users
7. **Use headphones** - Prevent audio echo
8. **Enable echo cancellation** - Built into getUserMedia
9. **Test browser compatibility** - Chrome, Firefox, Safari, Edge
10. **Implement analytics** - Track usage and issues

---

**Last Updated**: November 10, 2025
**Version**: 1.0.0
**Quick Help**: Check SETUP.md for detailed troubleshooting
