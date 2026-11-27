import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      <Link
        href="/"
        className="flex items-center gap-1 text-gray-400 transition hover:text-[#1049C6]"
      >
        <Home size={13} />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="flex items-center gap-1">
            <ChevronRight size={13} className="text-gray-300" />
            {isLast || !item.href ? (
              <span className="font-medium text-[#0A1633]">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-400 transition hover:text-[#1049C6]"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
