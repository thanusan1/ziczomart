"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type CheckoutResult = {
  success: boolean;
  orderId?: string;
  error?: string;
};

export async function placeOrder(formData: FormData): Promise<CheckoutResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();

  if (!fullName || !phone || !addressLine1 || !city || !district) {
    return {
      success: false,
      error: "Please complete all required delivery details.",
    };
  }

  if (!/^(\+94|0)?[0-9]{9,10}$/.test(phone.replace(/[\s-]/g, ""))) {
    return {
      success: false,
      error: "Please enter a valid Sri Lankan phone number.",
    };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Please log in again before placing your order.",
      };
    }

    const { data, error } = await supabase.rpc("place_order", {
      p_shipping_full_name: fullName,
      p_shipping_phone: phone,
      p_shipping_address_line_1: addressLine1,
      p_shipping_address_line_2: addressLine2 || null,
      p_shipping_city: city,
      p_shipping_district: district,
      p_shipping_postal_code: postalCode || null,
    });

    if (error) {
      console.error("Checkout database error:", error.message);

      return {
        success: false,
        error: error.message,
      };
    }

    if (!data) {
      return {
        success: false,
        error: "The order was not created. Please try again.",
      };
    }

    return {
      success: true,
      orderId: data,
    };
  } catch (error) {
    console.error("Checkout error:", error);

    return {
      success: false,
      error: "Something went wrong while placing your order.",
    };
  }
}
