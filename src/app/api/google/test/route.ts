import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    // Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const envCheck = {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasAppUrl: !!appUrl,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
    };

    // Test Supabase connection
    let supabaseTest = null;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabase
          .from("google_tokens")
          .select("count")
          .limit(1);

        supabaseTest = {
          success: !error,
          error: error?.message,
          tableExists: true,
        };
      } catch (error) {
        supabaseTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          tableExists: false,
        };
      }
    }

    // Test OAuth URL generation
    let oauthTest = null;
    if (clientId && clientSecret && appUrl) {
      try {
        const { google } = await import("googleapis");
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          `${appUrl}/api/google/callback`
        );

        const url = oauth2Client.generateAuthUrl({
          access_type: "offline",
          scope: [
            "https://www.googleapis.com/auth/drive.file", // Access to files created by the app
            "https://www.googleapis.com/auth/drive.readonly", // Read-only access to existing files
            "https://www.googleapis.com/auth/documents.readonly", // Read-only access to Google Docs
            "https://www.googleapis.com/auth/spreadsheets.readonly", // Read-only access to Google Sheets
          ],
          prompt: "consent",
          state: "test",
        });

        oauthTest = {
          success: true,
          urlGenerated: !!url,
          urlLength: url.length,
        };
      } catch (error) {
        oauthTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      supabase: supabaseTest,
      oauth: oauthTest,
      recommendations: getRecommendations(envCheck, supabaseTest, oauthTest),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function getRecommendations(envCheck: any, supabaseTest: any, oauthTest: any) {
  const recommendations = [];

  // Environment variable recommendations
  if (!envCheck.hasClientId) {
    recommendations.push("Set GOOGLE_CLIENT_ID environment variable");
  }
  if (!envCheck.hasClientSecret) {
    recommendations.push("Set GOOGLE_CLIENT_SECRET environment variable");
  }
  if (!envCheck.hasAppUrl) {
    recommendations.push("Set NEXT_PUBLIC_APP_URL environment variable");
  }
  if (!envCheck.hasSupabaseUrl) {
    recommendations.push("Set NEXT_PUBLIC_SUPABASE_URL environment variable");
  }
  if (!envCheck.hasSupabaseServiceKey) {
    recommendations.push("Set SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  // Supabase recommendations
  if (supabaseTest && !supabaseTest.success) {
    if (!supabaseTest.tableExists) {
      recommendations.push(
        "Run the google-drive-migration.sql in your Supabase SQL editor"
      );
    } else {
      recommendations.push("Check Supabase connection and service role key");
    }
  }

  // OAuth recommendations
  if (oauthTest && !oauthTest.success) {
    recommendations.push("Check Google OAuth credentials and scopes");
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "All systems are configured correctly! You can test the OAuth flow."
    );
  }

  return recommendations;
}
