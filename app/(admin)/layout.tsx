import { redirect } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="app-glow flex min-h-screen">
      <Sidebar isAdmin />
      <div className="flex min-w-0 flex-1 flex-col gap-6 py-6 pr-6">
        {children}
      </div>
    </div>
  );
}
