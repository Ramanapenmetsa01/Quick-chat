# Deployment Guide

## Frontend Deployment (Vercel)

### Step 1: Push Changes to GitHub
```bash
cd C:\Users\raman\OneDrive\Desktop\Chat-app
git add .
git commit -m "Add deployment configs"
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Select your repository: **Ramanapenmetsa01/Quick-chat**
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variables (click "Environment Variables"):
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
   (You'll add the actual Render URL after deploying backend)

6. Click **"Deploy"**

7. After deployment, you'll get a URL like: `https://quick-chat-xxxx.vercel.app`

---

## Backend Deployment (Render)

### Step 1: Deploy on Render

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your repository: **Ramanapenmetsa01/Quick-chat**
4. Configure the service:
   - **Name**: `quick-chat-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free

5. Add Environment Variables (click "Environment"):
   ```
   MONGODB_URL=your_mongodb_connection_string
   PORT=5000
   SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CLIENT_URL=https://quick-chat-xxxx.vercel.app
   ```

6. Click **"Create Web Service"**

7. After deployment, you'll get a URL like: `https://quick-chat-backend.onrender.com`

### Step 2: Update Frontend with Backend URL

1. Go back to Vercel dashboard
2. Go to your project → Settings → Environment Variables
3. Update `VITE_API_URL` with your Render URL:
   ```
   VITE_API_URL=https://quick-chat-backend.onrender.com
   ```
4. Go to Deployments tab → Click "..." → "Redeploy"

---

## Update Backend CORS

Make sure your `server.js` has proper CORS configuration:

```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
```

---

## Important Notes

- ✅ Free tier on Render may sleep after inactivity (30 mins)
- ✅ First request after sleep may take 30-60 seconds
- ✅ Both deployments auto-update when you push to GitHub
- ✅ Keep your `.env` values secure - never commit them

---

## Testing Deployment

1. Visit your Vercel URL
2. Try signing up/logging in
3. Check browser console for any CORS or API errors
4. Monitor Render logs for backend errors

---

## Troubleshooting

**CORS Error**: Check `CLIENT_URL` in Render env vars
**API Not Found**: Verify `VITE_API_URL` in Vercel env vars
**Backend Sleep**: First request after 30 mins will be slow on free tier
