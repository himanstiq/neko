# ⚡ Quick Deploy Reference

## 🎯 You Are Here

Your app is **built and ready**. Now you need to deploy it.

---

## 🚨 Critical Information

**⚠️ VERCEL LIMITATION:** Vercel doesn't support WebSocket signaling servers.

**✅ SOLUTION:** Split deployment:

- Frontend → Vercel
- Backend → Render.com

---

## 📝 What You Need

### 1. MongoDB Atlas (Free)

- URL: https://www.mongodb.com/cloud/atlas
- What: Cloud database
- Time: 5 minutes

### 2. Render.com (Free)

- URL: https://render.com
- What: Backend hosting with WebSocket support
- Time: 10 minutes

### 3. Vercel (Free)

- URL: https://vercel.com
- What: Frontend hosting
- Time: 10 minutes

---

## 🚀 Deploy in 3 Steps

### Step 1: Setup MongoDB (5 min)

```bash
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up → Create free cluster (M0)
3. Create database user
4. Whitelist all IPs (0.0.0.0/0)
5. Copy connection string
```

**Save:** `mongodb+srv://user:pass@cluster.mongodb.net/neko`

---

### Step 2: Deploy Backend to Render (10 min)

```bash
# Push to GitHub
git init
git add .
git commit -m "Ready for deployment"
git push origin main

# Then:
1. Go to https://render.com
2. Sign up with GitHub
3. New Web Service
4. Connect your repo
5. Root Directory: server
6. Build: npm install
7. Start: npm start
8. Add environment variables (see below)
9. Deploy
```

**Environment Variables for Render:**

```
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-using-command-below>
CLIENT_URL=<will-update-after-vercel>
```

**Generate JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Save:** Your backend URL (e.g., `https://neko.onrender.com`)

---

### Step 3: Deploy Frontend to Vercel (10 min)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client
cd d:\Code\Bin\neko\client

# Deploy
vercel login
vercel

# Add environment variables
vercel env add VITE_API_URL
# Enter: https://neko.onrender.com/api

vercel env add VITE_WS_URL
# Enter: wss://neko.onrender.com/ws

# Deploy to production
vercel --prod
```

**Save:** Your frontend URL (e.g., `https://neko.vercel.app`)

---

### Step 4: Update Backend (2 min)

```bash
1. Go to Render dashboard
2. Click your service
3. Environment → Edit
4. Update CLIENT_URL to your Vercel URL
5. Save (auto-redeploys)
```

---

## ✅ Test Your Deployment

1. Visit your Vercel URL
2. Register a new account
3. Create a room
4. Join the room
5. Test video/audio

---

## 📚 Full Documentation

- **DEPLOYMENT_GUIDE.md** - Complete step-by-step guide
- **PRE_DEPLOYMENT_ISSUES.md** - Issues and solutions
- **FINAL_DEPLOYMENT_STATUS.md** - Complete status report

---

## 🆘 Quick Troubleshooting

**Can't connect to backend?**
→ Check `VITE_API_URL` and `VITE_WS_URL` in Vercel

**CORS error?**
→ Update `CLIENT_URL` on Render to match Vercel URL

**WebSocket fails?**
→ Ensure WSS (not WS): `wss://your-backend.onrender.com/ws`

**MongoDB connection fails?**
→ Check network access (0.0.0.0/0) and connection string

---

## 💰 Cost

**Free Tier (Testing):**

- MongoDB Atlas: Free (M0)
- Render: Free (sleeps after 15 min)
- Vercel: Free
- **Total: $0/month**

**Production (Recommended):**

- MongoDB Atlas: $9/month (M2)
- Render: $7/month (no sleep)
- Vercel: Free
- **Total: $16/month**

---

## ⏱️ Timeline

- MongoDB Setup: 5 minutes
- Backend Deploy: 10 minutes
- Frontend Deploy: 10 minutes
- Testing: 10 minutes
- **Total: ~35 minutes**

---

## 🎯 Start Here

**Read next:** `DEPLOYMENT_GUIDE.md`

**Then do:** Follow the guide step-by-step

**Get help:** Check `PRE_DEPLOYMENT_ISSUES.md`

---

**Your app is ready! Just follow the steps above. Good luck! 🚀**
