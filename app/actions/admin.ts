"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Defense in depth: server actions are reachable directly, so re-check the caller is an admin
// (the middleware gate only covers navigations).
async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (data?.role !== "admin") throw new Error("Not authorized");
}

export type AdminState = { error?: string; ok?: string };

export async function createUser(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await assertAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const tier = String(formData.get("tier") ?? "free");
  if (!email || password.length < 8)
    return { error: "Email and a password of 8+ characters are required." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // admin-created accounts are pre-confirmed
    user_metadata: { full_name: fullName },
  });
  if (error) return { error: error.message };

  // Trigger created the profile with defaults; set the chosen tier.
  await admin
    .from("profiles")
    .update({ subscription_tier: tier })
    .eq("id", data.user.id);

  revalidatePath("/admin/users");
  return { ok: `Created ${email}` };
}

export async function updatePassword(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return;
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(id, { password });
  revalidatePath(`/admin/users/${id}`);
}

export async function updateSubscription(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id"));
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      subscription_tier: String(formData.get("tier")),
      subscription_status: String(formData.get("status")),
      subscription_expires_at:
        String(formData.get("expires_at") || "") || null,
    })
    .eq("id", id);
  revalidatePath(`/admin/users/${id}`);
  revalidatePath("/admin/users");
}

export async function deleteUser(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id"));
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id); // cascades to profiles via FK
  revalidatePath("/admin/users");
}
