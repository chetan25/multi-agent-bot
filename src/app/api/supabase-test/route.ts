import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check if variables exist
    const envCheck = {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      anonKeyLength: supabaseAnonKey?.length || 0,
      serviceKeyLength: supabaseServiceKey?.length || 0,
    };

    // Test anon key connection
    let anonTest = null;
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabaseAnon
          .from("google_tokens")
          .select("count")
          .limit(1);

        anonTest = {
          success: !error,
          error: error?.message,
          canRead: true,
        };
      } catch (error) {
        anonTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          canRead: false,
        };
      }
    }

    // Test service role key connection
    let serviceTest: any = null;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabaseService
          .from("google_tokens")
          .select("count")
          .limit(1);

        serviceTest = {
          success: !error,
          error: error?.message,
          canRead: true,
          canWrite: false,
          writeError: undefined,
        };

        // Test write operation (only service role can do this)
        if (!error) {
          const { error: writeError } = await supabaseService
            .from("google_tokens")
            .select("id")
            .limit(1);

          serviceTest.canWrite = !writeError;
          serviceTest.writeError = writeError?.message;
        }
      } catch (error) {
        serviceTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          canRead: false,
          canWrite: false,
        };
      }
    }

    // Test table existence
    let tableTest = null;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabaseService
          .from("google_tokens")
          .select("*")
          .limit(1);

        tableTest = {
          exists: !error || error.code !== "PGRST116",
          error: error?.message,
          errorCode: error?.code,
        };
      } catch (error) {
        tableTest = {
          exists: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      anonKey: anonTest,
      serviceKey: serviceTest,
      table: tableTest,
      recommendations: getRecommendations(
        envCheck,
        anonTest,
        serviceTest,
        tableTest
      ),
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

function getRecommendations(
  envCheck: any,
  anonTest: any,
  serviceTest: any,
  tableTest: any
) {
  const recommendations = [];

  // Environment variable recommendations
  if (!envCheck.hasUrl) {
    recommendations.push("Set NEXT_PUBLIC_SUPABASE_URL environment variable");
  }
  if (!envCheck.hasAnonKey) {
    recommendations.push(
      "Set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable"
    );
  }
  if (!envCheck.hasServiceKey) {
    recommendations.push("Set SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  // Key format recommendations
  if (envCheck.hasServiceKey && envCheck.serviceKeyLength < 100) {
    recommendations.push(
      "Service role key seems too short. Check if you copied the full key"
    );
  }
  if (envCheck.hasServiceKey && !envCheck.serviceKey.startsWith?.("eyJ")) {
    recommendations.push(
      "Service role key should start with 'eyJ'. Check if you copied the correct key"
    );
  }

  // Connection recommendations
  if (serviceTest && !serviceTest.success) {
    if (serviceTest.error?.includes("Invalid API key")) {
      recommendations.push(
        "Invalid service role key. Get the correct key from Supabase Dashboard > Settings > API"
      );
    } else if (serviceTest.error?.includes("JWT")) {
      recommendations.push(
        "Service role key format error. Make sure it's the complete key without spaces"
      );
    } else {
      recommendations.push(
        "Service role connection failed. Check your Supabase URL and key"
      );
    }
  }

  // Table recommendations
  if (tableTest && !tableTest.exists) {
    if (tableTest.errorCode === "PGRST116") {
      recommendations.push(
        "google_tokens table doesn't exist. Run the google-drive-migration.sql in Supabase SQL editor"
      );
    } else {
      recommendations.push(
        "Cannot access google_tokens table. Check RLS policies and table permissions"
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("All Supabase configurations are correct!");
  }

  return recommendations;
}
