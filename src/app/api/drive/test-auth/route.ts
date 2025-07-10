import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    // Test authentication
    const user = await getAuthenticatedUser();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      message: "Authentication successful",
    });
  } catch (error) {
    console.error("Auth test error:", error);

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized",
            message: "User not authenticated",
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unknown error",
        message: "Authentication failed",
      },
      { status: 500 }
    );
  }
}
