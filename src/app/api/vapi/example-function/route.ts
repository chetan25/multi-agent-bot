import { NextRequest, NextResponse } from "next/server";
import { validateVapiFunctionCall } from "@/lib/vapiAuthValidator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the Vapi function call
    const validation = await validateVapiFunctionCall(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 401 }
      );
    }

    // At this point, we have a valid user and clean parameters
    const { user, parameters } = validation;

    console.log("Vapi function call validated for user:", user.id);
    console.log("Function parameters:", parameters);

    // Example: Handle different function types
    switch (body.name) {
      case "create_file":
        // Handle file creation with validated user
        return NextResponse.json({
          success: true,
          message: `File creation request for user ${user.email}`,
          data: {
            userId: user.id,
            userEmail: user.email,
            parameters,
          },
        });

      case "search_files":
        // Handle file search with validated user
        return NextResponse.json({
          success: true,
          message: `File search request for user ${user.email}`,
          data: {
            userId: user.id,
            userEmail: user.email,
            parameters,
          },
        });

      default:
        return NextResponse.json({
          success: true,
          message: `Function ${body.name} executed for user ${user.email}`,
          data: {
            userId: user.id,
            userEmail: user.email,
            parameters,
          },
        });
    }
  } catch (error) {
    console.error("Error processing Vapi function call:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
