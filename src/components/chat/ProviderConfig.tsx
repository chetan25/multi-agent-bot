"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PROVIDERS, Provider, UserProviderConfig } from "@/lib/types";
import {
  Eye,
  EyeOff,
  Check,
  X,
  Settings,
  Key,
  CheckCircle,
} from "lucide-react";

interface ProviderConfigProps {
  provider: Provider;
  currentConfig?: UserProviderConfig;
  onSave: (config: UserProviderConfig) => void;
  onRemove: () => void;
}

export function ProviderConfig({
  provider,
  currentConfig,
  onSave,
  onRemove,
}: ProviderConfigProps) {
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditing, setIsEditing] = useState(!currentConfig?.isConfigured);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update state when currentConfig changes
  useEffect(() => {
    setApiKey(currentConfig?.apiKey || "");
    setIsEditing(!currentConfig?.isConfigured);
  }, [currentConfig]);

  const handleSave = async () => {
    if (!apiKey.trim()) return;

    setIsLoading(true);
    try {
      // Here you could validate the API key by making a test call
      const config: UserProviderConfig = {
        providerId: provider.id,
        apiKey: apiKey.trim(),
        isConfigured: true,
      };
      onSave(config);
      setIsEditing(false);
      setShowSuccess(true);

      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error saving provider config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = () => {
    setApiKey("");
    setIsEditing(true);
    onRemove();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowSuccess(false);
  };

  if (!isEditing && currentConfig?.isConfigured) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              {provider.name} - Configured
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-6 w-6 p-0"
                title="Edit configuration"
              >
                <Settings className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                title="Remove configuration"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-xs text-green-700">
            <Key className="h-3 w-3" />
            API Key configured
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{provider.name} Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showSuccess && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              Configuration saved successfully!
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            API Key
          </label>
          <div className="relative">
            <Input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${provider.name} API key`}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-0 top-0 h-full px-3"
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!apiKey.trim() || isLoading}
            size="sm"
            className="flex-1"
          >
            {isLoading ? "Saving..." : "Save Configuration"}
          </Button>
          {currentConfig && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              size="sm"
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>Your API key is stored locally and never sent to our servers.</p>
          <p>Get your API key from: {provider.name} dashboard</p>
        </div>
      </CardContent>
    </Card>
  );
}
