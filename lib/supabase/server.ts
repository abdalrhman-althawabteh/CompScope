import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server client for RSC / Server Actions / Route Handlers. cookies() is async in Next 16.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In a plain RSC render cookies are read-only; the middleware refreshes them instead.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // ponytail: swallow the RSC read-only-cookies throw; middleware handles refresh.
          }
        },
      },
    },
  );
}
