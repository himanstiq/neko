# Neko WebRTC - Quick Setup Guide

## Prerequisites Check

Before starting, ensure you have:

- [ ] Node.js v18+ installed (`node --version`)
- [ ] MongoDB v6+ installed or Docker
- [ ] npm or yarn package manager
- [ ] A modern browser (Chrome, Firefox, Edge, Safari)

## Step-by-Step Setup

### 1. MongoDB Setup

#### Option A: Local MongoDB

```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify it's running
sudo systemctl status mongodb
```

#### Option B: MongoDB Docker

```bash
# Pull and run MongoDB container
docker run -d \
  --name neko-mongodb \
  -p 27017:27017 \
  -v neko-mongo-data:/data/db \
  mongo:latest

# Verify it's running
docker ps
```

#### Option C: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Use it in server/.env as MONGODB_URI

### 2. Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor

# Start development server
npm run dev

# You should see:
# ✅ MongoDB connected
# ✅ Server running on port 5000
# ✅ WebSocket signaling server initialized
```

### 3. Client Setup

```bash
# In a new terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env if needed (defaults should work)
nano .env

# Start development server
npm run dev

# You should see:
# ✅ VITE v7.x.x ready in Xms
# ✅ Local: http://localhost:5173/
```

### 4. First Run

1. Open browser to http://localhost:5173
2. Click "Register" and create an account
3. Login with your credentials
4. Click "Create Room" from dashboard
5. Copy the room ID
6. In another browser tab/window:
   - Login (or register another user)
   - Click "Join Room"
   - Paste the room ID
7. Accept camera/microphone permissions when prompted

### 5. Test Features

- [x] Video/audio streaming
- [x] Mute/unmute controls
- [x] Screen sharing
- [x] Chat messaging
- [x] Active speaker detection
- [x] Device selection
- [x] Network quality indicator

## Common Issues & Solutions

### Issue: "Camera permission denied"

**Solution:**

- Check browser permissions (click lock icon in address bar)
- Ensure you're on localhost or HTTPS
- Try a different browser

### Issue: "MongoDB connection failed"

**Solution:**

```bash
# Check if MongoDB is running
sudo systemctl status mongodb  # Linux
brew services list  # macOS

# Check connection string in server/.env
MONGODB_URI=mongodb://localhost:27017/neko
```

### Issue: "WebSocket connection failed"

**Solution:**

- Ensure server is running on port 5000
- Check VITE_WS_URL in client/.env
- Verify firewall allows WebSocket connections

### Issue: "Peer connection failed"

**Solution:**

- Check console for ICE connection errors
- Verify STUN servers are accessible
- Consider setting up TURN server for restrictive networks

### Issue: "No audio/video from remote peer"

**Solution:**

- Check both users granted camera/mic permissions
- Verify network allows WebRTC (P2P) connections
- Check console for media stream errors
- Try refreshing both browsers

### Issue: "High latency or poor quality"

**Solution:**

- Use wired connection instead of WiFi
- Close other bandwidth-heavy applications
- Lower video quality in settings
- Check network quality indicator

## TURN Server Setup (Optional but Recommended)

For production or restrictive networks:

### Install coturn

```bash
# Ubuntu/Debian
sudo apt-get install coturn

# macOS
brew install coturn

# Enable coturn
sudo nano /etc/default/coturn
# Uncomment: TURNSERVER_ENABLED=1
```

### Configure coturn

```bash
sudo nano /etc/turnserver.conf
```

Add:

```conf
listening-port=3478
tls-listening-port=5349

# External IP (your server's public IP)
external-ip=YOUR_PUBLIC_IP

fingerprint
lt-cred-mech

# Create a user (change username and password)
user=nekouser:nekopass123

# Your domain
realm=yourdomain.com

# Certificate (if using TLS)
cert=/path/to/cert.pem
pkey=/path/to/key.pem
```

### Start coturn

```bash
sudo systemctl start coturn
sudo systemctl enable coturn
sudo systemctl status coturn
```

### Update WebRTC config

Edit `client/src/config/webrtc.js`:

```javascript
export const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:yourdomain.com:3478",
      username: "nekouser",
      credential: "nekopass123",
    },
  ],
  iceCandidatePoolSize: 10,
};
```

## Production Deployment

### 1. Build Client

```bash
cd client
npm run build

# Output will be in client/dist/
```

### 2. Serve with nginx

```bash
sudo apt-get install nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/neko
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Client static files
    location / {
        root /var/www/neko/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### 3. SSL Certificate (Required for WebRTC)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### 4. Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start server
cd server
pm2 start src/server.js --name neko-server

# Save and enable startup
pm2 save
pm2 startup
```

## Performance Optimization

### Client-side

- Enable production build: `npm run build`
- Use CDN for static assets
- Implement code splitting
- Enable gzip compression

### Server-side

- Use clustering for Node.js
- Implement Redis for session storage
- Set up MongoDB replica set
- Enable compression middleware

### Network

- Use TURN server for NAT traversal
- Implement simulcast for large rooms
- Consider SFU for >6 participants
- Monitor bandwidth usage

## Monitoring & Logging

### Server Logs

```bash
# View logs
pm2 logs neko-server

# Monitor
pm2 monit
```

### Client Debugging

```javascript
// Enable verbose logging
localStorage.setItem("debug", "true");

// Check WebRTC stats
// Open browser console and look for:
// - ICE candidates
// - Connection states
// - Media stream stats
```

## Next Steps

1. Customize branding and UI
2. Add more features (reactions, polls, etc.)
3. Implement recording functionality
4. Add analytics tracking
5. Set up error monitoring (Sentry)
6. Implement load balancing
7. Add integration tests

## Resources

- WebRTC Documentation: https://webrtc.org/
- MDN WebRTC Guide: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- MongoDB Docs: https://docs.mongodb.com/
- React Docs: https://react.dev/

## Support

- GitHub Issues: [Your repo URL]
- Documentation: See README.md
- WebRTC Debugging: chrome://webrtc-internals/

---

Happy Conferencing! 🎥✨
