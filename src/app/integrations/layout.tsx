"use client";
import { GoogleDriveProvider } from "@/contexts/GoogleDriveContext";
import { useSessionManager } from "@/lib/sessionManager";

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useSessionManager();

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return <GoogleDriveProvider>{children}</GoogleDriveProvider>;
}
