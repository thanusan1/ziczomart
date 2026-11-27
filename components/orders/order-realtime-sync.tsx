"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface OrderRealtimeSyncProps {
  orderId?: string;
  userId?: string;
}

/**
 * Listens to Supabase Realtime changes on `public.orders` and refreshes
 * the Next.js server component data immediately without polling.
 */
export default function OrderRealtimeSync({
  orderId,
  userId,
}: OrderRealtimeSyncProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const filter = orderId
      ? `id=eq.${orderId}`
      : userId
        ? `user_id=eq.${userId}`
        : undefined;

    const channel = supabase
      .channel(`orders-sync-${orderId ?? userId ?? "admin"}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          ...(filter ? { filter } : {}),
        },
        () => {
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          ...(filter ? { filter } : {}),
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, userId, router]);

  return null;
}
