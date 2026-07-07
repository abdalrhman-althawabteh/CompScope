import { Sidebar } from "@/components/ui/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="app-glow flex min-h-screen">
      <Sidebar isAdmin={profile?.role === "admin"} />
      <div className="flex min-w-0 flex-1 flex-col gap-6 py-6 pr-6">
        {children}
      </div>
    </div>
  );
}
