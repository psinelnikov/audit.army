const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PrepareDAOResponse {
  success: boolean;
  data: {
    to: string;
    data: string;
    from: string;
    value: string;
    gasLimit: string;
  };
  error?: string;
}

interface PrepareAuditResponse {
  success: boolean;
  data: {
    to: string;
    data: string;
    from: string;
    value: string;
    gasLimit: string;
  };
  error?: string;
}

interface PrepareReviewResponse {
  success: boolean;
  data: {
    to: string;
    data: string;
    from: string;
    value: string;
  };
  error?: string;
}

export async function prepareCreateDAO(data: {
  name: string;
  symbol: string;
  initialReviewers: string[];
  description: string;
  walletAddress: string;
}): Promise<PrepareDAOResponse> {
  const response = await fetch(`${API_URL}/api/dao/prepare-transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function prepareCreateAudit(data: {
  daoAddress: string;
  ipfsHash: string;
  amount: string;
  walletAddress: string;
}): Promise<PrepareAuditResponse> {
  const response = await fetch(`${API_URL}/api/audit/prepare-transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function prepareSubmitReview(data: {
  auditId: string;
  ipfsHash: string;
  walletAddress: string;
}): Promise<PrepareReviewResponse> {
  const response = await fetch(`${API_URL}/api/review/prepare-transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getWalletAddress() {
  const response = await fetch(`${API_URL}/api/wallet/address`);
  return response.json();
}

export async function switchNetwork() {
  const response = await fetch(`${API_URL}/api/wallet/switch-network`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return response.json();
}
