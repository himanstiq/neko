# Changelog

All notable changes to the Neko WebRTC project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-10

### Added - Core Features

- ✅ **Multi-party video conferencing** with WebRTC P2P mesh topology
- ✅ **Real-time signaling server** using WebSocket for session orchestration
- ✅ **JWT-based authentication** for secure user access
- ✅ **Room management** with MongoDB persistence
- ✅ **Active speaker detection** using Web Audio API
- ✅ **Screen sharing** with automatic track replacement
- ✅ **Audio/video controls** (mute/unmute, camera on/off)
- ✅ **Device selection** (microphone, camera, speakers)
- ✅ **Video quality presets** (360p, 480p, 720p)

### Added - Advanced Features

- ✅ **ICE restart mechanism** for automatic connection recovery
- ✅ **Network quality monitoring** with real-time statistics
  - RTT (Round Trip Time) tracking
  - Jitter measurement
  - Packet loss detection
  - Connection quality indicators (Excellent/Good/Fair/Poor)
- ✅ **Adaptive bitrate control** based on network conditions
- ✅ **In-room text chat** with typing indicators
- ✅ **Error boundaries** for graceful error handling
- ✅ **Auto-reconnect** with exponential backoff for WebSocket
- ✅ **Grid and speaker view modes**
- ✅ **Audio level indicators** for all participants
- ✅ **Connection status monitoring**

### Added - Infrastructure

- ✅ **React 19.2** with modern hooks and concurrent features
- ✅ **Tailwind CSS v4** for styling
- ✅ **Vite 7.1** for fast development and optimized builds
- ✅ **Express 5.1** server with WebSocket support
- ✅ **MongoDB 8.19** for data persistence
- ✅ **Structured logging** with correlation IDs
- ✅ **STUN server configuration** for NAT traversal
- ✅ **Comprehensive documentation** (README, SETUP, ARCHITECTURE, CONTRIBUTING)

### Technical Improvements

- ✅ **PeerConnection class** with built-in error recovery
- ✅ **PeerConnectionManager** for centralized peer management
- ✅ **MediaService** for device and stream management
- ✅ **WebSocketService** with reconnection logic
- ✅ **AudioMonitor** for voice activity detection
- ✅ **NetworkQualityMonitor** for adaptive quality
- ✅ **Proper cleanup** on component unmount
- ✅ **React hooks best practices** (useEffect dependencies, memoization)
- ✅ **WebRTC getStats() integration** for performance monitoring

### Documentation

- ✅ **README.md** - Project overview and quick start
- ✅ **SETUP.md** - Comprehensive setup guide with troubleshooting
- ✅ **ARCHITECTURE.md** - System architecture and design decisions
- ✅ **CONTRIBUTING.md** - Contribution guidelines and best practices
- ✅ **CHANGELOG.md** - Version history and changes
- ✅ **.env.example** files for both client and server

### Security

- ✅ **JWT token authentication** for WebSocket connections
- ✅ **Password hashing** with bcryptjs
- ✅ **CORS configuration** for API security
- ✅ **Input validation** for all user inputs
- ✅ **Rate limiting preparation** (documented for future implementation)
- ✅ **Secure WebSocket** (WSS) support for production

### Bug Fixes

- ✅ Fixed React hooks dependency warnings
- ✅ Fixed cleanup issues in useEffect hooks
- ✅ Fixed Tailwind v4 class migrations (flex-shrink-0 → shrink-0, break-words → wrap-break-word)
- ✅ Fixed unused variable warnings with proper prefixing
- ✅ Fixed screen share track replacement issues
- ✅ Fixed memory leaks in audio monitoring
- ✅ Fixed peer connection cleanup on unmount

### Performance Optimizations

- ✅ **Adaptive bitrate** - Automatically adjust based on network quality
- ✅ **Efficient re-renders** - Proper use of React.memo and useCallback
- ✅ **Track reuse** - Avoid creating unnecessary media streams
- ✅ **ICE candidate trickling** - Progressive connection establishment
- ✅ **Lazy loading** - Components loaded on demand
- ✅ **MongoDB indexes** - Optimized queries for rooms and users

### Known Limitations

- ⚠️ Mesh topology limits to ~10 participants (consider SFU for more)
- ⚠️ No server-side recording yet
- ⚠️ No end-to-end encryption (E2EE)
- ⚠️ No mobile apps (web-only)
- ⚠️ No simulcast support yet

## [0.1.0] - Initial Development

### Added

- Basic WebRTC functionality
- User authentication
- Room creation and joining
- Video/audio streaming
- Basic UI components

---

## Upgrade Guide

### From 0.1.0 to 1.0.0

#### Breaking Changes

- None (first major release)

#### New Dependencies

```bash
# Client
npm install

# Server
npm install
```

#### Environment Variables

Add to `.env`:

```bash
# Server - No changes needed

# Client - No changes needed
```

#### Database Migrations

No migrations required. The Room schema has been enhanced with participant tracking, but is backward compatible.

---

## Future Roadmap

### Version 1.1.0 (Q1 2025)

- [ ] Recording functionality
- [ ] Virtual backgrounds
- [ ] Noise suppression
- [ ] Background blur
- [ ] Reactions/emoji

### Version 1.2.0 (Q2 2025)

- [ ] SFU architecture for scalability
- [ ] Simulcast support
- [ ] Breakout rooms
- [ ] Polls and Q&A
- [ ] Waiting room

### Version 2.0.0 (Q3 2025)

- [ ] End-to-end encryption (E2EE)
- [ ] Mobile apps (React Native)
- [ ] Desktop apps (Electron)
- [ ] AI features (transcription, translation)
- [ ] Calendar integrations

---

## Support

For bug reports and feature requests, please create an issue on GitHub.

For questions and discussions, use GitHub Discussions.

---

**Full Changelog**: https://github.com/yourusername/neko/commits/main
