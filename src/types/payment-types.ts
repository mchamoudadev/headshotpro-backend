export enum PaymentPlatform {
    STRIPE = 'STRIPE',
    EVC = 'EVC',
    ZAAD = 'ZAAD',
    SAHAL = 'SAHAL',
    EBIR = 'EBIR',
    LOCAL = 'LOCAL', // For cash/local payments that need manual approval
  }
  
  export enum PaymentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
  }
  
  export interface PaymentMetadata {
    userId?: string;
    packageId?: string;
    credits?: number;
    [key: string]: any;
  }
  
  export interface PaymentRequest {
    userId: string;
    packageId: string;
    amount: number;
    platform: PaymentPlatform;
    phone?: string;
    description?: string;
    returnUrl?: string;
    metadata?: PaymentMetadata;
  }
  
  export interface PaymentResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: any;
    sessionId?: string;
    orderId?: string;
    transactionId?: string;
    amount?: number;
    credits?: number;
    redirectUrl?: string;
    cancelUrl?: string;
    status?: PaymentStatus;
  }
  
  export interface PaymentResult {
    success: boolean;
    message?: string;
    orderId?: string;
    transactionId?: string;
    amount?: number;
    credits?: number;
    redirectUrl?: string;
    sessionId?: string;
    status?: PaymentStatus;
  }
  
  // Mobile wallet specific types
  export interface MobileWalletConfig {
    merchantUid: string;
    apiKey: string;
    apiUserId: string;
    apiEndpoint: string;
  }
  
  export interface MobileWalletPayload {
    schemaVersion: string;
    requestId: string;
    timestamp: number;
    channelName: string;
    serviceName: string;
    serviceParams: {
      merchantUid: string;
      paymentMethod: string;
      apiKey: string;
      apiUserId: string;
      payerInfo: {
        accountNo: string;
      };
      transactionInfo: {
        invoiceId: string;
        referenceId: string;
        amount: number;
        currency: string;
        description: string;
        platform?: string;
      };
    };
  }
  
  export interface MobileWalletResponse {
    responseCode: string;
    responseMsg: string;
    transactionId?: string;
    referenceId?: string;
    timestamp?: string;
  }
  
  // Stripe specific types
  export interface StripePaymentConfig {
    secretKey: string;
    publicKey: string;
    webhookSecret: string;
  }
  
  export interface StripePaymentResponse {
    status: string;
    sessionId: string;
    paymentIntentId?: string;
    clientSecret?: string;
    redirectUrl?: string;
  }
  
  export interface PaymentProcessor {
    processPayment(request: PaymentRequest): Promise<PaymentResponse>;
    verifyPayment(orderId: string): Promise<PaymentResponse>;
  }
  