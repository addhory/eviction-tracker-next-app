export const APP_CONFIG = {
  name: "Eviction Tracker",
  description: "Maryland Eviction Management System",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supportEmail: "support@evictiontracker.com",

  // Features
  features: {
    enableStripePayments: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    enableDocumentGeneration: true,
    enableNotifications: true,
  },

  // County-specific pricing (in cents)
  countyPricing: {
    "Baltimore City": 35000, // $350
    Montgomery: 40000, // $400
    "Prince George's": 35000, // $350
    "Anne Arundel": 37500, // $375
    Baltimore: 35000, // $350
    Howard: 40000, // $400
    Harford: 32500, // $325
    Carroll: 32500, // $325
    Frederick: 32500, // $325
    Washington: 30000, // $300
    Charles: 32500, // $325
    Calvert: 32500, // $325
    "St. Mary's": 32500, // $325
    Wicomico: 30000, // $300
    Worcester: 30000, // $300
    Somerset: 30000, // $300
    Dorchester: 30000, // $300
    Talbot: 30000, // $300
    Caroline: 30000, // $300
    "Queen Anne's": 32500, // $325
    Kent: 30000, // $300
    Cecil: 30000, // $300
    Allegany: 30000, // $300
    Garrett: 30000, // $300
  },

  // Default pricing for counties not listed above
  defaultPrice: 32500, // $325
};

export const getCountyPrice = (county: string): number => {
  return APP_CONFIG.countyPricing[county] || APP_CONFIG.defaultPrice;
};
