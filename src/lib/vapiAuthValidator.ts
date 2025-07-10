import { createClient } from "@supabase/supabase-js";

/**
 * Validates a Vapi request by checking the access token
 * This function can be used in backend API routes that are called by Vapi
 */
export async function validateVapiRequest(accessToken: string): Promise<{
  isValid: boolean;
  user?: any;
  error?: string;
}> {
  try {
    if (!accessToken) {
      return {
        isValid: false,
        error: "Access token is required",
      };
    }

    // Create Supabase client with the access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Verify the token by getting the user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        isValid: false,
        error: "Invalid access token",
      };
    }

    return {
      isValid: true,
      user,
    };
  } catch (error) {
    console.error("Error validating Vapi request:", error);
    return {
      isValid: false,
      error: "Token validation failed",
    };
  }
}

/**
 * Extracts and validates access token from Vapi function call parameters
 * This is a convenience function for use in API routes
 */
export async function validateVapiFunctionCall(functionCall: {
  name: string;
  parameters: Record<string, any>;
}): Promise<{
  isValid: boolean;
  user?: any;
  error?: string;
  parameters?: Record<string, any>;
}> {
  try {
    // Extract access token from parameters
    const accessToken = functionCall.parameters?.accessToken;

    if (!accessToken) {
      return {
        isValid: false,
        error: "Access token not found in function call parameters",
      };
    }

    // Validate the token
    const validation = await validateVapiRequest(accessToken);

    if (!validation.isValid) {
      return validation;
    }

    // Remove access token from parameters before returning
    const { accessToken: _, ...cleanParameters } = functionCall.parameters;

    return {
      isValid: true,
      user: validation.user,
      parameters: cleanParameters,
    };
  } catch (error) {
    console.error("Error validating Vapi function call:", error);
    return {
      isValid: false,
      error: "Function call validation failed",
    };
  }
}
