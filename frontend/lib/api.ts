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

interface UploadDocumentResponse {
  success: boolean;
  data: {
    filename: string;
    documentUrl: string;
    ipfsHash: string;
    size: number;
    mimetype: string;
  };
  error?: string;
}

interface SearchDAOsResponse {
  success: boolean;
  data: {
    daos: Array<{
      id: number;
      name: string;
      symbol: string;
      description: string;
      contractAddress: string;
      creatorWallet: string;
      createdAt: string;
      logoUrl?: string;
    }>;
  };
  error?: string;
}

interface DAOStatsResponse {
  success: boolean;
  data: {
    total: number;
    thisMonth: number;
    thisWeek: number;
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

export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/review/upload-document`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function searchDAOs(search?: string): Promise<SearchDAOsResponse> {
  const url = search 
    ? `${API_URL}/api/dao/search?search=${encodeURIComponent(search)}`
    : `${API_URL}/api/dao/search`;
  
  const response = await fetch(url);
  return response.json();
}

export async function getDAOStats(): Promise<DAOStatsResponse> {
  const response = await fetch(`${API_URL}/api/dao/stats`);
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

export async function getAuditsByDAO(daoAddress: string) {
  const response = await fetch(`${API_URL}/api/audit/dao/${encodeURIComponent(daoAddress)}`);
  return response.json();
}

export async function checkDAOReviewer(daoAddress: string, userAddress: string) {
  const response = await fetch(`${API_URL}/api/audit/dao/${encodeURIComponent(daoAddress)}/check-reviewer/${encodeURIComponent(userAddress)}`);
  return response.json();
}
