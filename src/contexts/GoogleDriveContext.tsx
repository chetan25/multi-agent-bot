"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useSessionManager } from "@/lib/sessionManager";
import { supabase } from "@/lib/supabase-client";

interface GoogleDriveState {
  isConnected: boolean;
  isChecking: boolean;
  error: string | null;
  tokens: {
    refresh_token: string | null;
    access_token: string | null;
    token_expiry: string | null;
  } | null;
}

interface GoogleDriveContextType extends GoogleDriveState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnectionStatus: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  getValidAccessToken: () => Promise<string | null>;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(
  undefined
);

export function GoogleDriveProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useSessionManager();
  const [state, setState] = useState<GoogleDriveState>({
    isConnected: false,
    isChecking: true,
    error: null,
    tokens: null,
  });

  // Check if user has Google Drive connected
  const checkConnectionStatus = useCallback(async () => {
    console.log({ user });

    // Ensure user is available
    if (!user) {
      return;
    }

    try {
      console.log("🔍 Checking Google Drive connection for user:", user.id);
      setState((prev) => ({ ...prev, isChecking: true, error: null }));

      console.log("🔍 Querying google_tokens table for user:", user.id);
      const { data, error } = await supabase
        .from("google_tokens")
        .select("refresh_token, access_token, token_expiry")
        .eq("user_id", user.id)
        .single();

      console.log("📊 Database query result:", {
        data,
        error,
        hasData: !!data,
        hasRefreshToken: !!data?.refresh_token,
        hasAccessToken: !!data?.access_token,
        errorCode: error?.code,
        errorMessage: error?.message,
      });

      if (error && error.code !== "PGRST116") {
        console.error("❌ Error checking Google Drive connection:", error);
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isChecking: false,
          error: `Failed to check connection status: ${error.message}`,
          tokens: null,
        }));
        return;
      }

      const isConnected = !!data?.refresh_token;
      const tokens = data
        ? {
            refresh_token: data.refresh_token,
            access_token: data.access_token,
            token_expiry: data.token_expiry,
          }
        : null;

      console.log("✅ Connection status determined:", {
        isConnected,
        hasToken: !!data?.refresh_token,
        hasAccessToken: !!data?.access_token,
        tokenExpiry: data?.token_expiry,
      });

      setState((prev) => ({
        ...prev,
        isConnected,
        isChecking: false,
        error: null,
        tokens,
      }));
    } catch (error) {
      console.error("❌ Exception in checkConnectionStatus:", error);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isChecking: false,
        error: `Failed to check connection status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        tokens: null,
      }));
    }
  }, [user]);

  // Connect to Google Drive
  const connect = useCallback(async () => {
    console.log({ user });
    if (!user) {
      setState((prev) => ({
        ...prev,
        error: "No user available",
      }));
      return;
    }

    setState((prev) => ({ ...prev, error: null }));

    try {
      const response = await fetch(`/api/google/auth-url?userId=${user.id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Failed to get OAuth URL - no URL or error returned");
      }
    } catch (error) {
      console.error("Error connecting to Google Drive:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to connect to Google Drive. Please try again.";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [user]);

  // Disconnect from Google Drive
  const disconnect = useCallback(async () => {
    if (!user) {
      setState((prev) => ({
        ...prev,
        error: "No user available",
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, error: null }));

      const { error } = await supabase
        .from("google_tokens")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Error disconnecting Google Drive:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to disconnect from Google Drive",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: null,
        tokens: null,
      }));
    } catch (error) {
      console.error("Error disconnecting Google Drive:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to disconnect from Google Drive",
      }));
    }
  }, [user]);

  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!state.tokens?.refresh_token) {
      console.log("❌ No refresh token available");
      return null;
    }

    try {
      console.log("🔄 Refreshing access token...");

      // Call our backend API to refresh the token
      const response = await fetch("/api/drive/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: state.tokens.refresh_token,
        }),
      });

      if (!response.ok) {
        console.error(
          "❌ Failed to refresh access token:",
          response.statusText
        );
        return null;
      }

      const tokenData = await response.json();
      const { access_token, expires_in } = tokenData;

      if (!access_token) {
        console.error("❌ No access token in refresh response");
        return null;
      }

      // Calculate expiry time
      const tokenExpiry = new Date(
        Date.now() + expires_in * 1000
      ).toISOString();

      // Update tokens in state
      setState((prev) => ({
        ...prev,
        tokens: {
          ...prev.tokens!,
          access_token,
          token_expiry: tokenExpiry,
        },
      }));

      // Update tokens in database
      if (user) {
        const { error } = await supabase
          .from("google_tokens")
          .update({
            access_token,
            token_expiry: tokenExpiry,
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("❌ Failed to update tokens in database:", error);
        }
      }

      console.log("✅ Access token refreshed successfully");
      return access_token;
    } catch (error) {
      console.error("❌ Error refreshing access token:", error);
      return null;
    }
  }, [state.tokens?.refresh_token, user]);

  // Get a valid access token (refresh if needed)
  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (!state.tokens?.access_token) {
      console.log("❌ No access token available");
      return null;
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    const now = new Date();
    const expiry = state.tokens.token_expiry
      ? new Date(state.tokens.token_expiry)
      : null;
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (!expiry || expiry <= fiveMinutesFromNow) {
      console.log("🔄 Access token expired or expiring soon, refreshing...");
      return await refreshAccessToken();
    }

    console.log("✅ Access token is still valid");
    return state.tokens.access_token;
  }, [
    state.tokens?.access_token,
    state.tokens?.token_expiry,
    refreshAccessToken,
  ]);

  // Check connection status once on mount and when user changes
  useEffect(() => {
    // Check connection status if user is available
    if (user) {
      console.log("🔄 Connection status check triggered for user:", user.id);
      checkConnectionStatus();
    } else {
      // Reset state when no user is available
      // setState((prev) => ({
      //   ...prev,
      //   isConnected: false,
      //   isChecking: false,
      //   error: null,
      //   tokens: null,
      // }));
    }
  }, [user?.id]); // Depend on user.id specifically

  const value: GoogleDriveContextType = useMemo(
    () => ({
      // Only include the specific state properties we need
      isConnected: state.isConnected,
      isChecking: state.isChecking,
      error: state.error,
      tokens: state.tokens,
      connect,
      disconnect,
      checkConnectionStatus,
      refreshAccessToken,
      getValidAccessToken,
    }),
    [
      // Only depend on the specific state properties, not the entire state object
      state.isConnected,
      state.isChecking,
      state.error,
      state.tokens,
      connect,
      disconnect,
      checkConnectionStatus,
      refreshAccessToken,
      getValidAccessToken,
    ]
  );

  return (
    <GoogleDriveContext.Provider value={value}>
      {children}
    </GoogleDriveContext.Provider>
  );
}

export function useGoogleDrive() {
  const context = useContext(GoogleDriveContext);
  if (context === undefined) {
    throw new Error("useGoogleDrive must be used within a GoogleDriveProvider");
  }
  return context;
}
