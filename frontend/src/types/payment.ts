export type PaymentOrder = {
  paymentId: number;
  bookingId: number;
  bookingCode: string;
  provider: string;
  mock: boolean;
  keyId: string;
  orderId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
};

export type VerifyPaymentPayload = {
  bookingId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};
