import type { PaymentOrder } from "@/types/payment";

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler: (response: RazorpaySuccess) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: { color?: string };
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(
  order: PaymentOrder,
  onSuccess: (response: RazorpaySuccess) => void,
  onDismiss?: () => void,
): Promise<void> {
  const ok = await loadRazorpayScript();
  if (!ok || !window.Razorpay) {
    throw new Error("Could not load Razorpay checkout");
  }

  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amountPaise,
    currency: order.currency,
    name: "AetherPass",
    description: `Booking ${order.bookingCode}`,
    order_id: order.orderId,
    prefill: {
      name: order.customerName ?? undefined,
      email: order.customerEmail ?? undefined,
      contact: order.customerPhone ?? undefined,
    },
    handler: onSuccess,
    modal: { ondismiss: onDismiss },
    theme: { color: "#e11d48" },
  });
  rzp.open();
}
