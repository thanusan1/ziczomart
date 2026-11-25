"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileUpdateResult = {
  success: boolean;
  error?: string;
};

export async function updateProfile(
  formData: FormData,
): Promise<ProfileUpdateResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (fullName.length < 2) {
    return {
      success: false,
      error: "Full name must contain at least 2 characters.",
    };
  }

  if (fullName.length > 100) {
    return {
      success: false,
      error: "Full name cannot exceed 100 characters.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Please log in to update your profile.",
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Profile update error:", profileError.message);

    return {
      success: false,
      error: "Could not update your profile. Please try again.",
    };
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
    },
  });

  if (metadataError) {
    console.error("Profile metadata update error:", metadataError.message);
  }

  revalidatePath("/account");

  return {
    success: true,
  };
}
