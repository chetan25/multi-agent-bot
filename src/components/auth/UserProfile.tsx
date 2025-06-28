"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function UserProfile() {
  const supabase = createClient();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile & Authentication</CardTitle>
            <CardDescription>
              Update your account information and manage authentication methods
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              view="update_password"
              theme="default"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
