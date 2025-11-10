# 🚀 Vercel Deployment Checklist for Neko

## ✅ Pre-Deployment Checklist

### 1. **Build Verification**

- [x] Client builds successfully (`npm run build` in client/)
- [ ] Server runs without errors (`npm start` in server/)
- [ ] No console errors or warnings in production build
- [ ] All environment variables are properly configured

### 2. **Code Quality**

- [ ] Run linter: `npm run lint` (client/)
- [ ] Fix all critical errors and warnings
- [ ] Remove console.logs (optional, but recommended)
- [ ] Check for hardcoded credentials or secrets

### 3. **Environment Variables**

Required environment variables for Vercel:

#### **Client Variables (VITE\_)**

```
VITE_API_URL=https://your-domain.vercel.app/api
VITE_WS_URL=wss://your-domain.vercel.app/ws
```

#### **Server Variables**

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/neko?retryWrites=true&w=majority
JWT_SECRET=<generate-strong-random-secret>
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
CLIENT_URL=https://your-domain.vercel.app
LOG_LEVEL=info
```

### 4. **Database Setup**

- [ ] MongoDB Atlas account created
- [ ] Database cluster created
- [ ] Network access configured (0.0.0.0/0 for Vercel)
- [ ] Database user created with read/write permissions
- [ ] Connection string tested
- [ ] Collections indexed if needed

### 5. **Security Checks**

- [ ] `.env` files are in `.gitignore`
- [ ] No sensitive data in git history
- [ ] JWT_SECRET is strong and random (use: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] CORS settings properly configured
- [ ] Rate limiting implemented (if needed)

### 6. **WebRTC Configuration**

- [ ] STUN servers configured
- [ ] TURN server configured (optional but recommended for production)
- [ ] ICE candidates properly handled
- [ ] Network quality monitoring enabled

### 7. **File Structure**

```
neko/
├── client/
│   ├── dist/              # Build output (created after build)
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── .gitignore
├── vercel.json
└── README.md
```

---

## 🔧 Deployment Steps

### **Option 1: Deploy via Vercel CLI**

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Login to Vercel**

```bash
vercel login
```

3. **Deploy from root directory**

```bash
cd d:\Code\Bin\neko
vercel
```

4. **Follow prompts:**

   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time)
   - Project name: **neko** (or your preferred name)
   - Directory: **./client** for frontend
   - Override settings? **N**

5. **Set environment variables**

```bash
# Client variables
vercel env add VITE_API_URL
vercel env add VITE_WS_URL

# Server variables
vercel env add NODE_ENV
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add CLIENT_URL
```

6. **Deploy to production**

```bash
vercel --prod
```

### **Option 2: Deploy via Vercel Dashboard**

1. **Push to GitHub**

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Import Project**

   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Select "neko" repository

3. **Configure Build Settings**

   - **Framework Preset:** Vite
   - **Root Directory:** `client/`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Add Environment Variables**

   - Go to Project Settings → Environment Variables
   - Add all required variables (see section 3 above)
   - Make sure to select appropriate environment (Production, Preview, Development)

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

---

## ⚠️ Known Limitations with Vercel

### **WebSocket Limitations**

Vercel has limitations with WebSocket connections:

- **Serverless functions timeout:** Max 60 seconds (Hobby), 300 seconds (Pro)
- **Not ideal for long-lived WebSocket connections**

### **Recommended Solution:**

Deploy the WebRTC signaling server separately:

1. **Backend (WebSocket Server):**

   - Deploy to **Render**, **Railway**, or **Fly.io** (supports long-lived connections)
   - Keep server running continuously
   - Update `VITE_WS_URL` to point to this server

2. **Frontend (Client):**
   - Deploy to Vercel (static hosting)
   - Fast CDN delivery
   - Automatic HTTPS

### **Alternative Architecture:**

```
Frontend (Vercel)
   ↓ HTTP/S
Backend API (Vercel Serverless)

Frontend (Vercel)
   ↓ WebSocket
Signaling Server (Render/Railway)
```

---

## 🔄 Post-Deployment Steps

### 1. **Verify Deployment**

- [ ] Visit your Vercel URL
- [ ] Test user registration
- [ ] Test user login
- [ ] Create a room
- [ ] Join a room (test with multiple tabs/devices)
- [ ] Test video/audio
- [ ] Test screen sharing
- [ ] Test chat functionality
- [ ] Check network quality indicators

### 2. **Monitor Logs**

```bash
vercel logs --follow
```

Or check logs in Vercel Dashboard → Deployments → Functions

### 3. **Check Performance**

- [ ] Lighthouse score
- [ ] Page load time
- [ ] WebRTC connection quality
- [ ] Database query performance

### 4. **Setup Custom Domain (Optional)**

- Go to Project Settings → Domains
- Add your custom domain
- Update DNS records
- Update environment variables with new domain

### 5. **Enable Analytics (Optional)**

- Vercel Analytics for web vitals
- MongoDB Atlas monitoring
- Custom error tracking (Sentry, etc.)

---

## 🐛 Troubleshooting

### **Build Fails**

```bash
# Clear node_modules and reinstall
rm -rf client/node_modules client/package-lock.json
cd client && npm install
npm run build
```

### **Environment Variables Not Working**

- Check variable names start with `VITE_` for client-side
- Redeploy after adding new env vars
- Check env vars are set for correct environment (Production/Preview)

### **WebSocket Connection Issues**

- Ensure WSS (not WS) in production
- Check CORS settings on server
- Verify JWT token is valid
- Consider deploying signaling server to dedicated platform

### **Database Connection Fails**

- Check MongoDB Atlas network access (whitelist 0.0.0.0/0)
- Verify connection string format
- Check database user permissions
- Test connection locally first

### **CORS Errors**

- Verify `CLIENT_URL` in server env vars
- Check CORS configuration in `server.js`
- Ensure credentials: true if using cookies

### **Media Permissions**

- Vercel provides automatic HTTPS (required for getUserMedia)
- Test on HTTPS only
- Check browser permissions

---

## 📊 Monitoring & Maintenance

### **Regular Checks**

- Monitor Vercel function execution time
- Check database usage and performance
- Review error logs weekly
- Test critical user flows monthly

### **Performance Optimization**

- Enable Vercel Analytics
- Optimize bundle size (code splitting)
- Use lazy loading for routes
- Implement caching strategies

### **Security Updates**

- Update dependencies regularly: `npm audit`
- Monitor security advisories
- Rotate JWT secrets periodically
- Review access logs

---

## 🎯 Production-Ready Checklist

Before going live:

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] Error monitoring setup
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (auto via Vercel)
- [ ] Terms of Service page
- [ ] Privacy Policy page
- [ ] Contact/Support page
- [ ] User documentation
- [ ] Tested on multiple browsers
- [ ] Tested on mobile devices
- [ ] Load testing completed
- [ ] Backup/recovery plan in place

---

## 🚨 Important Notes

1. **WebSocket Limitation:** Vercel serverless functions are not ideal for persistent WebSocket connections. Consider deploying the backend to a platform that supports long-lived connections.

2. **Cold Starts:** Serverless functions may have cold start delays (~1-2 seconds).

3. **Function Timeout:** Be aware of execution time limits.

4. **Database Connection Pooling:** Use MongoDB connection pooling to avoid connection limits.

5. **Cost:** Monitor usage to stay within free tier limits or plan for costs.

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

---

## ✅ Quick Deploy Command

```bash
# From project root
npm run build --prefix client
vercel --prod
```

---

**Good luck with your deployment! 🚀**
