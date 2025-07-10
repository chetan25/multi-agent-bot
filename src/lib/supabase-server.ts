import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Create a Supabase client for server-side operations
export async function createServerSupabaseClient() {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Helper function to get authenticated user
export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
}

// Helper function to get user's Google tokens
export async function getUserGoogleTokens(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: tokens, error } = await supabase
    .from("google_tokens")
    .select("refresh_token, access_token, token_expiry")
    .eq("user_id", userId)
    .single();

  if (error || !tokens?.refresh_token) {
    throw new Error("Google Drive not connected");
  }

  return tokens;
}
