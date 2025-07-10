import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface VapiSession {
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface VapiRequest {
  sessionId: string;
  userId: string;
  [key: string]: any;
}

/**
 * Validate Vapi session and user authorization
 */
export async function validateVapiSession(
  sessionId: string,
  userId: string
): Promise<{
  isValid: boolean;
  user?: any;
  session?: VapiSession;
  error?: string;
}> {
  try {
    // Validate required parameters
    if (!sessionId || !userId) {
      return {
        isValid: false,
        error: "Missing session ID or user ID",
      };
    }

    // Check if user exists in Supabase
    const { data: user, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !user.user) {
      return {
        isValid: false,
        error: "User not found or invalid",
      };
    }

    // TODO: Implement session validation logic
    // For now, we'll assume the session is valid if user exists
    // In a production environment, you would:
    // 1. Store active sessions in database
    // 2. Check session expiry
    // 3. Validate session belongs to user
    // 4. Check if session is still active

    const session: VapiSession = {
      sessionId,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      isActive: true,
    };

    return {
      isValid: true,
      user: user.user,
      session,
    };
  } catch (error) {
    console.error("Error validating Vapi session:", error);
    return {
      isValid: false,
      error: "Session validation failed",
    };
  }
}

/**
 * Create a new Vapi session
 */
export async function createVapiSession(
  sessionId: string,
  userId: string
): Promise<{
  success: boolean;
  session?: VapiSession;
  error?: string;
}> {
  try {
    // Validate user exists
    const { data: user, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !user.user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const session: VapiSession = {
      sessionId,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      isActive: true,
    };

    // TODO: Store session in database for validation
    // This would typically be stored in a sessions table

    return {
      success: true,
      session,
    };
  } catch (error) {
    console.error("Error creating Vapi session:", error);
    return {
      success: false,
      error: "Failed to create session",
    };
  }
}

/**
 * End a Vapi session
 */
export async function endVapiSession(
  sessionId: string,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // TODO: Mark session as inactive in database
    // This would typically update the sessions table

    console.log(`Session ended: ${sessionId} for user: ${userId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error ending Vapi session:", error);
    return {
      success: false,
      error: "Failed to end session",
    };
  }
}

/**
 * Rate limiting for Vapi requests
 */
export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: string;
}> {
  // TODO: Implement rate limiting logic
  // This would typically check against a rate limiting service or database

  return {
    allowed: true,
    remaining: 100,
    resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
  };
}
