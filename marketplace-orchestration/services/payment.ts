import { PaycrestService, CreateOrderResponse } from './paycrest';
import { BlockradarService, VirtualAccountResponse, PaymentResponse } from './blockradar';

export type PaymentMethod = 'crypto' | 'fiat';
export type PaymentProvider = 'blockradar' | 'paycrest';

export interface UnifiedPaymentRequest {
  method: PaymentMethod;
  amount: number;
  currency: string;
  fromAddress: string;
  toAddress: string;
  metadata?: Record<string, any>;
}

export interface UnifiedPaymentResponse {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  currency: string;
  provider: PaymentProvider;
  transactionHash?: string;
  orderId?: string;
  createdAt: string;
}

export interface PaymentStatusResponse {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: PaymentProvider;
  details: any;
}

export class UnifiedPaymentService {
  private paycrest: PaycrestService;
  private blockradar: BlockradarService;

  constructor(paycrest: PaycrestService, blockradar: BlockradarService) {
    this.paycrest = paycrest;
    this.blockradar = blockradar;
  }

  async processPayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    console.log('Processing unified payment:', request);

    if (request.method === 'fiat') {
      return this.processFiatPayment(request);
    } else {
      return this.processCryptoPayment(request);
    }
  }

  private async processCryptoPayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    console.log('Processing crypto payment via Blockradar');

    const payment = await this.blockradar.processPayment({
      fromAccount: request.fromAddress,
      toAddress: request.toAddress,
      amount: request.amount,
      currency: request.currency,
      network: 'solana',
      metadata: request.metadata,
    });

    return {
      paymentId: payment.paymentId,
      status: payment.status === 'confirmed' ? 'completed' : payment.status,
      amount: payment.amount,
      currency: payment.currency,
      provider: 'blockradar',
      transactionHash: payment.transactionHash,
      createdAt: payment.createdAt,
    };
  }

  private async processFiatPayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    console.log('Processing fiat payment via Paycrest');

    const order = await this.paycrest.createOrder({
      amount: request.amount,
      currency: request.currency,
      stablecoin: 'USDC',
      recipientName: request.metadata?.recipientName || 'Provider',
      recipientAccount: request.toAddress,
      recipientBank: request.metadata?.recipientBank,
      metadata: request.metadata,
    });

    return {
      paymentId: order.orderId,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      provider: 'paycrest',
      orderId: order.orderId,
      createdAt: order.createdAt,
    };
  }

  async getPaymentStatus(paymentId: string, provider: PaymentProvider): Promise<PaymentStatusResponse> {
    console.log(`Getting payment status for ${paymentId} from ${provider}`);

    if (provider === 'paycrest') {
      const status = await this.paycrest.getOrderStatus(paymentId);
      return {
        paymentId,
        status: status.status === 'cancelled' ? 'failed' : status.status,
        provider: 'paycrest',
        details: status,
      };
    } else {
      const status = await this.blockradar.getPaymentStatus(paymentId);
      return {
        paymentId,
        status: status.status === 'confirmed' ? 'completed' : status.status,
        provider: 'blockradar',
        details: status,
      };
    }
  }

  async createEscrowAccount(jobId: string, clientAddress: string): Promise<VirtualAccountResponse> {
    console.log(`Creating escrow account for job ${jobId}`);
    
    return this.blockradar.processEscrowDeposit(
      clientAddress,
      jobId,
      0,
      'USDC',
      'solana'
    );
  }

  async releaseEscrowPayment(
    escrowAccountId: string,
    providerAddress: string,
    amount: number,
    paymentMethod: PaymentMethod,
    recipientDetails?: {
      name: string;
      account: string;
      bank?: string;
      currency: string;
    }
  ): Promise<UnifiedPaymentResponse> {
    console.log(`Releasing escrow payment: ${amount} to ${providerAddress}`);

    if (paymentMethod === 'crypto') {
      const payment = await this.blockradar.releaseEscrowToProvider(
        escrowAccountId,
        providerAddress,
        amount,
        'USDC',
        'solana'
      );

      return {
        paymentId: payment.paymentId,
        status: payment.status === 'confirmed' ? 'completed' : payment.status,
        amount: payment.amount,
        currency: payment.currency,
        provider: 'blockradar',
        transactionHash: payment.transactionHash,
        createdAt: payment.createdAt,
      };
    } else {
      if (!recipientDetails) {
        throw new Error('Recipient details required for fiat payment');
      }

      const order = await this.paycrest.processProviderPayout(
        providerAddress,
        amount,
        'USDC',
        recipientDetails
      );

      return {
        paymentId: order.orderId,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        provider: 'paycrest',
        orderId: order.orderId,
        createdAt: order.createdAt,
      };
    }
  }

  async refundEscrowPayment(
    escrowAccountId: string,
    clientAddress: string,
    amount: number
  ): Promise<UnifiedPaymentResponse> {
    console.log(`Refunding escrow payment: ${amount} to ${clientAddress}`);

    const payment = await this.blockradar.refundEscrowToClient(
      escrowAccountId,
      clientAddress,
      amount,
      'USDC',
      'solana'
    );

    return {
      paymentId: payment.paymentId,
      status: payment.status === 'confirmed' ? 'completed' : payment.status,
      amount: payment.amount,
      currency: payment.currency,
      provider: 'blockradar',
      transactionHash: payment.transactionHash,
      createdAt: payment.createdAt,
    };
  }

  async retryFailedPayment(paymentId: string, provider: PaymentProvider): Promise<UnifiedPaymentResponse> {
    console.log(`Retrying failed payment ${paymentId} on ${provider}`);
    
    throw new Error('Retry logic not yet implemented');
  }

  async getPaymentAnalytics(startDate: Date, endDate: Date): Promise<any> {
    console.log(`Getting payment analytics from ${startDate} to ${endDate}`);
    
    return {
      totalPayments: 0,
      totalVolume: 0,
      successRate: 0,
      averageAmount: 0,
      byProvider: {
        blockradar: { count: 0, volume: 0 },
        paycrest: { count: 0, volume: 0 },
      },
    };
  }
}

export function createUnifiedPaymentService(
  paycrest: PaycrestService,
  blockradar: BlockradarService
): UnifiedPaymentService {
  return new UnifiedPaymentService(paycrest, blockradar);
}
