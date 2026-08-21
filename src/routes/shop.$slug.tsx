import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin, MessageCircle, Minus, Phone, Plus, ShoppingBag, Store, Clock, Link as LinkIcon, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getPublicShop } from "@/lib/menu.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  buildWhatsAppOrder,
  detectDevice,
  money,
  planOf,
  shopTiming,
  shopSocialLink,
  type CartLine,
  type MenuItem,
  type Shop,
} from "@/lib/shop";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    const data = await getPublicShop({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Menu unavailable — MenuQR Pro" }, { name: "robots", content: "noindex" }] };
    }
    const { shop } = loaderData;
    const title = `${shop.name} — Menu`;
    const description = shop.tagline ?? `Browse the live menu of ${shop.name} and order on WhatsApp.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <Fallback text="This menu could not be loaded." />,
  notFoundComponent: () => <Fallback text="This menu does not exist or is no longer active." />,
  component: PublicMenu,
});

function Fallback({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold">Menu unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        <Button asChild className="mt-6">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}

function PublicMenu() {
  const data = Route.useLoaderData();
  const shop = data.shop as unknown as Shop;
  const items = data.items as unknown as MenuItem[];
  const categories = data.categories;
  const features = planOf(shop.plan);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [active, setActive] = useState<string>("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "takeaway" | "on_table">("on_table");
  
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const fetchLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            
            if (data && data.address) {
              const addr = data.address;
              setDeliveryCity(addr.city || addr.town || addr.village || addr.county || "");
              setDeliveryPincode(addr.postcode || "");
              
              // Build a decent street address
              const streetParts = [
                addr.house_number, 
                addr.road || addr.street, 
                addr.suburb || addr.neighbourhood || addr.residential
              ].filter(Boolean);
              
              const streetAddress = streetParts.length > 0 ? streetParts.join(", ") : data.display_name;
              setDeliveryAddress(streetAddress);
            } else {
              // Fallback to Google Maps link if reverse geocoding fails
              const link = `https://maps.google.com/?q=${latitude},${longitude}`;
              setDeliveryAddress(`GPS: ${link}`);
            }
          } catch (error) {
            console.error("Reverse geocoding error", error);
            const link = `https://maps.google.com/?q=${latitude},${longitude}`;
            setDeliveryAddress(`GPS: ${link}`);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Error getting location", error);
          setIsLocating(false);
          alert("Could not get your location. Please type your address manually.");
        },
        { timeout: 10000 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleOrderTypeChange = (v: "delivery" | "takeaway" | "on_table") => {
    setOrderType(v);
  };

  useEffect(() => {
    const isScan =
      typeof window !== "undefined" && new URLSearchParams(window.location.search).get("src") === "qr";
    supabase
      .from("analytics_events")
      .insert({ shop_id: shop.id, event_type: isScan ? "scan" : "view", device: detectDevice() })
      .then(() => undefined);
  }, [shop.id]);

  const lines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ item: items.find((i) => i.id === id)!, qty }))
        .filter((l) => l.item && l.qty > 0),
    [cart, items],
  );
  const total = lines.reduce((s, l) => s + (l.item.discount_price ?? l.item.price) * l.qty, 0);
  const visible = items.filter((i) => i.is_available && (active === "all" || i.category_id === active));
  const canOrder = features.ordering && !!shop.whatsapp;

  function change(id: string, delta: number) {
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + delta) }));
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-32">
      {/* Banner */}
      <header className="relative isolate h-56 w-full overflow-hidden sm:h-72">
        {shop.cover_url ? (
          <img
            src={shop.cover_url}
            alt={`${shop.name} cover`}
            className="absolute inset-0 size-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-hero-gradient" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </header>

      <div className="mx-auto -mt-20 max-w-2xl px-4">
        <section className="rounded-3xl border bg-card/95 p-5 shadow-lg backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="size-16 shrink-0 overflow-hidden rounded-2xl border bg-muted">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt={`${shop.name} logo`} className="size-full object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-muted-foreground">
                  <Store className="size-6" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-semibold leading-tight">{shop.name}</h1>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{shop.tagline ?? shop.niche}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {shop.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" /> {shop.address}
              </span>
            )}
            {shop.phone && (
              <a href={`tel:${shop.phone}`} className="inline-flex items-center gap-1.5 text-primary">
                <Phone className="size-4" /> {shop.phone}
              </a>
            )}
            {shopTiming(shop) && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 shrink-0" /> {shopTiming(shop)}
              </span>
            )}
            {shopSocialLink(shop) && (
              <a href={shopSocialLink(shop)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary">
                <LinkIcon className="size-4 shrink-0" /> Social Media
              </a>
            )}
          </div>
        </section>

        <div className="no-scrollbar sticky top-0 z-10 -mx-4 mt-5 flex gap-2 overflow-x-auto bg-muted/30 px-4 py-2 backdrop-blur">
          <Chip label="All" active={active === "all"} onClick={() => setActive("all")} />
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} active={active === c.id} onClick={() => setActive(c.id)} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.length === 0 && (
            <p className="col-span-full rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
              No items in this section yet.
            </p>
          )}
          {visible.map((item) => (
            <article key={item.id} className="flex flex-col rounded-2xl border bg-card shadow-sm overflow-hidden transition-shadow hover:shadow-md">
              <div className="relative aspect-square w-full bg-muted">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center text-muted-foreground">
                    <Store className="size-8 opacity-20" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h2 className="line-clamp-2 text-sm font-medium leading-tight">{item.name}</h2>
                {item.description && (
                  <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{item.description}</p>
                )}
                
                <div className="mt-auto pt-3 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="whitespace-nowrap text-sm font-bold">
                      {money(item.discount_price ?? item.price, shop.currency)}
                    </p>
                    {item.discount_price !== null && item.discount_price !== item.price && (
                      <p className="text-[10px] text-muted-foreground line-through">
                        {money(item.price, shop.currency)}
                      </p>
                    )}
                  </div>
                  
                  {canOrder ? (
                    (cart[item.id] ?? 0) > 0 ? (
                      <div className="flex h-8 items-center rounded-lg border bg-background overflow-hidden text-sm shadow-sm">
                        <button aria-label="Remove one" className="flex h-full items-center justify-center bg-muted/50 px-2 transition-colors hover:bg-muted" onClick={() => change(item.id, -1)}>
                          <Minus className="size-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-semibold">{cart[item.id]}</span>
                        <button aria-label="Add one" className="flex h-full items-center justify-center bg-muted/50 px-2 transition-colors hover:bg-muted" onClick={() => change(item.id, 1)}>
                          <Plus className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="h-8 rounded-lg px-3 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5 hover:text-primary shadow-sm" onClick={() => change(item.id, 1)}>
                        ADD
                      </Button>
                    )
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="py-8 text-center text-xs text-muted-foreground">
          Powered by <Link to="/" className="text-primary">MenuQR Pro</Link>
        </p>
      </div>

      {canOrder && lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div 
            className="mx-auto flex max-w-md cursor-pointer items-center justify-between overflow-hidden rounded-2xl bg-primary p-3 text-primary-foreground shadow-xl shadow-black/20 transition-transform active:scale-[0.98]" 
            onClick={() => setIsCartOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-white/20">
                <ShoppingBag className="size-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-primary-foreground/90">
                  {lines.length} item{lines.length > 1 ? "s" : ""}
                </span>
                <span className="text-lg font-bold tracking-tight">
                  {money(total, shop.currency)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 pl-4 pr-1 text-[17px] font-semibold tracking-tight">
              View Cart <ChevronRight className="size-5" />
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Modal */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Order / Cart</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Cart Items */}
            <div className="space-y-4">
              {lines.map((l) => (
                <div key={l.item.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.item.name}</p>
                    <p className="text-sm text-muted-foreground">{money(l.item.discount_price ?? l.item.price, shop.currency)}</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-full border px-2 py-1">
                    <button aria-label="Remove one" onClick={() => change(l.item.id, -1)}>
                      <Minus className="size-4" />
                    </button>
                    <span className="w-4 text-center text-sm font-medium">{cart[l.item.id]}</span>
                    <button aria-label="Add one" onClick={() => change(l.item.id, 1)}>
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {lines.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">Your cart is empty.</p>
              )}
            </div>

            {lines.length > 0 && (
              <>
                <div className="space-y-3">
                  <Label>Order Type</Label>
                  <RadioGroup value={orderType} onValueChange={handleOrderTypeChange} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery">Delivery</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="takeaway" id="takeaway" />
                      <Label htmlFor="takeaway">Take Away</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="on_table" id="on_table" />
                      <Label htmlFor="on_table">On Table</Label>
                    </div>
                  </RadioGroup>
                </div>

                {orderType === "delivery" && (
                  <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="delivery-address">Delivery Address</Label>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          className="h-7 text-xs bg-orange-100 text-orange-700 hover:bg-orange-200"
                          onClick={fetchLocation}
                          disabled={isLocating}
                        >
                          <MapPin className="mr-1 size-3" />
                          {isLocating ? "Locating..." : "Use My Location"}
                        </Button>
                      </div>
                      <Textarea 
                        id="delivery-address" 
                        placeholder="House no., Street, Landmark" 
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="delivery-city">City</Label>
                        <Input 
                          id="delivery-city" 
                          placeholder="City" 
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery-pincode">Pincode</Label>
                        <Input 
                          id="delivery-pincode" 
                          placeholder="6-digit" 
                          value={deliveryPincode}
                          onChange={(e) => setDeliveryPincode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="customer-name">Your Name</Label>
                  <Input 
                    id="customer-name" 
                    placeholder="e.g. Rahul Sharma" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-phone">WhatsApp Phone Number</Label>
                  <Input 
                    id="customer-phone" 
                    placeholder="+91 98765 43210" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special-instructions">Special Instructions (Optional)</Label>
                  <Textarea 
                    id="special-instructions" 
                    placeholder="e.g. Less spicy, table number 4" 
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <Button asChild className="w-full">
                    <a 
                      href={buildWhatsAppOrder(shop, lines, {
                        type: orderType,
                        name: customerName,
                        phone: customerPhone,
                        notes: specialInstructions,
                        location: orderType === "delivery" ? [deliveryAddress, deliveryCity, deliveryPincode].filter(Boolean).join(", ") : null
                      })} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={() => setIsCartOpen(false)}
                    >
                      <MessageCircle className="mr-2 size-4" /> 
                      Send Order ({money(total, shop.currency)})
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition ${
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}
