import axios, { AxiosInstance } from 'axios';

export interface PaycrestConfig {
  apiKey: string;
  apiUrl: string;
  webhookSecret?: string;
}

export interface CreateOrderRequest {
  amount: number;
  currency: string; // Fiat currency (NGN, KES, UGX, INR, BRL, etc.)
  stablecoin: string; // USDT, USDC, CUSD, CNGN
  recipientName: string;
  recipientAccount: string;
  recipientBank?: string;
  metadata?: Record<string, any>;
}

export interface CreateOrderResponse {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  currency: string;
  stablecoin: string;
  stablecoinAmount: number;
  exchangeRate: number;
  fees: number;
  recipientDetails: {
    name: string;
    account: string;
    bank?: string;
  };
  createdAt: string;
  expiresAt: string;
}

export interface OrderStatusResponse {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  stablecoinAmount: number;
  transactionHash?: string;
  completedAt?: string;
  failureReason?: string;
}

export interface WebhookPayload {
  event: 'order.created' | 'order.processing' | 'order.completed' | 'order.failed';
  orderId: string;
  status: string;
  timestamp: string;
  data: OrderStatusResponse;
}

export class PaycrestService {
  private client: AxiosInstance;
  private config: PaycrestConfig;

  constructor(config: PaycrestConfig) {
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

  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      console.log('Creating Paycrest order:', request);
      
      const response = await this.client.post<CreateOrderResponse>('/orders', {
        amount: request.amount,
        currency: request.currency,
        stablecoin: request.stablecoin,
        recipient: {
          name: request.recipientName,
          account: request.recipientAccount,
          bank: request.recipientBank,
        },
        metadata: {
          ...request.metadata,
          source: 'flux-marketplace',
          timestamp: new Date().toISOString(),
        },
      });

      console.log('Paycrest order created:', response.data.orderId);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create Paycrest order:', error);
      throw new Error(`Paycrest order creation failed: ${error.message}`);
    }
  }

  async getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    try {
      const response = await this.client.get<OrderStatusResponse>(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get order status for ${orderId}:`, error);
      throw new Error(`Failed to get order status: ${error.message}`);
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    try {
      await this.client.post(`/orders/${orderId}/cancel`);
      console.log(`Order ${orderId} cancelled`);
    } catch (error: any) {
      console.error(`Failed to cancel order ${orderId}:`, error);
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  async listSupportedCurrencies(): Promise<string[]> {
    try {
      const response = await this.client.get<{ currencies: string[] }>('/currencies');
      return response.data.currencies;
    } catch (error) {
      console.error('Failed to list supported currencies:', error);
      return ['NGN', 'KES', 'UGX', 'TZS', 'GHS', 'INR', 'BRL'];
    }
  }

  async getExchangeRate(stablecoin: string, fiatCurrency: string): Promise<number> {
    try {
      const response = await this.client.get<{ rate: number }>('/rates', {
        params: { from: stablecoin, to: fiatCurrency },
      });
      return response.data.rate;
    } catch (error: any) {
      console.error('Failed to get exchange rate:', error);
      throw new Error(`Failed to get exchange rate: ${error.message}`);
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
    console.log('Processing Paycrest webhook:', payload.event, payload.orderId);

    switch (payload.event) {
      case 'order.created':
        await this.onOrderCreated(payload.data);
        break;
      case 'order.processing':
        await this.onOrderProcessing(payload.data);
        break;
      case 'order.completed':
        await this.onOrderCompleted(payload.data);
        break;
      case 'order.failed':
        await this.onOrderFailed(payload.data);
        break;
      default:
        console.warn('Unknown webhook event:', payload.event);
    }
  }

  private async onOrderCreated(order: OrderStatusResponse): Promise<void> {
    console.log(`Order ${order.orderId} created, awaiting processing`);
  }

  private async onOrderProcessing(order: OrderStatusResponse): Promise<void> {
    console.log(`Order ${order.orderId} is being processed`);
  }

  private async onOrderCompleted(order: OrderStatusResponse): Promise<void> {
    console.log(`Order ${order.orderId} completed successfully`);
    console.log(`Transaction hash: ${order.transactionHash}`);
  }

  private async onOrderFailed(order: OrderStatusResponse): Promise<void> {
    console.error(`Order ${order.orderId} failed: ${order.failureReason}`);
  }

  async processProviderPayout(
    providerAddress: string,
    amount: number,
    stablecoin: string,
    recipientDetails: {
      name: string;
      account: string;
      bank?: string;
      currency: string;
    }
  ): Promise<CreateOrderResponse> {
    console.log(`Processing payout for provider ${providerAddress}`);
    
    const order = await this.createOrder({
      amount,
      currency: recipientDetails.currency,
      stablecoin,
      recipientName: recipientDetails.name,
      recipientAccount: recipientDetails.account,
      recipientBank: recipientDetails.bank,
      metadata: {
        providerAddress,
        payoutType: 'job_completion',
      },
    });

    return order;
  }
}

export function createPaycrestService(): PaycrestService {
  const config: PaycrestConfig = {
    apiKey: process.env.PAYCREST_API_KEY || '',
    apiUrl: process.env.PAYCREST_API_URL || 'https://api.paycrest.io/v1',
    webhookSecret: process.env.PAYCREST_WEBHOOK_SECRET,
  };

  if (!config.apiKey) {
    throw new Error('PAYCREST_API_KEY environment variable is required');
  }

  return new PaycrestService(config);
}
