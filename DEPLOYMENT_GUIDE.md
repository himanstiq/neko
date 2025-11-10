# Deployment Guide for Neko

This guide provides step-by-step instructions for deploying the Neko video conferencing app.

## Architecture

- **Frontend:** Vercel (static hosting)
- **Backend:** Render.com (WebSocket support)
- **Database:** MongoDB Atlas (cloud database)

---

## Part 1: MongoDB Atlas Setup (5 minutes)

### 1. Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new project called "Neko"

### 2. Create Database Cluster

1. Click "Build a Database"
2. Select **FREE** (M0 tier)
3. Choose a cloud provider and region (closest to your users)
4. Click "Create Cluster"

### 3. Configure Database Access

1. Go to **Database Access** in left sidebar
2. Click "Add New Database User"
3. Create user:
   - Username: `neko_admin`
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Read and write to any database"
4. Click "Add User"

### 4. Configure Network Access

1. Go to **Network Access** in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is needed because Render uses dynamic IPs
4. Click "Confirm"

### 5. Get Connection String

1. Go to **Database** in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `myFirstDatabase` with `neko`

**Example:**

```
mongodb+srv://neko_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/neko?retryWrites=true&w=majority
```

**Save this connection string!** You'll need it later.

---

## Part 2: Backend Deployment to Render (10 minutes)

### 1. Push Code to GitHub

```bash
cd d:\Code\Bin\neko
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/neko.git
git push -u origin main
```

### 2. Create Render Account

1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 3. Create New Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name:** `neko-backend`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 4. Add Environment Variables

Click "Advanced" and add these environment variables:

| Key                  | Value                                                  |
| -------------------- | ------------------------------------------------------ |
| `NODE_ENV`           | `production`                                           |
| `PORT`               | `5000`                                                 |
| `MONGODB_URI`        | Your MongoDB connection string from Part 1             |
| `JWT_SECRET`         | Generate using command below                           |
| `JWT_EXPIRE`         | `7d`                                                   |
| `JWT_REFRESH_EXPIRE` | `30d`                                                  |
| `CLIENT_URL`         | Leave blank for now (update after frontend deployment) |
| `LOG_LEVEL`          | `info`                                                 |

**Generate JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Once deployed, note your backend URL:
   - Example: `https://neko-backend.onrender.com`

### 6. Test Backend

Visit: `https://neko-backend.onrender.com/api/health`

You should see:

```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": "..."
}
```

**Save your backend URL!** You'll need it for frontend deployment.

---

## Part 3: Frontend Deployment to Vercel (10 minutes)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Prepare Client Directory

```bash
cd d:\Code\Bin\neko\client
```

### 4. Create .env.production file

Create `client/.env.production` (this file should NOT be committed):

```env
VITE_API_URL=https://neko-backend.onrender.com/api
VITE_WS_URL=wss://neko-backend.onrender.com/ws
```

Replace `neko-backend.onrender.com` with your actual Render URL.

### 5. Deploy to Vercel

```bash
vercel
```

Follow the prompts:

- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **neko** (or your choice)
- In which directory is your code located? **`./`** (press Enter)
- Want to override settings? **N**

### 6. Add Environment Variables to Vercel

```bash
vercel env add VITE_API_URL
# Paste: https://neko-backend.onrender.com/api

vercel env add VITE_WS_URL
# Paste: wss://neko-backend.onrender.com/ws
```

### 7. Deploy to Production

```bash
vercel --prod
```

### 8. Note Your Frontend URL

Vercel will provide a URL like:

- `https://neko-xxxxx.vercel.app`

**Save this URL!**

---

## Part 4: Final Configuration (5 minutes)

### 1. Update Backend CLIENT_URL

1. Go to Render Dashboard
2. Click on your `neko-backend` service
3. Go to "Environment" tab
4. Update `CLIENT_URL` to your Vercel URL
   - Example: `https://neko-xxxxx.vercel.app`
5. Click "Save Changes"
6. Service will automatically redeploy

### 2. Verify CORS Settings

Wait for Render to finish redeploying (~2 minutes)

---

## Part 5: Testing (10 minutes)

### 1. Visit Your App

Go to your Vercel URL: `https://neko-xxxxx.vercel.app`

### 2. Test Registration

1. Click "Register"
2. Create a test account
3. Verify you can login

### 3. Test Room Creation

1. Click "Create Room"
2. Enter room name
3. Verify room is created

### 4. Test Video Conference

1. Join the room
2. Allow camera/microphone permissions
3. Open another browser/tab
4. Login with different account (or same account)
5. Join the same room
6. Verify video/audio streaming works

### 5. Test Features

- [ ] Audio mute/unmute
- [ ] Video on/off
- [ ] Screen sharing
- [ ] Chat messages
- [ ] User list
- [ ] Leave room

---

## Troubleshooting

### Backend Won't Start

**Check logs on Render:**

1. Go to Render Dashboard
2. Click your service
3. Click "Logs" tab
4. Look for errors

**Common issues:**

- MongoDB connection string incorrect
- Environment variables missing
- Port configuration wrong

### Frontend Can't Connect to Backend

**Check environment variables:**

```bash
cd client
vercel env ls
```

**Verify URLs:**

- API URL should be `https://` (not `http://`)
- WebSocket URL should be `wss://` (not `ws://`)
- No trailing slashes

### WebSocket Connection Fails

**Check browser console:**

1. Open DevTools (F12)
2. Go to Console tab
3. Look for WebSocket errors

**Common issues:**

- CORS not configured (CLIENT_URL mismatch)
- JWT token expired
- Backend not running

### Video/Audio Not Working

**Check browser permissions:**

1. Click the lock icon in address bar
2. Verify camera/microphone are allowed
3. Try a different browser

**Requirements:**

- HTTPS connection (automatic with Vercel)
- Modern browser (Chrome, Firefox, Edge, Safari)
- Camera and microphone access

### Database Connection Issues

**Check MongoDB Atlas:**

1. Verify cluster is running
2. Check network access (0.0.0.0/0 allowed)
3. Verify database user permissions
4. Test connection string

---

## Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Go to Vercel Dashboard
2. Click your project
3. Go to "Settings" → "Domains"
4. Add your domain
5. Follow DNS configuration instructions

### Add Custom Domain to Render

1. Go to Render Dashboard
2. Click your service
3. Go to "Settings" → "Custom Domains"
4. Add your domain
5. Follow DNS configuration instructions

### Update Environment Variables

After adding custom domains, update:

- `CLIENT_URL` on Render backend
- `VITE_API_URL` on Vercel frontend
- `VITE_WS_URL` on Vercel frontend

---

## Monitoring & Maintenance

### Check Logs

**Render (Backend):**

```
Dashboard → Service → Logs
```

**Vercel (Frontend):**

```bash
vercel logs
```

### Monitor Uptime

- Render has built-in monitoring
- Consider UptimeRobot for external monitoring

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update
```

### Backup Database

MongoDB Atlas has automatic backups, but you can also:

1. Go to Atlas Dashboard
2. Clusters → Click "..." → "Take Snapshot Now"

---

## Costs

### Free Tier Limits

**Render Free:**

- 750 hours/month
- Sleeps after 15 min of inactivity
- Cold start delay (~30 seconds)

**Vercel Free:**

- 100 GB bandwidth/month
- Unlimited projects
- No sleep mode

**MongoDB Atlas Free (M0):**

- 512 MB storage
- Shared RAM
- Good for development/testing

### Upgrade Recommendations

**For Production:**

- Render: $7/month (no sleep, faster)
- MongoDB: $9/month (M2 cluster)
- Vercel: Free tier is usually sufficient

---

## Next Steps

After successful deployment:

1. [ ] Setup error tracking (Sentry)
2. [ ] Add analytics (Google Analytics, Vercel Analytics)
3. [ ] Configure TURN server for better connectivity
4. [ ] Setup CI/CD with GitHub Actions
5. [ ] Create user documentation
6. [ ] Add terms of service
7. [ ] Add privacy policy
8. [ ] Monitor usage and performance

---

## Support

**Issues?**

- Check logs first
- Review environment variables
- Test locally in production mode
- Check browser console for errors

**Resources:**

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [WebRTC Troubleshooting](https://webrtc.github.io/samples/)

---

**Congratulations! Your app should now be live! 🎉**

Visit your Vercel URL and start conferencing!
