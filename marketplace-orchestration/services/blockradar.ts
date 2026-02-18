import axios, { AxiosInstance } from 'axios';

export interface BlockradarConfig {
  apiKey: string;
  apiUrl: string;
  webhookSecret?: string;
}

export interface CreateVirtualAccountRequest {
  currency: string; // USDC, USDT
  network: string; // solana, ethereum, polygon, etc.
  label?: string;
  metadata?: Record<string, any>;
}

export interface VirtualAccountResponse {
  accountId: string;
  address: string;
  currency: string;
  network: string;
  balance: number;
  createdAt: string;
}

export interface ProcessPaymentRequest {
  fromAccount: string;
  toAddress: string;
  amount: number;
  currency: string;
  network: string;
  memo?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  paymentId: string;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  amount: number;
  currency: string;
  network: string;
  fee: number;
  createdAt: string;
}

export interface AutoSettlementConfig {
  sourceAccount: string;
  destinationAddress: string;
  currency: string;
  network: string;
  minAmount: number;
  schedule?: 'immediate' | 'hourly' | 'daily';
}

export interface WebhookPayload {
  event: 'payment.received' | 'payment.sent' | 'payment.confirmed' | 'payment.failed';
  accountId: string;
  paymentId: string;
  timestamp: string;
  data: PaymentResponse;
}

export class BlockradarService {
  private client: AxiosInstance;
  private config: BlockradarConfig;

  constructor(config: BlockradarConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async createVirtualAccount(request: CreateVirtualAccountRequest): Promise<VirtualAccountResponse> {
    try {
      console.log('Creating Blockradar virtual account:', request);
      
      const response = await this.client.post<VirtualAccountResponse>('/accounts', {
        currency: request.currency,
        network: request.network,
        label: request.label || 'Flux Escrow Account',
        metadata: {
          ...request.metadata,
          source: 'flux-marketplace',
          timestamp: new Date().toISOString(),
        },
      });

      console.log('Virtual account created:', response.data.accountId);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create virtual account:', error);
      throw new Error(`Virtual account creation failed: ${error.message}`);
    }
  }

  async getAccountBalance(accountId: string): Promise<number> {
    try {
      const response = await this.client.get<VirtualAccountResponse>(`/accounts/${accountId}`);
      return response.data.balance;
    } catch (error: any) {
      console.error(`Failed to get balance for ${accountId}:`, error);
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  async processPayment(request: ProcessPaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('Processing Blockradar payment:', request);
      
      const response = await this.client.post<PaymentResponse>('/payments', {
        from: request.fromAccount,
        to: request.toAddress,
        amount: request.amount,
        currency: request.currency,
        network: request.network,
        memo: request.memo,
        metadata: {
          ...request.metadata,
          source: 'flux-marketplace',
          timestamp: new Date().toISOString(),
        },
      });

      console.log('Payment processed:', response.data.paymentId);
      return response.data;
    } catch (error: any) {
      console.error('Failed to process payment:', error);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await this.client.get<PaymentResponse>(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get payment status for ${paymentId}:`, error);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async setupAutoSettlement(config: AutoSettlementConfig): Promise<void> {
    try {
      console.log('Setting up auto-settlement:', config);
      
      await this.client.post('/auto-settlements', {
        source_account: config.sourceAccount,
        destination_address: config.destinationAddress,
        currency: config.currency,
        network: config.network,
        min_amount: config.minAmount,
        schedule: config.schedule || 'immediate',
      });

      console.log('Auto-settlement configured');
    } catch (error: any) {
      console.error('Failed to setup auto-settlement:', error);
      throw new Error(`Auto-settlement setup failed: ${error.message}`);
    }
  }

  async createPaymentLink(
    amount: number,
    currency: string,
    network: string,
    description?: string
  ): Promise<string> {
    try {
      const response = await this.client.post<{ link: string }>('/payment-links', {
        amount,
        currency,
        network,
        description: description || 'Flux GPU Rental Payment',
        metadata: {
          source: 'flux-marketplace',
        },
      });

      return response.data.link;
    } catch (error: any) {
      console.error('Failed to create payment link:', error);
      throw new Error(`Payment link creation failed: ${error.message}`);
    }
  }

  async swapCurrency(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
    network: string
  ): Promise<PaymentResponse> {
    try {
      console.log(`Swapping ${amount} ${fromCurrency} to ${toCurrency}`);
      
      const response = await this.client.post<PaymentResponse>('/swap', {
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount,
        network,
      });

      console.log('Swap completed:', response.data.paymentId);
      return response.data;
    } catch (error: any) {
      console.error('Failed to swap currency:', error);
      throw new Error(`Currency swap failed: ${error.message}`);
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('Webhook secret not configured, skipping verification');
      return true;
    }

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    console.log('Processing Blockradar webhook:', payload.event, payload.paymentId);

    switch (payload.event) {
      case 'payment.received':
        await this.onPaymentReceived(payload.data);
        break;
      case 'payment.sent':
        await this.onPaymentSent(payload.data);
        break;
      case 'payment.confirmed':
        await this.onPaymentConfirmed(payload.data);
        break;
      case 'payment.failed':
        await this.onPaymentFailed(payload.data);
        break;
      default:
        console.warn('Unknown webhook event:', payload.event);
    }
  }

  private async onPaymentReceived(payment: PaymentResponse): Promise<void> {
    console.log(`Payment ${payment.paymentId} received: ${payment.amount} ${payment.currency}`);
  }

  private async onPaymentSent(payment: PaymentResponse): Promise<void> {
    console.log(`Payment ${payment.paymentId} sent: ${payment.amount} ${payment.currency}`);
  }

  private async onPaymentConfirmed(payment: PaymentResponse): Promise<void> {
    console.log(`Payment ${payment.paymentId} confirmed on ${payment.network}`);
    console.log(`Transaction hash: ${payment.transactionHash}`);
  }

  private async onPaymentFailed(payment: PaymentResponse): Promise<void> {
    console.error(`Payment ${payment.paymentId} failed`);
  }

  async processEscrowDeposit(
    clientAddress: string,
    jobId: string,
    amount: number,
    currency: string = 'USDC',
    network: string = 'solana'
  ): Promise<VirtualAccountResponse> {
    console.log(`Creating escrow account for job ${jobId}`);
    
    const escrowAccount = await this.createVirtualAccount({
      currency,
      network,
      label: `Escrow - Job ${jobId}`,
      metadata: {
        jobId,
        clientAddress,
        type: 'escrow',
      },
    });

    console.log(`Escrow account created: ${escrowAccount.address}`);
    return escrowAccount;
  }

  async releaseEscrowToProvider(
    escrowAccountId: string,
    providerAddress: string,
    amount: number,
    currency: string = 'USDC',
    network: string = 'solana'
  ): Promise<PaymentResponse> {
    console.log(`Releasing ${amount} ${currency} to provider ${providerAddress}`);
    
    const payment = await this.processPayment({
      fromAccount: escrowAccountId,
      toAddress: providerAddress,
      amount,
      currency,
      network,
      memo: 'Job completion payment',
      metadata: {
        type: 'escrow_release',
        providerAddress,
      },
    });

    return payment;
  }

  async refundEscrowToClient(
    escrowAccountId: string,
    clientAddress: string,
    amount: number,
    currency: string = 'USDC',
    network: string = 'solana'
  ): Promise<PaymentResponse> {
    console.log(`Refunding ${amount} ${currency} to client ${clientAddress}`);
    
    const payment = await this.processPayment({
      fromAccount: escrowAccountId,
      toAddress: clientAddress,
      amount,
      currency,
      network,
      memo: 'Job cancellation refund',
      metadata: {
        type: 'escrow_refund',
        clientAddress,
      },
    });

    return payment;
  }
}

export function createBlockradarService(): BlockradarService {
  const config: BlockradarConfig = {
    apiKey: process.env.BLOCKRADAR_API_KEY || '',
    apiUrl: process.env.BLOCKRADAR_API_URL || 'https://api.blockradar.co/v1',
    webhookSecret: process.env.BLOCKRADAR_WEBHOOK_SECRET,
  };

  if (!config.apiKey) {
    throw new Error('BLOCKRADAR_API_KEY environment variable is required');
  }

  return new BlockradarService(config);
}
