export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  currency: "usd",

  // Product configurations
  products: {
    evictionCase: {
      name: "Eviction Case Processing",
      description:
        "Processing fee for eviction case management and document generation",
    },
  },
};

export const validateStripeConfig = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn(
      "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable - Stripe payments disabled"
    );
    return false;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn(
      "Missing STRIPE_SECRET_KEY environment variable - Stripe payments disabled"
    );
    return false;
  }

  return true;
};
