# Railway Deployment Guide for Skill Street Backend

## Prerequisites
- Railway.app account (https://railway.app)
- Git repository with the code
- Backblaze B2 account with credentials
- Stripe account with API keys
- Firebase project (optional, for payments)

---

## Step 1: Prepare Your Project

### 1.1 Verify Files
Ensure these files exist in your project root:
- `server.cjs` - Main server file ✓
- `package.json` - Dependencies ✓
- `.env.example` - Environment variables template ✓

### 1.2 Create .gitignore
Make sure your `.gitignore` includes:
```
node_modules/
.env
.env.local
firebase-service-account.json
*.log
```

---

## Step 2: Gather Your Credentials

### 2.1 Backblaze B2
1. Go to https://www.backblaze.com/b2/
2. Log into your account
3. Click "App Keys" → "Add Application Key"
4. Copy these values:
   - **B2_KEY_ID**: Application Key ID
   - **B2_KEY_SECRET**: Application Key
   - **B2_BUCKET_ID**: Your bucket ID
   - **B2_BUCKET_NAME**: Your bucket name (e.g., "skillstreet-database")

⚠️ **SECURITY**: These are sensitive credentials. Never commit them to Git.

### 2.2 Stripe
1. Go to https://dashboard.stripe.com/
2. Navigate to Developers → API Keys
3. Copy your **STRIPE_SECRET_KEY** (starts with `sk_test_` or `sk_live_`)

### 2.3 Firebase (Optional, for Payments)
1. Go to Firebase Console (https://console.firebase.google.com/)
2. Select your project → Settings → Service Accounts
3. Download your service account JSON
4. Extract these values:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`

---

## Step 3: Deploy to Railway

### 3.1 Connect Repository
1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway will auto-detect Node.js environment

### 3.2 Set Environment Variables
1. In Railway, go to your project
2. Click "Variables" tab
3. Add all variables from `.env.example`:
   - `B2_KEY_ID`
   - `B2_KEY_SECRET`
   - `B2_BUCKET_ID`
   - `B2_BUCKET_NAME`
   - `STRIPE_SECRET_KEY`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL` (optional)
   - `PORT=3001`
   - `NODE_ENV=production`

### 3.3 Configure Build & Start Commands
In Railway's settings:
- **Build Command**: `npm install`
- **Start Command**: `node server.cjs`

### 3.4 Deploy
1. Click "Deploy" button
2. Wait for build to complete (3-5 minutes)
3. Copy your Railway URL (e.g., `https://your-app.railway.app`)

---

## Step 4: Test Your Backend

### 4.1 Health Check
```bash
curl https://your-app.railway.app/health
```

### 4.2 Test File Upload
```bash
curl -X POST https://your-app.railway.app/api/upload \
  -F "file=@test.pdf"
```

Expected response:
```json
{
  "success": true,
  "fileUrl": "https://f005.backblazeb2.com/file/...",
  "fileName": "timestamp-test.pdf"
}
```

---

## Step 5: Update Frontend Configuration

Update your frontend to use the Railway backend URL:

### In your React env or config file:
```javascript
const API_BASE_URL = process.env.VITE_API_URL || 'https://your-app.railway.app';
```

### Or in `.env.production`:
```
VITE_API_URL=https://your-app.railway.app
```

---

## Step 6: Monitor & Debug

### View Logs
- In Railway dashboard → your project → "Logs" tab
- See real-time server logs

### Common Issues

**Issue**: "B2 credentials not configured"
- **Fix**: Ensure all B2_* variables are set in Railway

**Issue**: "Firebase not configured"
- **Fix**: This is OK if you don't need payments yet. The app will work without it.

**Issue**: CORS errors on frontend
- **Fix**: Update your frontend's API base URL to match Railway URL

**Issue**: 502 Bad Gateway
- **Fix**: Check Railway logs for server errors

---

## Step 7: API Endpoints Available

### File Upload
- **POST** `/api/upload` - Upload file to Backblaze
- **GET** `/api/download/:fileId` - Get download URL
- **DELETE** `/api/delete/:fileId` - Delete file

### Payments (requires Firebase)
- **POST** `/api/payments/create-intent` - Create payment intent
- **POST** `/api/payments/confirm` - Confirm payment
- **GET** `/api/payments/history/:userId` - Get payment history
- **GET** `/api/approvals/submission/:submissionId` - Check approval status

---

## Next Steps

1. ✅ Fix server.cjs bugs (DONE)
2. ✅ Create `.env.example` (DONE)
3. → **Git commit your changes**
4. → **Deploy to Railway**
5. → **Test the endpoints**
6. → **Update frontend with Railway URL**

---

## Quick Command Reference

```bash
# Test locally
node server.cjs

# Install dependencies
npm install

# Start with nodemon (development)
npm install -g nodemon
nodemon server.cjs
```

---

**For support**: Check Railway docs at https://docs.railway.app/
