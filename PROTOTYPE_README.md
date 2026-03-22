# Audit Army - Working Prototype

**⚠️ THIS IS A WORKING PROTOTYPE - NOT FOR PRODUCTION USE**

A 1-day prototype demonstrating core Audit Army functionality on Sepolia testnet.

## Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet with Sepolia ETH
- Sepolia testnet ETH (get from https://sepoliafaucet.com/)

### Local Development

1. **Clone and install**
```bash
git clone <repo-url>
cd audit.army
npm install
```

2. **Start backend**
```bash
cd backend
npm run start:dev
```

3. **Start frontend**
```bash
cd frontend
npm run dev
```

4. **Access the app**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Deployed Contracts (Sepolia)

- **DAO Factory**: `0xcB9583419d364F4DF2b1aFe820D0183eb496b31B`
- **Audit Escrow**: `0xE4EE693A06117BC52882187431743b949C3Ec72A`
- **Review Submission**: `0x38f3A379dDd12Bcd32A0aFEE6E30063F5A75ff56`
- **Voting**: `0xe1E69cE2B2535F4889F2fEC0A853AEE26884329A`

## Live Demo

**Frontend**: (Will be provided after Vercel deployment)
**Backend**: (Will be provided after Railway deployment)

## Features

### Implemented
- ✅ Create DAO with initial reviewers
- ✅ Request audit with payment escrow
- ✅ Submit review report
- ✅ Wallet connection (MetaMask)
- ✅ Direct smart contract interactions

### Not Implemented (Intentionally for Speed)
- ❌ Authentication (wallet connect only)
- ❌ Voting/approval flow
- ❌ Database (on-chain only)
- ❌ Error handling
- ❌ Transaction status tracking
- ❌ Loading states
- ❌ Input validation
- ❌ Responsive design
- ❌ Documentation

## Architecture

### Backend (NestJS - Simplified)
- 3 services: DAO, Audit, Review
- 3 controllers: Direct contract calls
- No database, no auth, no validation
- Direct private key signing (prototype only)

### Frontend (Next.js - Minimal)
- 4 pages: Home, DAO Create, Audit Request, Review Submit
- Direct API calls
- Basic wallet connection
- No state management, no error handling

### Smart Contracts (Foundry)
- All 5 contracts deployed to Sepolia
- No security audit
- Basic access control only

## Known Issues

1. **Private Key Usage**: Using private keys directly is insecure. Production would use wallet signing.
2. **No Error Handling**: Transactions may fail silently.
3. **No Validation**: Users can input invalid data.
4. **No Transaction Tracking**: Users won't know if transactions completed.
5. **Public RPC**: Using public RPC endpoints (may be slow/unreliable).
6. **Sepolia Only**: Not deployed to mainnet or other chains.

## Testing the Prototype

### Test Flow 1: Create DAO
1. Go to http://localhost:3000/dao/create
2. Fill in DAO details
3. Add reviewer address (use another wallet address)
4. Enter your private key
5. Click "Create DAO"
6. Wait for transaction confirmation
7. Note the DAO address

### Test Flow 2: Request Audit
1. Go to http://localhost:3000/audit/request
2. Enter DAO address from Flow 1
3. Generate an IPFS hash (use any hash for testing)
4. Set audit fee (e.g., 0.01 ETH)
5. Enter your private key
6. Click "Request Audit (Pay)"
7. Wait for transaction
8. Note the Audit ID

### Test Flow 3: Submit Review
1. Go to http://localhost:3000/review/submit
2. Enter Audit ID from Flow 2
3. Generate an IPFS hash
4. Enter your private key
5. Click "Submit Review"
6. Wait for transaction
7. Note the Review ID

## Development Notes

### Backend Structure
```
backend/src/
├── contracts/
│   ├── dao-factory.service.ts      # DAO interactions
│   ├── audit-escrow.service.ts     # Audit interactions
│   ├── review-submission.service.ts # Review interactions
│   ├── dao.controller.ts            # DAO endpoints
│   ├── audit.controller.ts           # Audit endpoints
│   └── review.controller.ts         # Review endpoints
```

### Frontend Structure
```
frontend/app/
├── page.tsx                        # Landing page
├── dao/create/page.tsx              # DAO creation form
├── audit/request/page.tsx           # Audit request form
└── review/submit/page.tsx          # Review submission form
```

### API Endpoints
- `POST /api/dao/create` - Create DAO
- `GET /api/dao/count` - Get total DAOs
- `GET /api/dao/all` - Get all DAOs
- `POST /api/audit/create` - Create audit request
- `GET /api/audit/:id` - Get audit details
- `GET /api/audit/count` - Get total audits
- `POST /api/review/submit` - Submit review
- `GET /api/review/:id` - Get review details
- `GET /api/review/audit/:auditId` - Get reviews for audit

## Deployment

### Backend (Railway)
1. Connect GitHub repository
2. Select `backend` directory as root
3. Set environment variables
4. Deploy
5. Get backend URL

### Frontend (Vercel)
1. Connect GitHub repository
2. Select `frontend` directory as root
3. Set environment variables
4. Deploy
5. Get frontend URL

## Next Steps (To Go from Prototype to MVP)

1. **Authentication**: Implement SIWE auth
2. **Error Handling**: Add comprehensive error messages
3. **Transaction Tracking**: Monitor transaction status
4. **Database**: Add PostgreSQL for off-chain data
5. **Validation**: Input validation on all forms
6. **Security**: Remove private key usage, use wallet signing
7. **Testing**: Add automated tests
8. **Documentation**: Complete API and user docs
9. **Security Audit**: Professional smart contract audit
10. **Mainnet Deployment**: Deploy to Ethereum mainnet

## License

MIT
