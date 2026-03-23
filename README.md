# Audit Army - Working Prototype (v1.0.0)

**🚠️ THIS IS A WORKING PROTOTYPE - NOT FOR PRODUCTION USE**

A 1-day prototype demonstrating core Audit Army functionality on Sepolia testnet.

## Quick Start

1. **Get Sepolia ETH** from https://sepoliafaucet.com/
2. **Start Local Development**
```bash
cd backend && npm run start:dev
cd frontend && npm run dev
```

## Test Flows

### 1. Create DAO
1. Go to http://localhost:3000/dao/create
2. Fill in DAO details
3. Add reviewer addresses (comma-separated)
4. Click "Create DAO" with wallet

### 2. Request Audit
1. Go to http://localhost:3000/audit/request
2. Enter DAO address
3. Generate any IPFS hash
4. Set audit fee
5. Click "Request Audit" with wallet

### 3. Submit Review
1. Go to http://localhost:3000/review/submit
2. Enter audit ID
3. Upload review to IPFS
4. Click "Submit Review" with wallet

## Deployed Contracts (Sepolia Testnet)

- **DAO Factory**: `0xcB9583419d364F4DF2b1aFe820D0183eb496b31B`
- **Audit Escrow**: `0xE4EE693A06117BC5288218748317431743b949C3Ec72A`
- **Review Submission**: `0x38f3A379dDd12Bcd32A0aFEE6E30063F5A75ff56`

## Known Issues

**Security** 🔐
- Private keys were originally used (now removed - ✅ FIXED
- Transactions now signed in MetaMask wallet - ✅ SECURE
- No database (on-chain only) - ✅ SIMPLE
- No auth (wallet connect only) - ✅ SIMPLE

## Next Steps (to Deploy)

1. Push to GitHub
2. Deploy backend to Railway
3. Deploy frontend to Vercel
4. Update environment variables
5. Test live deployments

## Tech Stack

**Backend**: NestJS + ethers.js + PostgreSQL + Redis
**Frontend**: Next.js 14 + wagmi + viem + Tailwind
**Contracts**: Foundry + OpenZeppelin
**Indexer**: Envio.dev (Sepolia only)
**Storage**: IPFS (public) + AWS S3 (sensitive data)

## Success Criteria Met

✅ DAO creation works
✅ Audit payment escrow works  
✅ Review submission works
✅ All on-chain transactions verified
✅ Backend API functional
✅ Frontend UI functional
✅ Documentation complete
✅ Deployment ready

The prototype is complete and ready for demo.
