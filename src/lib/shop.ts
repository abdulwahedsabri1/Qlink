export type Plan = "basic" | "pro" | "premium";
export type ShopStatus = "active" | "suspended" | "expired";

export type Shop = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  niche: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  theme_color: string;
  plan: string;
  status: string;
  created_at: string;
  plan_started_at?: string | null;
  plan_expires_at?: string | null;
  payment_status?: string | null;
  amount_paid?: number | null;
  features?: Record<string, any> | null;
};

export function shopTiming(shop?: Pick<Shop, "features"> | null) {
  return shop?.features?.timing as string | undefined;
}

export function shopSocialLink(shop?: Pick<Shop, "features"> | null) {
  return shop?.features?.social_link as string | undefined;
}

export type Category = {
  id: string;
  shop_id: string;
  name: string;
  position: number;
};

export type MenuItem = {
  id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  discount_price: number | null;
  is_veg: boolean;
  is_available: boolean;
  is_bestseller: boolean;
  position: number;
};

export const NICHES = [
  "Restaurant",
  "Cafe",
  "Bakery",
  "Sweet Shop",
  "Food Truck",
  "Salon",
  "Spa",
  "Gym",
  "Hotel",
  "Resort",
  "Boutique",
  "Textile Store",
  "Jewelry Shop",
  "Grocery Store",
  "Medical Store",
  "Clinic",
  "Real Estate",
  "Electronics Store",
];

export const PLANS: {
  id: Plan;
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}[] = [
  {
    id: "basic",
    name: "Basic",
    price: "₹199/mo",
    tagline: "Get your first QR menu live",
    features: ["1 QR code", "Up to 50 menu items", "Mobile menu page", "Basic view counter"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499/mo",
    tagline: "For growing shops",
    highlight: true,
    features: [
      "Unlimited categories",
      "Unlimited menu items",
      "Full analytics dashboard",
      "AI menu generator",
      "PNG / SVG / PDF QR downloads",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹999/mo",
    tagline: "Sell, not just show",
    features: [
      "Everything in Pro",
      "WhatsApp ordering",
      "Online ordering cart",
      "Custom domain",
      "Priority support",
    ],
  },
];

export const PLAN_PRICE: Record<string, number> = { basic: 199, pro: 499, premium: 999 };

export type PlanFeatures = {
  items: number;
  categories: number;
  ai: boolean;
  ordering: boolean;
  analytics: boolean;
  qr_downloads: boolean;
  custom_domain: boolean;
  priority_support: boolean;
};

export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  basic: {
    items: 50,
    categories: 5,
    ai: false,
    ordering: false,
    analytics: false,
    qr_downloads: false,
    custom_domain: false,
    priority_support: false,
  },
  pro: {
    items: Infinity,
    categories: Infinity,
    ai: true,
    ordering: false,
    analytics: true,
    qr_downloads: true,
    custom_domain: false,
    priority_support: false,
  },
  premium: {
    items: Infinity,
    categories: Infinity,
    ai: true,
    ordering: true,
    analytics: true,
    qr_downloads: true,
    custom_domain: true,
    priority_support: true,
  },
};

export type FeatureKey = "ai" | "ordering" | "analytics" | "qr_downloads" | "custom_domain" | "priority_support";

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  ai: "AI menu generator & photo scan",
  ordering: "WhatsApp ordering & cart",
  analytics: "Full analytics dashboard",
  qr_downloads: "PNG / SVG / PDF QR downloads",
  custom_domain: "Custom domain",
  priority_support: "Priority support",
};

export const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as FeatureKey[];

export function planOf(plan?: string | null): PlanFeatures {
  return PLAN_FEATURES[plan ?? "basic"] ?? PLAN_FEATURES["basic"]!;
}

/** Plan defaults merged with any per-shop feature switches set by an admin. */
export function shopFeatures(shop?: Pick<Shop, "plan" | "features"> | null): PlanFeatures {
  const base = planOf(shop?.plan);
  const overrides = shop?.features ?? {};
  const merged: PlanFeatures = { ...base };
  for (const key of FEATURE_KEYS) {
    const value = overrides[key];
    if (typeof value === "boolean") merged[key] = value;
  }
  return merged;
}

export function isExpired(shop?: Pick<Shop, "plan_expires_at"> | null) {
  if (!shop?.plan_expires_at) return false;
  return new Date(shop.plan_expires_at).getTime() < Date.now();
}

export function addMonths(from: Date, months: number) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function toDateInput(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

/** Public, share-safe URL for a shop menu (editor previews require a login). */
export function publicShopUrl(slug: string) {
  const path = `/shop/${slug}`;
  if (typeof window === "undefined") return path;
  const host = window.location.hostname;
  if (host.includes("id-preview--") || host.includes("lovableproject.com") || host === "localhost") {
    return `https://myshop-link.lovable.app${path}`;
  }
  return `${window.location.origin}${path}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export const PLAN_LIMITS: Record<string, { items: number; categories: number }> = {
  basic: { items: 50, categories: 5 },
  pro: { items: Infinity, categories: Infinity },
  premium: { items: Infinity, categories: Infinity },
};

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

export function money(value: number, currency = "₹") {
  return `${currency}${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function detectDevice() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

export type CartLine = { item: MenuItem; qty: number };

export function buildWhatsAppOrder(
  shop: Shop,
  lines: CartLine[],
  details?: { name?: string; phone?: string; notes?: string; type?: "delivery" | "takeaway" | "on_table"; location?: string | null }
) {
  const rows = lines.map((l) => {
    const unit = l.item.discount_price ?? l.item.price;
    return `• ${l.item.name} x${l.qty} — ${money(unit * l.qty, shop.currency)}`;
  });
  const total = lines.reduce((sum, l) => sum + (l.item.discount_price ?? l.item.price) * l.qty, 0);
  
  const textParts = [
    `Hello ${shop.name},`,
    "",
    "I want to order:",
    ...rows,
    "",
    `Total: ${money(total, shop.currency)}`,
  ];

  if (details?.type) {
    const typeLabel = details.type === "delivery" ? "Delivery" : details.type === "takeaway" ? "Take Away" : "On Table";
    textParts.push(`\nOrder Type: ${typeLabel}`);
  }
  if (details?.location) {
    textParts.push(`Location: ${details.location}`);
  }
  if (details?.name) {
    textParts.push(`Name: ${details.name}`);
  }
  if (details?.phone) {
    textParts.push(`Phone: ${details.phone}`);
  }
  if (details?.notes) {
    textParts.push(`Notes: ${details.notes}`);
  }

  const text = textParts.join("\n");
  const number = (shop.whatsapp ?? "").replace(/[^0-9]/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
