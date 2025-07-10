import { supabase } from "./supabase-client";
import { User, Session } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

class SessionManager {
  private supabase = supabase;
  private currentUser: User | null = null;
  private currentSession: Session | null = null;
  private listeners: Set<(user: User | null, session: Session | null) => void> =
    new Set();
  private _initialized = false;

  get initialized() {
    return this._initialized;
  }

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;

    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      // Server-side: just mark as initialized with no user
      this._initialized = true;
      this.notifyListeners();
      return;
    }

    try {
      // Get initial session
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        console.error("Session initialization error:", error);
      } else {
        this.currentSession = session;
        this.currentUser = session?.user ?? null;

        // If we have a session but no access token, try to refresh it
        if (session && !session.access_token) {
          try {
            const { data: refreshData, error: refreshError } =
              await this.supabase.auth.refreshSession();
            if (!refreshError && refreshData.session) {
              this.currentSession = refreshData.session;
              this.currentUser = refreshData.session.user;
            }
          } catch (refreshError) {
            console.error("Session refresh error:", refreshError);
          }
        }
      }

      // Set up auth state listener
      this.supabase.auth.onAuthStateChange((event, session) => {
        console.log("🔍 SessionManager - Auth state change:", {
          event,
          userId: session?.user?.id,
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          accessTokenLength: session?.access_token?.length || 0,
        });
        this.currentSession = session;
        this.currentUser = session?.user ?? null;
        this.notifyListeners();
      });

      this._initialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error("SessionManager initialization failed:", error);
      this._initialized = true;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      listener(this.currentUser, this.currentSession);
    });
  }

  // Subscribe to auth state changes
  subscribe(listener: (user: User | null, session: Session | null) => void) {
    this.listeners.add(listener);

    // Immediately call with current state
    if (this.initialized) {
      listener(this.currentUser, this.currentSession);
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get current session
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  // Get current access token
  getAccessToken(): string | null {
    const token = this.currentSession?.access_token || null;
    console.log("🔍 SessionManager - getAccessToken:", {
      hasSession: !!this.currentSession,
      hasAccessToken: !!token,
      tokenLength: token?.length || 0,
      sessionKeys: this.currentSession ? Object.keys(this.currentSession) : [],
    });
    return token;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // Sign in
  async signIn(email: string, password: string) {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }

  // Sign up
  async signUp(email: string, password: string) {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  }

  // Sign out
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  // Sign in with Google
  async signInWithGoogle() {
    if (typeof window === "undefined") {
      return { error: new Error("Cannot sign in with Google on server side") };
    }

    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  }

  // Refresh session
  async refreshSession() {
    console.log("🔍 SessionManager - Manual session refresh requested");
    const { data, error } = await this.supabase.auth.refreshSession();
    if (!error && data.session) {
      console.log("🔍 SessionManager - Manual session refresh successful");
      this.currentSession = data.session;
      this.currentUser = data.session.user;
      this.notifyListeners();
    } else {
      console.error(
        "🔍 SessionManager - Manual session refresh failed:",
        error
      );
    }
    return { data, error };
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

// React hook for using the session manager
export function useSessionManager() {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize with current user from sessionManager if available
    return sessionManager.initialized ? sessionManager.getCurrentUser() : null;
  });
  const [session, setSession] = useState<Session | null>(() => {
    // Initialize with current session from sessionManager if available
    return sessionManager.initialized
      ? sessionManager.getCurrentSession()
      : null;
  });
  const [loading, setLoading] = useState(() => {
    // Start with loading false if sessionManager is already initialized
    return !sessionManager.initialized;
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const unsubscribe = sessionManager.subscribe((user, session) => {
      setUser(user);
      setSession(session);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Return loading state during SSR to prevent hydration mismatch
  if (!mounted) {
    return {
      user: null,
      session: null,
      loading: true,
      isAuthenticated: false,
      accessToken: null,
      signIn: sessionManager.signIn.bind(sessionManager),
      signUp: sessionManager.signUp.bind(sessionManager),
      signOut: sessionManager.signOut.bind(sessionManager),
      signInWithGoogle: sessionManager.signInWithGoogle.bind(sessionManager),
      refreshSession: sessionManager.refreshSession.bind(sessionManager),
    };
  }

  const result = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    accessToken: session?.access_token || null,
    signIn: sessionManager.signIn.bind(sessionManager),
    signUp: sessionManager.signUp.bind(sessionManager),
    signOut: sessionManager.signOut.bind(sessionManager),
    signInWithGoogle: sessionManager.signInWithGoogle.bind(sessionManager),
    refreshSession: sessionManager.refreshSession.bind(sessionManager),
  };

  console.log("🔍 useSessionManager - Hook Result:", {
    hasUser: !!user,
    hasSession: !!session,
    hasAccessToken: !!result.accessToken,
    accessTokenLength: result.accessToken?.length || 0,
    loading,
    isAuthenticated: result.isAuthenticated,
  });

  return result;
}
