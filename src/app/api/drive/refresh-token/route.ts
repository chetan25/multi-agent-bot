import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Refresh the access token using Google's OAuth2 endpoint
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh token:", response.statusText);
      return NextResponse.json(
        { error: "Failed to refresh access token" },
        { status: 400 }
      );
    }

    const tokenData = await response.json();
    const { access_token, expires_in } = tokenData;

    if (!access_token) {
      return NextResponse.json(
        { error: "No access token received" },
        { status: 400 }
      );
    }

    // Update tokens in database
    const { error: updateError } = await supabase
      .from("google_tokens")
      .update({
        access_token,
        token_expiry: new Date(Date.now() + expires_in * 1000).toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update tokens in database:", updateError);
      // Still return the tokens even if database update fails
    }

    return NextResponse.json({
      access_token,
      expires_in,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
