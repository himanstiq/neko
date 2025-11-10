# Neko WebRTC - System Architecture

## Overview

Neko is a full-stack WebRTC video conferencing application built using the MERN stack with a focus on peer-to-peer media streaming, adaptive quality control, and robust error handling.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer (React)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ UI Components│  │ React Context│  │  Service Layer      │   │
│  │  - Room      │  │  - Auth      │  │  - PeerConnection   │   │
│  │  - Chat      │  │  - Signaling │  │  - MediaService     │   │
│  │  - Dashboard │  └──────────────┘  │  - WebSocket        │   │
│  └──────────────┘                    │  - NetworkMonitor   │   │
│                                      └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Server Layer (Node.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ REST API     │  │  WebSocket   │  │  Middleware         │   │
│  │  - Auth      │  │  - Signaling │  │  - JWT Verify       │   │
│  │  - Rooms     │  │  - Messages  │  │  - Error Handler    │   │
│  └──────────────┘  └──────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ MongoDB Protocol
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Database Layer (MongoDB)                     │
├─────────────────────────────────────────────────────────────────┤
│  Collections: users, rooms                                       │
│  Indexes: userId, roomId, isActive                              │
└─────────────────────────────────────────────────────────────────┘

                     WebRTC P2P Connections
┌─────────────┐                                    ┌─────────────┐
│  Peer A     │◄──────── Media Streams ──────────►│  Peer B     │
│  (Browser)  │                                    │  (Browser)  │
└─────────────┘                                    └─────────────┘
       ▲                                                  ▲
       │                                                  │
       └────────────────► STUN/TURN ◄────────────────────┘
                      (NAT Traversal)
```

## Component Architecture

### 1. Client Architecture

#### React Component Hierarchy

```
App (ErrorBoundary)
├── AuthProvider
│   ├── SignalingProvider
│   │   ├── Header
│   │   ├── Routes
│   │   │   ├── Home
│   │   │   ├── Login/Register
│   │   │   ├── Dashboard
│   │   │   └── Room (ErrorBoundary)
│   │   │       ├── VideoGrid
│   │   │       ├── Controls
│   │   │       ├── Chat
│   │   │       ├── NetworkQualityIndicator
│   │   │       └── QualitySelector
│   │   └── Footer
```

#### Service Layer Architecture

**PeerConnectionManager** (Singleton)

- Manages multiple peer connections
- Handles offer/answer negotiation
- Coordinates ICE candidate exchange
- Monitors connection states
- Implements auto-recovery

**PeerConnection** (Per-peer instance)

- Wraps RTCPeerConnection
- Manages tracks and streams
- Implements ICE restart
- Handles bandwidth adaptation
- Collects connection statistics

**MediaService** (Singleton)

- getUserMedia wrapper
- Device enumeration
- Track management (enable/disable)
- Screen share handling
- Stream cleanup

**WebSocketService** (Singleton)

- WebSocket connection management
- Exponential backoff reconnection
- Message queuing
- Event-based message handling
- Heartbeat/ping mechanism

**NetworkQualityMonitor** (Singleton)

- getStats() polling
- Quality calculation (RTT, jitter, packet loss)
- Adaptive bitrate recommendations
- Quality change notifications

### 2. Server Architecture

#### WebSocket Signaling Flow

```
Client Connection
      │
      ▼
Authentication (JWT)
      │
      ▼
Connection Established
      │
      ├─► join-room
      │   ├─► Validate room
      │   ├─► Update participants
      │   └─► Broadcast to room
      │
      ├─► offer/answer/ice-candidate
      │   ├─► Validate message
      │   ├─► Find target peer
      │   └─► Relay to target
      │
      ├─► chat-message
      │   └─► Broadcast to room
      │
      └─► leave-room
          ├─► Update room state
          └─► Notify participants
```

#### Message Handler Architecture

```javascript
handleMessage(server, client, message, correlationId)
    │
    ├─► Type-based routing
    │
    ├─► Validation
    │   ├─► Room membership
    │   ├─► Message format
    │   └─► Data sanitization
    │
    ├─► Business logic
    │   ├─► Database updates
    │   ├─► State management
    │   └─► Broadcasting
    │
    └─► Error handling
        └─► Correlation ID tracking
```

### 3. Data Models

#### User Schema

```javascript
{
  _id: ObjectId,
  username: String (unique, indexed),
  email: String (unique, indexed),
  password: String (hashed),
  displayName: String,
  createdAt: Date,
  lastLogin: Date
}
```

#### Room Schema

```javascript
{
  _id: ObjectId,
  roomId: String (unique, indexed, auto-generated),
  name: String,
  description: String,
  createdBy: ObjectId (ref: User),
  accessToken: String (unique),
  isPublic: Boolean,
  maxParticipants: Number (default: 6, max: 10),
  isActive: Boolean (indexed),
  participants: [
    {
      userId: ObjectId (ref: User),
      connectionId: String,
      joinedAt: Date,
      leftAt: Date,
      duration: Number (seconds)
    }
  ],
  currentParticipants: Number,
  createdAt: Date,
  closedAt: Date
}
```

## WebRTC Connection Flow

### Peer Connection Establishment

```
Peer A                  Signaling Server                  Peer B
  │                            │                             │
  ├──join-room────────────────►│                             │
  │                            ├──room-joined─────────────────►
  │                            │◄──join-room─────────────────┤
  │◄──user-joined──────────────┤                             │
  │                            │                             │
  ├──createOffer()             │                             │
  ├──setLocalDescription()     │                             │
  ├──offer──────────────────────►                            │
  │                            ├──offer──────────────────────►
  │                            │             createAnswer()──┤
  │                            │      setLocalDescription()──┤
  │                            │◄──answer─────────────────────┤
  │◄──answer────────────────────┤                            │
  ├──setRemoteDescription()    │                             │
  │                            │                             │
  ├──ICE candidates────────────►├──ICE candidates──────────►│
  │◄──ICE candidates────────────┤◄──ICE candidates──────────┤
  │                            │                             │
  ├─────────────────── P2P Media Stream ─────────────────────►
  │◄──────────────────── P2P Media Stream ─────────────────────┤
```

### ICE Restart Flow (Connection Recovery)

```
Connection Failed/Disconnected
        │
        ▼
ICE State: disconnected
        │
        ├─► Wait 5 seconds
        │
        ▼
Still disconnected?
        │
        ├─► Yes: Attempt ICE restart
        │   ├─► createOffer({ iceRestart: true })
        │   ├─► setLocalDescription()
        │   └─► Send new offer
        │
        └─► No: Connection recovered
```

## State Management

### Client State Flow

```
┌─────────────────────────────────────────────┐
│           Global State (Context)             │
├─────────────────────────────────────────────┤
│  AuthContext                                 │
│  ├─ user: User | null                       │
│  ├─ isAuthenticated: boolean                │
│  └─ methods: login, logout, register        │
│                                              │
│  SignalingContext                           │
│  ├─ connectionState: string                 │
│  ├─ currentRoom: string | null              │
│  ├─ participants: Array                     │
│  └─ methods: joinRoom, leaveRoom, send      │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│         Component State (Room.jsx)           │
├─────────────────────────────────────────────┤
│  localStream: MediaStream                   │
│  remoteStreams: Map<userId, StreamData>     │
│  isAudioEnabled: boolean                    │
│  isVideoEnabled: boolean                    │
│  isScreenSharing: boolean                   │
│  activeSpeakerId: string | null             │
│  audioLevels: Map<userId, number>           │
└─────────────────────────────────────────────┘
```

### Server State Management

```
┌─────────────────────────────────────────────┐
│        SignalingServer State                 │
├─────────────────────────────────────────────┤
│  clients: Map<connectionId, ClientData>     │
│  ├─ ws: WebSocket                           │
│  ├─ userId: string                          │
│  ├─ roomId: string | null                   │
│  ├─ username: string                        │
│  └─ connectionId: string                    │
│                                              │
│  userConnections: Map<userId, Set>          │
│  └─ Set of connectionIds per user           │
│                                              │
│  rooms: Map<roomId, Set>                    │
│  └─ Set of connectionIds per room           │
└─────────────────────────────────────────────┘
```

## Network Quality Adaptation

### Quality Levels & Bitrate

```
Quality    │ RTT      │ Jitter   │ Loss  │ Bitrate
───────────┼──────────┼──────────┼───────┼─────────
Excellent  │ <100ms   │ <15ms    │ 0     │ 2500kbps
Good       │ <200ms   │ <30ms    │ 0-1   │ 1500kbps
Fair       │ <300ms   │ <50ms    │ 1-5   │ 1000kbps
Poor       │ >300ms   │ >50ms    │ >5    │  500kbps
```

### Adaptive Algorithm

```javascript
Every 3 seconds:
  1. Poll getStats() for all peers
  2. Calculate average RTT, jitter, packet loss
  3. Determine quality tier
  4. If quality changed:
     - Update UI indicator
     - Adjust video bitrate
     - Notify user
```

## Security Architecture

### Authentication Flow

```
Client                    Server                  MongoDB
  │                         │                        │
  ├─POST /api/auth/login──►│                        │
  │                         ├─findOne(username)────►│
  │                         │◄────user data──────────┤
  │                         ├─bcrypt.compare()       │
  │                         ├─jwt.sign()             │
  │◄──JWT token─────────────┤                        │
  │                         │                        │
  ├─WS connect + token────►│                        │
  │                         ├─jwt.verify()           │
  │◄──connected─────────────┤                        │
```

### Security Layers

1. **Transport Security**

   - HTTPS in production (required for WebRTC)
   - WSS (WebSocket Secure)
   - TLS 1.2+ enforcement

2. **Authentication**

   - JWT tokens (HttpOnly cookies recommended)
   - Token expiration (24h default)
   - Refresh token mechanism (TODO)

3. **Authorization**

   - Room access tokens
   - User-room relationship validation
   - Protected routes

4. **Input Validation**

   - Message length limits
   - Data sanitization
   - Type checking

5. **Rate Limiting** (TODO)
   - Per-user message limits
   - Connection attempt limits
   - API endpoint throttling

## Error Handling Strategy

### Client-Side

```
┌─────────────────────────────────────────────┐
│         Error Boundary (React)               │
├─────────────────────────────────────────────┤
│  App Level                                   │
│  ├─ Catch all unhandled errors              │
│  └─ Display fallback UI                     │
│                                              │
│  Room Level                                  │
│  ├─ Catch room-specific errors              │
│  ├─ Allow recovery without full reload      │
│  └─ Log to error service (TODO)             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│      Service Layer Error Handling            │
├─────────────────────────────────────────────┤
│  try/catch blocks                            │
│  ├─ Media permission errors                 │
│  ├─ WebSocket connection errors             │
│  ├─ WebRTC connection failures              │
│  └─ ICE restart on failure                  │
└─────────────────────────────────────────────┘
```

### Server-Side

```javascript
Error Handling Middleware Chain
  │
  ├─► Route Handler (try/catch)
  │   └─► Specific error handling
  │
  ├─► Message Handler (try/catch)
  │   └─► Send error to client
  │
  └─► Global Error Handler
      ├─► Log error
      ├─► Send appropriate response
      └─► Don't leak sensitive info
```

## Performance Optimizations

### Client Optimizations

1. **Code Splitting**

   - Route-based splitting
   - Lazy loading components
   - Dynamic imports for heavy features

2. **Media Optimization**

   - Adaptive bitrate based on network
   - Resolution scaling
   - Frame rate adjustment

3. **React Optimizations**

   - useMemo for expensive calculations
   - useCallback for stable references
   - React.memo for pure components

4. **WebRTC Optimizations**
   - Track reuse (avoid creating new streams)
   - Efficient peer connection management
   - ICE candidate trickling

### Server Optimizations

1. **Connection Management**

   - Connection pooling for MongoDB
   - WebSocket connection limits
   - Graceful shutdown handling

2. **Data Persistence**

   - Batch writes for participant tracking
   - Indexed queries
   - Lean queries (select only needed fields)

3. **Scalability** (Future)
   - Horizontal scaling with Redis
   - Load balancing
   - Session affinity for WebSockets
   - Microservices architecture

## Monitoring & Observability

### Logging Strategy

```
Server Logs
├─ Structured JSON logging
├─ Correlation IDs for request tracking
├─ Log levels: error, warn, info, debug
└─ Log aggregation (TODO: ELK stack)

Client Logs
├─ Console logging (dev mode)
├─ Error tracking (TODO: Sentry)
└─ Analytics (TODO: Google Analytics)
```

### Metrics to Track

1. **Connection Metrics**

   - Active connections
   - Connection duration
   - Reconnection rate
   - ICE failure rate

2. **Performance Metrics**

   - Average RTT
   - Packet loss rate
   - Bitrate statistics
   - Room join time

3. **Usage Metrics**
   - Active rooms
   - Participants per room
   - Feature usage (chat, screen share)
   - Session duration

## Future Enhancements

### Short-term

- [ ] Recording functionality
- [ ] Reactions/emoji
- [ ] Virtual backgrounds
- [ ] Noise suppression
- [ ] Background blur

### Medium-term

- [ ] SFU architecture for scalability (>10 participants)
- [ ] Simulcast support
- [ ] Server-side recording
- [ ] Transcription
- [ ] Breakout rooms

### Long-term

- [ ] End-to-end encryption (Insertable Streams)
- [ ] Mobile apps (React Native)
- [ ] Desktop apps (Electron)
- [ ] AI features (noise cancellation, auto-framing)
- [ ] Integration APIs (Slack, Calendar, etc.)

## References

- WebRTC 1.0 Specification: https://www.w3.org/TR/webrtc/
- STUN/TURN/ICE RFC: https://tools.ietf.org/html/rfc5245
- React Best Practices: https://react.dev/learn
- MongoDB Schema Design: https://docs.mongodb.com/manual/core/data-modeling-introduction/

---

This architecture document is a living document and will be updated as the system evolves.
