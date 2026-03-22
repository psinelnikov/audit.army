# Deployment Guide - Audit Army Prototype

## Prerequisites

### Required Accounts
- **Railway**: https://railway.app/ (free tier)
- **Vercel**: https://vercel.com/ (free tier)
- **GitHub**: Repository with code

### Environment Variables

### Backend (Railway)
```
NODE_ENV=production
PORT=3001
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/_a4qIViBtTGOv6B-6V8G7
DAO_FACTORY_ADDRESS=0xcB9583419d364F4DF2b1aFe820D0183eb496b31B
AUDIT_ESCROW_ADDRESS=0xE4EE693A06117BC52882187431743b949C3Ec72A
REVIEW_SUBMISSION_ADDRESS=0x38f3A379dDd12Bcd32A0aFEE6E30063F5A75ff56
VOTING_ADDRESS=0xe1E69cE2B2535F4889F2fEC0A853AEE26884329A
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=<Railway-Backend-URL>
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/_a4qIViBtTGOv6B-6V8G7
NEXT_PUBLIC_DAO_FACTORY_ADDRESS=0xcB9583419d364F4DF2b1aFe820D0183eb496b31B
NEXT_PUBLIC_AUDIT_ESCROW_ADDRESS=0xE4EE693A06117BC52882187431743b949C3Ec72A
NEXT_PUBLIC_REVIEW_SUBMISSION_ADDRESS=0x38f3A379dDd12Bcd32A0aFEE6E30063F5A75ff56
NEXT_PUBLIC_VOTING_ADDRESS=0xe1E69cE2B2535F4889F2fEC0A853AEE26884329A
```

## Step 1: Deploy Backend to Railway

1. **Log in to Railway**
   - Go to https://railway.app/
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Click "Deploy from GitHub repo"

3. **Configure Deployment**
   - Select your GitHub repository
   - Set "Root Directory" to `backend`
   - Railway will auto-detect NestJS project

4. **Set Environment Variables**
   - Click "Variables" tab
   - Add all backend environment variables listed above
   - Click "Add Variable" for each one

5. **Deploy**
   - Click "Deploy"
   - Wait ~2-3 minutes for deployment

6. **Get Backend URL**
   - Railway will provide a URL like: `https://audit-army-backend-production.up.railway.app`
   - Copy this URL for frontend deployment

## Step 2: Deploy Frontend to Vercel

1. **Log in to Vercel**
   - Go to https://vercel.com/
   - Sign in with GitHub

2. **Add New Project**
   - Click "Add New Project"
   - Select your GitHub repository

3. **Configure Deployment**
   - Set "Root Directory" to `frontend`
   - Keep all other settings as defaults

4. **Set Environment Variables**
   - Scroll to "Environment Variables" section
   - Add `NEXT_PUBLIC_API_URL` = <Your Railway Backend URL>
   - Add all other frontend environment variables listed above
   - Click "Add" for each variable

5. **Deploy**
   - Click "Deploy"
   - Wait ~2-3 minutes for build and deployment

6. **Get Frontend URL**
   - Vercel will provide a URL like: `https://audit-army-prototype.vercel.app`

## Step 3: Verify Deployment

### Test Backend
```bash
curl https://<railway-backend-url>/api/dao/count
```

Expected response:
```json
{"success":true,"data":{"count":0}}
```

### Test Frontend
- Open the Vercel URL in your browser
- Should see the landing page
- Try connecting wallet (must have MetaMask + Sepolia network configured)

### Test Full Flow
1. **Create DAO**
   - Go to `/dao/create`
   - Fill in form details
   - Use a wallet with Sepolia ETH
   - Submit transaction

2. **Request Audit**
   - Go to `/audit/request`
   - Enter DAO address from step 1
   - Enter any IPFS hash (for testing)
   - Set audit fee (e.g., 0.01 ETH)
   - Submit transaction

3. **Submit Review**
   - Go to `/review/submit`
   - Enter audit ID from step 2
   - Enter any IPFS hash (for testing)
   - Submit transaction

## Troubleshooting

### Backend Issues
**Problem**: Health check failing
**Solution**: Check environment variables, ensure all are set correctly

**Problem**: RPC connection errors
**Solution**: Verify Alchemy API key is correct

### Frontend Issues
**Problem**: Build failures
**Solution**: Check `NEXT_PUBLIC_API_URL` is correct

**Problem**: API calls failing
**Solution**: Check CORS is enabled in backend (it should be by default)

### Contract Issues
**Problem**: Transaction reverted
**Solution**: Check you have enough Sepolia ETH for gas + fees

**Problem**: Invalid address
**Solution**: Verify contract addresses are correct in environment variables

## Monitoring

### Railway Monitoring
- View logs in Railway dashboard
- Check metrics tab for performance
- Set up alerts for downtime

### Vercel Monitoring
- View deployment logs in Vercel dashboard
- Check Analytics for traffic
- Set up error tracking with Sentry (optional)

## Next Steps After Deployment

1. **Test all flows** with real users
2. **Monitor gas costs** on Sepolia
3. **Collect feedback** on usability
4. **Plan next iteration** based on feedback

## Rollback Plan

If something goes wrong:
1. **Rollback Railway**: Redeploy previous commit from GitHub
2. **Rollback Vercel**: Redeploy previous commit from GitHub
3. **Revert Contracts**: Contracts are immutable, cannot rollback (accept this risk)

## Cost Estimate (Free Tier)

### Railway
- Free tier: $0/month
- 512MB RAM, 0.5 vCPU
- Sufficient for prototype

### Vercel
- Free tier: $0/month
- 100GB bandwidth/month
- 6,000 minutes build time/month
- Sufficient for prototype

### Sepolia Network
- Testnet ETH: Free
- Gas fees: Paid in testnet ETH (negligible)

**Total Monthly Cost: $0** (free tiers)
