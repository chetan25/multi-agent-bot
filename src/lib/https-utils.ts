/**
 * Utility functions for handling HTTPS in development
 */

/**
 * Get the appropriate URL scheme (http/https) based on environment
 */
export function getUrlScheme(): "http" | "https" {
  if (process.env.NODE_ENV === "development") {
    // Check if we're running with HTTPS
    const isHttps =
      process.env.HTTPS === "true" ||
      process.env.NEXT_PUBLIC_HTTPS === "true" ||
      process.argv.includes("--experimental-https") ||
      process.argv.includes("dev:https") ||
      process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://");

    return isHttps ? "https" : "http";
  }

  // In production, always use HTTPS
  return "https";
}

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  // If NEXT_PUBLIC_APP_URL is set and has a protocol, use it directly
  if (
    process.env.NEXT_PUBLIC_APP_URL &&
    process.env.NEXT_PUBLIC_APP_URL.includes("://")
  ) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  const scheme = getUrlScheme();
  const host =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    "localhost:3000";

  // Remove protocol if present
  const cleanHost = host.replace(/^https?:\/\//, "");

  return `${scheme}://${cleanHost}`;
}

/**
 * Get the OAuth callback URL
 */
export function getOAuthCallbackUrl(): string {
  // Force HTTPS for OAuth callback in development
  let baseUrl = getBaseUrl();

  // If we're in development and the URL is HTTP, force it to HTTPS
  if (process.env.NODE_ENV === "development" && baseUrl.startsWith("http://")) {
    baseUrl = baseUrl.replace("http://", "https://");
    console.log("🔍 Forcing HTTPS for OAuth callback:", baseUrl);
  }

  const callbackUrl = `${baseUrl}/api/google/callback`;
  console.log("🔍 OAuth Callback URL generated:", callbackUrl);
  return callbackUrl;
}

/**
 * Check if HTTPS is enabled in development
 */
export function isHttpsEnabled(): boolean {
  return getUrlScheme() === "https";
}

/**
 * Get environment-specific configuration
 */
export function getHttpsConfig() {
  return {
    isHttps: isHttpsEnabled(),
    baseUrl: getBaseUrl(),
    oauthCallbackUrl: getOAuthCallbackUrl(),
    scheme: getUrlScheme(),
  };
}

/**
 * Get HTTPS redirect URL for OAuth callbacks
 * Forces HTTPS in development to match OAuth callback URL
 */
export function getHttpsRedirectUrl(path: string): string {
  let baseUrl = getBaseUrl();

  // Force HTTPS for redirects in development to match OAuth callback
  if (process.env.NODE_ENV === "development" && baseUrl.startsWith("http://")) {
    baseUrl = baseUrl.replace("http://", "https://");
    console.log("🔍 Forcing HTTPS for redirect:", baseUrl);
  }

  return `${baseUrl}${path}`;
}
