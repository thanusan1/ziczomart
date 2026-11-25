"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AddressResult = {
  success: boolean;
  error?: string;
};

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

function getAddressData(formData: FormData) {
  return {
    full_name: String(formData.get("fullName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address_line_1: String(formData.get("addressLine1") ?? "").trim(),
    address_line_2: String(formData.get("addressLine2") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim(),
    district: String(formData.get("district") ?? "").trim() || null,
    postal_code: String(formData.get("postalCode") ?? "").trim() || null,
  };
}

function validateAddress(data: ReturnType<typeof getAddressData>) {
  if (!data.full_name || !data.phone || !data.address_line_1 || !data.city) {
    return "Please complete all required address fields.";
  }

  if (data.full_name.length > 100 || data.address_line_1.length > 200) {
    return "Some address fields are too long.";
  }

  if (!/^(\+94|0)?[0-9]{9,10}$/.test(data.phone.replace(/[\s-]/g, ""))) {
    return "Please enter a valid Sri Lankan phone number.";
  }

  return null;
}

function getAddressError(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "This delivery address is already saved in your account.";
  }

  console.error("Address operation error:", error.message);

  return "Something went wrong. Please try again.";
}

export async function addAddress(formData: FormData): Promise<AddressResult> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Please log in to continue." };
  }

  const address = getAddressData(formData);
  const validationError = validateAddress(address);

  if (validationError) {
    return { success: false, error: validationError };
  }

  const { count, error: countError } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    return { success: false, error: "Could not check saved addresses." };
  }

  if ((count ?? 0) >= 20) {
    return {
      success: false,
      error: "You can save a maximum of 20 addresses.",
    };
  }

  const shouldBeDefault =
    formData.get("isDefault") === "on" || (count ?? 0) === 0;

  const { error } = await supabase.rpc("save_customer_address", {
    p_address_id: null,
    p_full_name: address.full_name,
    p_phone: address.phone,
    p_address_line_1: address.address_line_1,
    p_address_line_2: address.address_line_2,
    p_city: address.city,
    p_district: address.district,
    p_postal_code: address.postal_code,
    p_is_default: shouldBeDefault,
  });

  if (error) {
    return { success: false, error: getAddressError(error) };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return { success: true };
}

export async function updateAddress(
  formData: FormData,
): Promise<AddressResult> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Please log in to continue." };
  }

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { success: false, error: "Address ID is missing." };
  }

  const address = getAddressData(formData);
  const validationError = validateAddress(address);

  if (validationError) {
    return { success: false, error: validationError };
  }

  const { error } = await supabase.rpc("save_customer_address", {
    p_address_id: id,
    p_full_name: address.full_name,
    p_phone: address.phone,
    p_address_line_1: address.address_line_1,
    p_address_line_2: address.address_line_2,
    p_city: address.city,
    p_district: address.district,
    p_postal_code: address.postal_code,
    p_is_default: formData.get("isDefault") === "on",
  });

  if (error) {
    return { success: false, error: getAddressError(error) };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return { success: true };
}

export async function deleteAddress(
  formData: FormData,
): Promise<AddressResult> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Please log in to continue." };
  }

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { success: false, error: "Address ID is missing." };
  }

  const { data: address, error: findError } = await supabase
    .from("addresses")
    .select("id, is_default")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (findError || !address) {
    return { success: false, error: "Address not found." };
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Could not delete your address." };
  }

  if (address.is_default) {
    const { data: nextAddress } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextAddress) {
      await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", nextAddress.id)
        .eq("user_id", user.id);
    }
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return { success: true };
}

export async function setDefaultAddress(
  formData: FormData,
): Promise<AddressResult> {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return { success: false, error: "Please log in to continue." };
  }

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { success: false, error: "Address ID is missing." };
  }

  const { error } = await supabase.rpc("save_customer_address", {
    p_address_id: id,
    p_full_name: null,
    p_phone: null,
    p_address_line_1: null,
    p_address_line_2: null,
    p_city: null,
    p_district: null,
    p_postal_code: null,
    p_is_default: true,
  });

  if (error) {
    return { success: false, error: getAddressError(error) };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");

  return { success: true };
}
