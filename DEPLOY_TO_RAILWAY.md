# Quick Start: Commit & Deploy to Railway

## Step 1: Stage Your Changes

Open a terminal in your project directory and run:

```bash
# Navigate to project directory
cd "c:/Skill_Street-main-v6/skill_Street-main-v5"

# Check status
git status
```

You should see these new/modified files:
- `server.cjs` (modified - bugs fixed)
- `.env.example` (new)
- `Procfile` (new)
- `RAILWAY_DEPLOYMENT.md` (new)

## Step 2: Commit Changes

```bash
# Stage all changes
git add .

# Create meaningful commit message
git commit -m "fix: fix backend server bugs and add Railway deployment config

- Fixed missing Firebase Firestore imports
- Fixed template literal in download URL endpoint
- Removed hardcoded Backblaze credentials (use env vars)
- Added .env.example with required variables
- Added Procfile for Railway deployment
- Added comprehensive deployment guide"
```

## Step 3: Push to GitHub

```bash
# Push to your repository
git push origin main
# or if your branch is different:
git push origin your-branch-name
```

## Step 4: Deploy to Railway

### Option A: Connect GitHub Repository (Recommended)

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub
5. Select your "Skill_Street-main-v6" repository
6. Choose the branch to deploy (usually `main`)
7. Railway will automatically start building

### Option B: Railway CLI

If you prefer command line:

```bash
# Install Railway CLI
npm install -g railway

# Login to Railway
railway login

# Initialize Railway project in your folder
cd "c:/Skill_Street-main-v6/skill_Street-main-v5"
railway init

# Follow prompts to create new project
# Then set environment variables:
railway variables set B2_KEY_ID=your_id
railway variables set B2_KEY_SECRET=your_secret
railway variables set B2_BUCKET_ID=your_bucket_id
railway variables set B2_BUCKET_NAME=your_bucket_name
railway variables set STRIPE_SECRET_KEY=your_stripe_key

# Deploy
railway deploy
```

## Step 5: Configure Environment Variables on Railway

### Via Web Dashboard:

1. Go to https://railway.app/dashboard
2. Select your project
3. Click "Variables" tab
4. Add each variable:

```
B2_KEY_ID = 005b615bee76ed80000000003
B2_KEY_SECRET = K005K1EPsyXa55e/T9v1fukdGuZPVzA
B2_BUCKET_ID = 6be6c1752bce5e5796ee0d18
B2_BUCKET_NAME = skillstreet-database
STRIPE_SECRET_KEY = sk_test_your_key_here
PORT = 3001
NODE_ENV = production
```

⚠️ Replace values with YOUR actual credentials

## Step 6: Verify Deployment

1. Railway will show deployment status
2. Wait for "✓ Success" message
3. Copy the Railway URL (format: `https://your-app-xxxx.railway.app`)

## Step 7: Test Your Endpoints

Test a simple endpoint:
```bash
curl https://your-app-xxxx.railway.app/health
```

Or test file upload:
```bash
curl -X POST https://your-app-xxxx.railway.app/api/upload \
  -F "file=@yourfile.pdf"
```

## Step 8: Update Your Frontend

Update your React app to use the Railway backend:

**In your `.env.production`:**
```
VITE_API_URL=https://your-app-xxxx.railway.app
```

**In your API service file:**
```javascript
const API_BASE_URL = process.env.VITE_API_URL || 'https://your-app-xxxx.railway.app';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

## Troubleshooting

### Deployment Failed?
- Check Railway logs: Dashboard → your project → Logs
- Common issues:
  - Missing environment variables
  - Incorrect `Procfile` format
  - Node version incompatibility

### Can't Connect to Backend from Frontend?
- Verify Railway URL is correct
- Check CORS settings in `server.cjs` (currently allows all origins)
- Check browser console for exact error message

### Files Not Uploading?
- Verify B2 credentials are correct
- Check Railway logs for B2 authorization errors
- Ensure B2 bucket exists and is accessible

### Payments Not Working?
- Set Firebase credentials in environment variables
- Test with Stripe test keys first (`sk_test_`)
- Check Firebase Firestore is enabled

## Getting Your Railway URL

After deployment:
1. Dashboard → Your Project
2. Look for "Domain" section
3. URL format: `https://project-name-xxxx.railway.app`
4. This is your `API_BASE_URL`

## Next Steps After Deployment

1. Test all file upload endpoints
2. Update frontend with Railway URL
3. Deploy frontend to Vercel/Netlify
4. Test end-to-end flow
5. Set up monitoring/alerts in Railway

---

**Need Help?**
- Railway Docs: https://docs.railway.app/
- GitHub Issues: Create an issue in your repo
- Discord Community: https://railway.app/discord
