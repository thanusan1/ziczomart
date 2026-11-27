import {
  Package,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Speaker,
  Camera,
  Tablet,
  Keyboard,
  Mouse,
  BatteryCharging,
  Cpu,
  Monitor,
  Flame,
  Coffee,
  Utensils,
  UtensilsCrossed,
  Lamp,
  Sofa,
  Box,
  Sparkles,
  BedDouble,
  CookingPot,
  CupSoda,
} from "lucide-react";

const ELECTRONICS_PLACEHOLDER_ITEMS = [
  { Icon: Smartphone, label: "Smartphones" },
  { Icon: Laptop, label: "Laptops" },
  { Icon: Headphones, label: "Headphones" },
  { Icon: Watch, label: "Smart Watches" },
  { Icon: Speaker, label: "Speakers" },
  { Icon: Camera, label: "Cameras" },
  { Icon: Tablet, label: "Tablets" },
  { Icon: Keyboard, label: "Keyboards" },
  { Icon: Mouse, label: "Computer Mice" },
  { Icon: BatteryCharging, label: "Power Banks" },
  { Icon: Monitor, label: "Monitors" },
  { Icon: Cpu, label: "Accessories" },
];

const HOME_KITCHEN_PLACEHOLDER_ITEMS = [
  { Icon: Flame, label: "Air Fryers" },
  { Icon: CupSoda, label: "Blenders" },
  { Icon: CookingPot, label: "Rice Cookers" },
  { Icon: Coffee, label: "Electric Kettles" },
  { Icon: UtensilsCrossed, label: "Cookware Sets" },
  { Icon: Utensils, label: "Non-Stick Pans" },
  { Icon: UtensilsCrossed, label: "Dinner Sets" },
  { Icon: Box, label: "Storage Containers" },
  { Icon: Lamp, label: "Table Lamps" },
  { Icon: Sofa, label: "Home Decor" },
  { Icon: BedDouble, label: "Bedding & Bath" },
  { Icon: Sparkles, label: "Cleaning Supplies" },
];

interface ProductPlaceholderCardProps {
  variant?: "deal" | "compact" | "default";
  viewMode?: "grid" | "list";
  category?: string;
  slotIndex?: number;
  message?: string;
}

export default function ProductPlaceholderCard({
  variant = "compact",
  viewMode = "grid",
  category,
  slotIndex = 0,
  message = "Coming Soon",
}: ProductPlaceholderCardProps) {
  const normalizedCategory = category?.toLowerCase() ?? "";
  const isElectronics = normalizedCategory === "electronics";
  const isHomeKitchen =
    normalizedCategory === "home-kitchen" ||
    normalizedCategory === "home & kitchen";
  const isThemedCategory = isElectronics || isHomeKitchen;
  const item = isElectronics
    ? ELECTRONICS_PLACEHOLDER_ITEMS[
        slotIndex % ELECTRONICS_PLACEHOLDER_ITEMS.length
      ]
    : isHomeKitchen
      ? HOME_KITCHEN_PLACEHOLDER_ITEMS[
          slotIndex % HOME_KITCHEN_PLACEHOLDER_ITEMS.length
        ]
      : null;
  const Icon = item?.Icon ?? Package;
  const sublabel = item
    ? `${item.label} Coming Soon`
    : "New Products Coming Soon";
  const categoryBadgeLabel = isElectronics
    ? "Electronics"
    : isHomeKitchen
      ? "Home & Kitchen"
      : null;

  if (variant === "compact") {
    return (
      <div
        aria-hidden="true"
        className="flex h-full flex-col overflow-hidden rounded-xl border border-dashed border-gray-200 bg-white"
      >
        <div className="flex aspect-square w-full items-center justify-center bg-gray-50/90">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xs ring-1 ring-gray-100">
            <Icon size={20} className="text-gray-300" />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center p-3 text-center">
          <p className="text-xs font-semibold text-gray-400">{message}</p>
          <p className="mt-1 text-[11px] text-gray-300">{sublabel}</p>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div
        aria-hidden="true"
        className="flex flex-col overflow-hidden rounded-xl border border-dashed border-gray-200 bg-white sm:flex-row"
      >
        <div className="flex aspect-[4/3] w-full flex-shrink-0 items-center justify-center bg-slate-50/80 p-3 sm:aspect-square sm:w-48">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-blue-100/70">
            <Icon
              size={28}
              className={isThemedCategory ? "text-blue-300" : "text-gray-300"}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            {categoryBadgeLabel && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                {categoryBadgeLabel} · Display Only
              </p>
            )}
            <p className="mt-0.5 text-base font-bold text-gray-400">
              {message}
            </p>
            <p className="mt-1 text-xs text-gray-400">{sublabel}</p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-xs font-medium text-gray-300">
              Launching soon on ZicZo Mart
            </span>
            <button
              type="button"
              disabled
              tabIndex={-1}
              className="cursor-not-allowed rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-400"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col overflow-hidden rounded-xl border border-dashed border-gray-200 bg-white"
    >
      <div className="relative flex aspect-square w-full flex-col items-center justify-center bg-slate-50/80">
        {isHomeKitchen && (
          <span className="absolute left-2.5 top-2.5 rounded-full border border-blue-100 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
            Display Only
          </span>
        )}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-blue-100/70">
          <Icon
            size={28}
            strokeWidth={1.6}
            className={isThemedCategory ? "text-blue-300" : "text-gray-300"}
          />
        </div>
        {item && (
          <span className="mt-2.5 text-[11px] font-medium text-slate-400">
            {item.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between border-t border-gray-100/80 p-3.5 text-center">
        <div>
          <p className="text-sm font-semibold text-gray-400">{message}</p>
          <p className="mt-1 text-xs text-gray-300">{sublabel}</p>
        </div>

        <button
          type="button"
          disabled
          tabIndex={-1}
          className="mt-4 w-full cursor-not-allowed rounded-lg border border-gray-100 bg-gray-50 py-2 text-xs font-semibold text-gray-400"
        >
          Coming Soon
        </button>
      </div>
    </div>
  );
}
