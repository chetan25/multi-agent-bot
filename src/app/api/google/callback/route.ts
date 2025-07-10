import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  getOAuthCallbackUrl,
  getBaseUrl,
  getHttpsRedirectUrl,
} from "@/lib/https-utils";

// We'll create the client with auth context in the function

export async function GET(request: NextRequest) {
  // Log the full request URL for debugging
  console.log("🔍 OAuth Callback - Full URL:", request.url);
  console.log("🔍 OAuth Callback - Expected URL:", getOAuthCallbackUrl());
  console.log("🔍 OAuth Callback - Base URL:", getBaseUrl());

  // Check if required environment variables are set
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate environment variables
  if (
    !clientId ||
    !clientSecret ||
    !appUrl ||
    !supabaseUrl ||
    !supabaseAnonKey ||
    !supabaseServiceKey
  ) {
    console.error("Missing required environment variables:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasAppUrl: !!appUrl,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseAnonKey: !!supabaseAnonKey,
      hasSupabaseServiceKey: !!supabaseServiceKey,
    });
    return NextResponse.redirect(
      getHttpsRedirectUrl("/integrations/voice-drive?error=configuration_error")
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("OAuth callback received:", {
    hasCode: !!code,
    hasState: !!state,
    hasError: !!error,
    state: state,
  });

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(
      getHttpsRedirectUrl(
        `/integrations/voice-drive?error=connection_failed&details=${encodeURIComponent(
          error
        )}`
      )
    );
  }

  if (!code || !state) {
    console.error("Missing code or state parameter", {
      code: !!code,
      state: !!state,
    });
    return NextResponse.redirect(
      getHttpsRedirectUrl("/integrations/voice-drive?error=missing_parameters")
    );
  }

  try {
    console.log("Exchanging authorization code for tokens...");

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getOAuthCallbackUrl(),
        grant_type: "authorization_code",
      }),
    });

    console.log("Token exchange response status:", tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        getHttpsRedirectUrl(
          `/integrations/voice-drive?error=token_exchange_failed&details=${encodeURIComponent(
            errorData
          )}`
        )
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token } = tokenData;

    console.log("Token exchange successful:", {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
    });

    if (!refresh_token) {
      console.error("No refresh token received");
      return NextResponse.redirect(
        getHttpsRedirectUrl("/integrations/voice-drive?error=no_refresh_token")
      );
    }

    console.log("Storing tokens in database for user:", state);

    // Create Supabase client with service role key for OAuth callback
    // This bypasses RLS because the OAuth callback doesn't have user auth context
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store tokens in google_tokens table using service role key
    // The state parameter contains the user ID from the OAuth flow
    const { error: upsertError } = await supabase.from("google_tokens").upsert(
      {
        user_id: state, // This should be the authenticated user's ID
        refresh_token: refresh_token,
        access_token: access_token,
        token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
      },
      {
        onConflict: "user_id",
      }
    );

    if (upsertError) {
      console.error("Error storing tokens:", upsertError);
      return NextResponse.redirect(
        getHttpsRedirectUrl(
          `/integrations/voice-drive?error=database_error&details=${encodeURIComponent(
            upsertError.message
          )}`
        )
      );
    }

    console.log("Tokens stored successfully for user:", state);

    // Redirect back to the Voice Drive page with success status
    return NextResponse.redirect(
      getHttpsRedirectUrl("/integrations/voice-drive?connected=true")
    );
  } catch (error) {
    console.error("Error in OAuth callback:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.redirect(
      getHttpsRedirectUrl(
        `/integrations/voice-drive?error=callback_error&details=${encodeURIComponent(
          errorMessage
        )}`
      )
    );
  }
}
