# AuditEscrowV2 Deployment Guide

## Overview
This guide covers the deployment of the enhanced AuditEscrowV2 contract with self-assignment capabilities.

## New Features
- ✅ **Self-Assignment**: Reviewers can claim audits directly
- ✅ **Rotation Pool**: Automatic reviewer rotation
- ✅ **Reviewer Profiles**: Track performance and eligibility
- ✅ **Eligibility Controls**: Prevent reviewer overload
- ✅ **Backward Compatibility**: Existing admin assignment still works

## Prerequisites
- Foundry installed
- Environment variables configured
- Private key with deployment permissions
- DAO Factory contract address

## Environment Variables
Create a `.env` file in the contracts directory:

```bash
# Deployment Configuration
PRIVATE_KEY=your_private_key_here
RPC_URL=https://sepolia.infura.io/v3/your_infura_key
VERIFIER_URL=https://api-sepolia.etherscan.io/api
ETHERSCAN_API_KEY=your_etherscan_api_key

# Contract Addresses
DAO_FACTORY_ADDRESS=0x... # Existing DAO Factory address
INITIAL_OWNER=0x... # Contract owner address
OLD_AUDIT_ESCROW_ADDRESS=0x... # Existing AuditEscrow address (for migration)
```

## Deployment Steps

### 1. Compile Contracts
```bash
cd contracts
forge build
```

### 2. Run Tests
```bash
forge test
```

### 3. Deploy AuditEscrowV2
```bash
forge script script/DeployAuditEscrowV2.s.sol --rpc-url $RPC_URL --broadcast --verify
```

### 4. Verify Deployment
```bash
# Check contract is deployed
cast call <new_contract_address> "auditCount()" --rpc-url $RPC_URL

# Verify on Etherscan
# Check the deployment output for verification link
```

### 5. Update Frontend Configuration
Update the frontend to use the new contract address:

```typescript
// backend/src/contracts/audit-escrow.service.ts
AUDIT_ESCROW_ADDRESS=<new_contract_address>
```

### 6. Update Backend ABI
Copy the new ABI to the backend:

```bash
cp out/AuditEscrowV2.sol/AuditEscrowV2.json ../backend/src/contracts/AuditEscrowV2.json
```

## Migration Strategy

### Option 1: Parallel Deployment (Recommended)
1. Deploy V2 alongside existing V1
2. Update frontend to use V2 for new audits
3. Existing audits continue on V1
4. Gradually migrate users to V2

### Option 2: Full Migration
1. Deploy V2
2. Update all systems to use V2
3. V1 becomes deprecated
4. Handle legacy audit access through V1

## Frontend Updates Required

### 1. Update API Endpoints
```typescript
// Add new endpoint for claimReview
export async function claimReview(data: {
  auditId: string;
  reviewerAddress: string;
}): Promise<any> {
  const response = await fetch(`${API_URL}/api/audit/claim-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

### 2. Update Backend Controller
```typescript
// Add claimReview endpoint
@Post('claim-review')
async claimReview(@Body() claimReviewDto: { auditId: string; reviewerAddress: string }) {
  try {
    const result = await this.auditEscrowService.claimReview(
      claimReviewDto.auditId,
      claimReviewDto.reviewerAddress
    );
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### 3. Update Service
```typescript
// Add claimReview method
async claimReview(auditId: string, reviewerAddress: string): Promise<any> {
  const auditIdNumber = parseInt(auditId, 10);
  const txData = await this.escrow.claimReview.populateTransaction(auditIdNumber);
  
  return {
    to: process.env.AUDIT_ESCROW_ADDRESS!,
    data: txData.data || '0x',
    from: reviewerAddress,
    value: '0x0',
    gas: '100000'
  };
}
```

## Testing the Deployment

### 1. Test Self-Assignment
```javascript
// Frontend test
const result = await claimReview({
  auditId: "1",
  reviewerAddress: "0x..."
});
console.log("Claim result:", result);
```

### 2. Test Rotation Pool
```javascript
// Test joining rotation pool
await contract.joinRotationPool(daoAddress);

// Test automatic assignment
await contract.assignNextReviewer(auditId);
```

### 3. Test Reviewer Profile
```javascript
// Check reviewer profile
const profile = await contract.getReviewerProfile(reviewerAddress);
console.log("Reviewer profile:", profile);
```

## Rollback Plan

If issues arise during deployment:

1. **Frontend**: Revert to V1 contract address
2. **Backend**: Switch back to V1 ABI
3. **Database**: No changes needed (kept separate)
4. **Users**: Clear communication about temporary issues

## Security Considerations

1. **Access Control**: Verify only DAO reviewers can claim audits
2. **Eligibility Checks**: Ensure reviewer limits are enforced
3. **Gas Optimization**: Monitor gas costs for new functions
4. **Event Monitoring**: Set up event tracking for audit claims

## Monitoring

After deployment, monitor:

1. **Claim Success Rate**: Track successful self-assignments
2. **Gas Usage**: Monitor gas costs for new functions
3. **Error Rates**: Track failed claim attempts
4. **Reviewer Activity**: Monitor reviewer participation

## Support

For deployment issues:
1. Check contract logs for detailed error messages
2. Verify environment variables are correct
3. Ensure sufficient ETH for gas fees
4. Check network connectivity

## Next Steps

After successful deployment:
1. Update documentation
2. Notify users of new features
3. Monitor system performance
4. Plan for additional features (skill-based assignment, bidding)
