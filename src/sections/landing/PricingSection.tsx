import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const plans = [
  {
    name: "Basic",
    price: "₹199",
    period: "/mo",
    description: "Get your first QR menu live",
    features: [
      "1 QR code",
      "Up to 50 menu items",
      "Mobile menu page",
      "Basic view counter"
    ],
    cta: "Start with Basic",
    popular: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/mo",
    description: "For growing shops",
    features: [
      "Unlimited categories",
      "Unlimited menu items",
      "Full analytics dashboard",
      "AI menu generator",
      "PNG / SVG / PDF QR downloads"
    ],
    cta: "Start with Pro",
    popular: true,
  },
  {
    name: "Premium",
    price: "₹999",
    period: "/mo",
    description: "Sell, not just show",
    features: [
      "Everything in Pro",
      "WhatsApp ordering",
      "Online ordering cart",
      "Custom domain",
      "Priority support"
    ],
    cta: "Start with Premium",
    popular: false,
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-[#F5F0E7] py-24 md:py-32 text-[#100C09]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-semibold mb-6"
          >
            Simple, transparent <span className="italic text-primary">pricing</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#3A2818]/70"
          >
            No hidden fees. No surprise charges. Upgrade, downgrade or cancel at any time.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className={`relative bg-white rounded-3xl p-8 border ${plan.popular ? 'border-primary shadow-glow' : 'border-black/5 shadow-xl'} flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              
              <h3 className="font-display text-2xl font-medium mb-2">{plan.name}</h3>
              <p className="text-[#3A2818]/70 mb-6 h-10">{plan.description}</p>
              
              <div className="flex items-baseline gap-2 mb-8">
                <span className="font-display text-5xl font-semibold">{plan.price}</span>
                <span className="text-[#3A2818]/70">{plan.period}</span>
              </div>
              
              <Link to="/auth" className="block w-full mb-8">
                <Button 
                  variant={plan.popular ? "default" : "outline"} 
                  size="lg" 
                  className={`w-full rounded-full ${plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md' : 'bg-transparent border-black/10 hover:bg-black/5 text-[#100C09]'}`}
                >
                  {plan.cta}
                </Button>
              </Link>
              
              <div className="space-y-4 flex-1">
                <p className="text-sm font-medium mb-4 uppercase tracking-wider text-[#3A2818]/70">What's included</p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="size-3 text-primary" />
                    </div>
                    <span className="text-[#3A2818]/80">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
