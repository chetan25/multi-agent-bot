import { google } from "googleapis";
import { NextRequest } from "next/server";
import { getOAuthCallbackUrl } from "@/lib/https-utils";

export async function GET(req: NextRequest) {
  // Check if required environment variables are set
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId) {
    console.error("Missing GOOGLE_CLIENT_ID environment variable");
    return new Response(
      JSON.stringify({
        error: "Google OAuth not configured. Missing GOOGLE_CLIENT_ID",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!clientSecret) {
    console.error("Missing GOOGLE_CLIENT_SECRET environment variable");
    return new Response(
      JSON.stringify({
        error: "Google OAuth not configured. Missing GOOGLE_CLIENT_SECRET",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!appUrl) {
    console.error("Missing NEXT_PUBLIC_APP_URL environment variable");
    return new Response(
      JSON.stringify({
        error: "App URL not configured. Missing NEXT_PUBLIC_APP_URL",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const callbackUrl = getOAuthCallbackUrl();
  console.log("🔍 OAuth Callback URL:", callbackUrl);

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    callbackUrl
  );

  const scopes = [
    "https://www.googleapis.com/auth/drive.file", // Access to files created by the app
    "https://www.googleapis.com/auth/drive.readonly", // Read-only access to existing files
    "https://www.googleapis.com/auth/documents.readonly", // Read-only access to Google Docs
    "https://www.googleapis.com/auth/spreadsheets.readonly", // Read-only access to Google Sheets
  ];

  // Get user id from query parameters
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "";

  if (!userId) {
    return new Response(JSON.stringify({ error: "User ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("🔍 Full OAuth configuration:", {
    clientId: clientId ? "Present" : "Missing",
    clientSecret: clientSecret ? "Present" : "Missing",
    callbackUrl,
    scopes,
    userId,
  });

  try {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: userId,
    });

    console.log("🔍 Generated OAuth URL:", url);
    console.log(
      "🔍 Expected redirect URI in Google Console should be:",
      callbackUrl
    );

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate OAuth URL",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
