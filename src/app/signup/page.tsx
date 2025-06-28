"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.push(redirectTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router, redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign up to get started with your account
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#3b82f6",
                    brandAccent: "#2563eb",
                  },
                },
              },
              style: {
                button: {
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                },
                input: {
                  borderRadius: "8px",
                  fontSize: "14px",
                },
                label: {
                  fontSize: "14px",
                  fontWeight: "500",
                },
              },
            }}
            providers={["google"]}
            redirectTo={`${
              window.location.origin
            }/auth/callback?next=${encodeURIComponent(redirectTo)}`}
            showLinks={true}
            view="sign_up"
            theme="default"
          />
        </div>
      </div>
    </div>
  );
}
