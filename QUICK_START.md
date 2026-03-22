# Quick Start - Audit Army Prototype

## 1. Get Sepolia ETH
Visit: https://sepoliafaucet.com/
- Paste your wallet address
- Get testnet ETH (you'll need ~0.2 ETH for testing)

## 2. Start Local Development

### Backend (Terminal 1)
```bash
cd backend
npm install
npm run start:dev
```
Backend will run on: http://localhost:3001

### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on: http://localhost:3000

## 3. Test the Prototype

### Test 1: Create DAO
1. Open http://localhost:3000/dao/create
2. Fill in:
   - DAO Name: "Test Crypto DAO"
   - DAO Symbol: "TCD"
   - Description: "A test DAO"
   - Initial Reviewers: "0x..." (any Sepolia address)
   - Private Key: Your wallet's private key
3. Click "Create DAO"
4. Wait for transaction (~30 seconds)
5. Copy the DAO address that appears

### Test 2: Request Audit
1. Open http://localhost:3000/audit/request
2. Fill in:
   - DAO Address: Paste address from Test 1
   - IPFS Hash: "QmTest123" (any hash for testing)
   - Amount: "0.01" (0.01 ETH)
   - Private Key: Your wallet's private key
3. Click "Request Audit (Pay)"
4. Wait for transaction (~30 seconds)
5. Copy the Audit ID that appears

### Test 3: Submit Review
1. Open http://localhost:3000/review/submit
2. Fill in:
   - Audit ID: Paste ID from Test 2
   - IPFS Hash: "QmReview456" (any hash for testing)
   - Private Key: Your wallet's private key
3. Click "Submit Review"
4. Wait for transaction (~30 seconds)

## 4. Verify on Sepolia

Visit: https://sepolia.etherscan.io/
- Search for your wallet address
- You should see all your transactions
- Verify contract addresses:
  - 0xcB9583419d364F4DF2b1aFe820D0183eb496b31B
  - 0xE4EE693A06117BC52882187431743b949C3Ec72A
  - 0x38f3A379dDd12Bcd32A0aFEE6E30063F5A75ff56
  - 0xe1E69cE2B2535F4889F2fEC0A853AEE26884329A

## Common Issues

**Problem: "Transaction underpriced"**
Solution: Wait a few seconds and try again, or increase gas price

**Problem: "Insufficient funds"**
Solution: Get more Sepolia ETH from faucet

**Problem: "Connection failed"**
Solution: Check backend is running (http://localhost:3001)

**Problem: "RPC error"**
Solution: Sepolia RPC may be busy, try again in 30 seconds

## What You Built

✅ Working prototype in ~8 hours
✅ 5 smart contracts deployed to Sepolia
✅ Backend API with 3 endpoints
✅ Frontend with 4 functional pages
✅ Direct blockchain integration
✅ Basic wallet connection

## What's Missing (Intentionally)

❌ Security (private keys, unaudited contracts)
❌ Error handling (silent failures)
❌ Database (on-chain only)
❌ Authentication (wallet connect only)
❌ Transaction tracking (no status updates)
❌ Testing (manual only)
❌ Documentation (this file only)

## Next Steps to Deploy

1. **Push to GitHub** (if not already)
2. **Deploy Backend to Railway**: Follow DEPLOYMENT_GUIDE.md
3. **Deploy Frontend to Vercel**: Follow DEPLOYMENT_GUIDE.md
4. **Test Live Deployment**: Use deployed URLs
5. **Share Prototype**: Provide URLs for demo

## Need Help?

- Backend logs: Check backend terminal
- Frontend logs: Check frontend terminal
- Browser console: Check F12 for errors
- Documentation: See PROTOTYPE_README.md for details

## Production Upgrade Path

To turn this prototype into production:

1. **Security Audit**: Professional smart contract audit (2-4 weeks)
2. **Authentication**: Implement SIWE auth (1 week)
3. **Error Handling**: Comprehensive error messages (1 week)
4. **Database**: Add PostgreSQL for off-chain data (1 week)
5. **Validation**: Input validation on all forms (3 days)
6. **Testing**: Automated test suite (1 week)
7. **Mainnet Deployment**: Deploy to Ethereum (1 day)
8. **Monitoring**: Add error tracking, analytics (3 days)

**Total: ~6-8 weeks** to production-ready MVP
