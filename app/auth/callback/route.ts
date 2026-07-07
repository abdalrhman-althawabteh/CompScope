import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth return handler: exchange the code for a session, then route by role.
// If Google returns an error (e.g. unknown email while signups are disabled), send to /login.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .single();
      const dest = profile?.role === "admin" ? "/admin/users" : "/dashboard";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=not_found`);
}
