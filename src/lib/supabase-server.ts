import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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

// Create a Supabase client with service role key for server-side operations
export function createServiceSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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

// Helper function to get user's Google tokens (with authentication context)
export async function getUserGoogleTokens(userId: string) {
  console.log("🔍 getUserGoogleTokens called for userId:", userId);

  const supabase = await createServerSupabaseClient();

  console.log("🔍 Querying google_tokens table for user:", userId);
  const { data: tokens, error } = await supabase
    .from("google_tokens")
    .select("refresh_token, access_token, token_expiry")
    .eq("user_id", userId)
    .single();

  console.log("📊 Database query result:", {
    hasData: !!tokens,
    hasRefreshToken: !!tokens?.refresh_token,
    hasAccessToken: !!tokens?.access_token,
    error: error?.message,
    errorCode: error?.code,
  });

  if (error || !tokens?.refresh_token) {
    console.log("❌ getUserGoogleTokens failed:", {
      error: error?.message,
      errorCode: error?.code,
      hasTokens: !!tokens,
      hasRefreshToken: !!tokens?.refresh_token,
    });
    throw new Error("Google Drive not connected");
  }

  console.log("✅ getUserGoogleTokens successful for user:", userId);
  return tokens;
}

// Helper function to get user's Google tokens (without authentication context - for server-side operations)
export async function getUserGoogleTokensService(userId: string) {
  console.log("🔍 getUserGoogleTokensService called for userId:", userId);

  const supabase = createServiceSupabaseClient();

  console.log(
    "🔍 Querying google_tokens table with service role for user:",
    userId
  );
  const { data: tokens, error } = await supabase
    .from("google_tokens")
    .select("refresh_token, access_token, token_expiry")
    .eq("user_id", userId)
    .single();

  console.log("📊 Database query result (service role):", {
    hasData: !!tokens,
    hasRefreshToken: !!tokens?.refresh_token,
    hasAccessToken: !!tokens?.access_token,
    error: error?.message,
    errorCode: error?.code,
  });

  if (error || !tokens?.refresh_token) {
    console.log("❌ getUserGoogleTokensService failed:", {
      error: error?.message,
      errorCode: error?.code,
      hasTokens: !!tokens,
      hasRefreshToken: !!tokens?.refresh_token,
    });
    throw new Error("Google Drive not connected");
  }

  console.log("✅ getUserGoogleTokensService successful for user:", userId);
  return tokens;
}
