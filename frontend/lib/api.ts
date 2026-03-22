const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function createDAO(data: {
  name: string;
  symbol: string;
  initialReviewers: string[];
  description: string;
  privateKey: string;
}) {
  const response = await fetch(`${API_URL}/api/dao/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function createAudit(data: {
  daoAddress: string;
  ipfsHash: string;
  amount: string;
  privateKey: string;
}) {
  const response = await fetch(`${API_URL}/api/audit/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function submitReview(data: {
  auditId: string;
  ipfsHash: string;
  privateKey: string;
}) {
  const response = await fetch(`${API_URL}/api/review/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
