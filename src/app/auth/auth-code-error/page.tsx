"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const description = searchParams.get("description");

  const getErrorDetails = (errorCode: string | null) => {
    switch (errorCode) {
      case "no_code":
        return {
          title: "No Authorization Code",
          message: "The OAuth provider didn't return an authorization code.",
          solution:
            "Try signing in again. If the problem persists, check your OAuth configuration.",
        };
      case "exchange_failed":
        return {
          title: "Code Exchange Failed",
          message: "Failed to exchange the authorization code for a session.",
          solution:
            "This usually indicates a configuration issue. Check your Supabase settings and environment variables.",
        };
      case "no_session":
        return {
          title: "No Session Created",
          message:
            "The authorization code was exchanged but no session was created.",
          solution:
            "Check your Supabase authentication configuration and ensure the Google provider is properly enabled.",
        };
      case "unexpected":
        return {
          title: "Unexpected Error",
          message: "An unexpected error occurred during authentication.",
          solution:
            "Check the browser console and server logs for more details.",
        };
      default:
        return {
          title: "Authentication Error",
          message:
            description ||
            "An error occurred during the authentication process.",
          solution:
            "Try signing in again or contact support if the problem persists.",
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {errorDetails.title}
          </h1>
          <p className="mt-2 text-sm text-gray-600">{errorDetails.message}</p>
        </div>

        <div className="bg-white py-6 px-4 shadow rounded-lg">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Error Details
              </h3>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Error Code:</strong> {error || "unknown"}
                </p>
                {description && (
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Description:</strong> {description}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900">Solution</h3>
              <p className="mt-2 text-sm text-gray-700">
                {errorDetails.solution}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">
                Troubleshooting Steps
              </h3>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                <li>
                  Check that Google OAuth is enabled in your Supabase project
                </li>
                <li>Verify your Google OAuth credentials are correct</li>
                <li>
                  Ensure redirect URIs match between Google Console and Supabase
                </li>
                <li>Check your environment variables are properly set</li>
                <li>Restart your development server</li>
              </ol>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <Link
                  href="/signin"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Try Again
                </Link>
                <Link
                  href="/"
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
