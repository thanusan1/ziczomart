import {
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
  type LucideIcon,
} from "lucide-react";

export type TrustBenefitItem = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

const DEFAULT_BENEFITS: TrustBenefitItem[] = [
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Your information is safe",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Get your order quickly",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    desc: "Hassle-free returns",
  },
  {
    icon: Headphones,
    title: "24/7 Customer Support",
    desc: "We're here to help",
  },
];

export default function TrustStrip({
  items = DEFAULT_BENEFITS,
}: {
  items?: TrustBenefitItem[];
}) {
  return (
    <section
      aria-label="Store benefits"
      className="border-y border-gray-200/80 bg-white"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-y divide-gray-100 px-4 sm:px-6 md:grid-cols-4 md:divide-x md:divide-y-0">
        {items.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-center gap-3.5 px-3 py-5 sm:px-5"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1049C6]">
              <Icon size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0A1633]">{title}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
