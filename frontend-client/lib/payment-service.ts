export type PaymentMethod = 'sol' | 'usdc' | 'usdt' | 'fiat';

export interface PaymentRequest {
  amount: bigint;
  method: PaymentMethod;
  currency?: string; // For fiat: NGN, KES, etc.
  recipient: string;
  jobId: string;
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: bigint;
  method: PaymentMethod;
  transactionHash?: string;
}

export async function createPayment(request: PaymentRequest): Promise<PaymentStatus> {
  const response = await fetch('/api/payments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error('Payment creation failed');
  }
  
  return response.json();
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
  const response = await fetch(`/api/payments/${paymentId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch payment status');
  }
  
  return response.json();
}

export async function releaseEscrow(jobId: string): Promise<void> {
  const response = await fetch('/api/payments/release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  });
  
  if (!response.ok) {
    throw new Error('Escrow release failed');
  }
}

export async function refundEscrow(jobId: string): Promise<void> {
  const response = await fetch('/api/payments/refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  });
  
  if (!response.ok) {
    throw new Error('Escrow refund failed');
  }
}
