import {
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones,
  MapPin,
} from "lucide-react";

interface ProductDeliveryCardProps {
  freeDeliveryNotice?: string | null;
}

export default function ProductDeliveryCard({
  freeDeliveryNotice,
}: ProductDeliveryCardProps) {
  const benefits = [
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Get your order quickly",
    },
    {
      icon: ShieldCheck,
      title: "Secure Payments",
      description: "Your information is safe",
    },
    {
      icon: RefreshCw,
      title: "Easy Returns",
      description: "Hassle-free returns",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "We're here to help",
    },
  ];

  return (
    <aside
      aria-label="Delivery and service benefits"
      className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"
    >
      <ul className="space-y-4">
        {benefits.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
              <Icon size={19} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0F172A]">{title}</p>
              <p className="text-xs leading-relaxed text-slate-500">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="my-4 border-t border-[#E2E8F0]" />

      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#F8FAFC] text-[#0F172A]">
          <MapPin size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#0F172A]">
            Delivery Information
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Island-wide delivery available across Sri Lanka. Cash on Delivery
            &amp; online checkout supported.
          </p>
          {freeDeliveryNotice && (
            <p className="mt-1.5 text-xs font-medium text-[#2563EB]">
              {freeDeliveryNotice}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
