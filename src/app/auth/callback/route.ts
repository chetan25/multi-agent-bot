import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const next = searchParams.get("next") ?? "/";

    console.log("🔍 Auth callback received:", {
      hasCode: !!code,
      hasError: !!error,
      errorDescription,
      next,
      url: request.url,
    });

    // Check for OAuth errors
    if (error) {
      console.error("❌ OAuth error received:", { error, errorDescription });
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=${encodeURIComponent(
          error
        )}&description=${encodeURIComponent(errorDescription || "")}`
      );
    }

    if (!code) {
      console.error("❌ No authorization code received");
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=no_code&description=No authorization code received from OAuth provider`
      );
    }

    // Exchange the code for a session
    const supabase = await createServerSupabaseClient();
    console.log("🔍 Exchanging code for session...");

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    console.log("🔍 Code exchange result:", {
      hasData: !!data,
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: exchangeError?.message,
      errorCode: exchangeError?.code,
    });

    if (exchangeError) {
      console.error("❌ Code exchange failed:", exchangeError);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=exchange_failed&description=${encodeURIComponent(
          exchangeError.message
        )}`
      );
    }

    if (!data?.session) {
      console.error("❌ No session created after code exchange");
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=no_session&description=No session created after code exchange`
      );
    }

    console.log("✅ Code exchange successful, redirecting to:", next);
    const redirectUrl = `${origin}${next}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ Unexpected error in auth callback:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=unexpected&description=${encodeURIComponent(
        errorMessage
      )}`
    );
  }
}
