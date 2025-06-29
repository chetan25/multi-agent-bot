"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Settings, CheckCircle, Loader2 } from "lucide-react";
import { ProviderSelector } from "./ProviderSelector";
import { useConfigurationStore } from "@/lib/stores/configurationStore";
import { useAuth } from "@/hooks/useAuth";

interface ConfigurationComponentProps {
  onConfigurationComplete?: () => void;
}

export function ConfigurationComponent({
  onConfigurationComplete,
}: ConfigurationComponentProps) {
  const { user } = useAuth();
  const {
    userProviders,
    currentProvider,
    currentModel,
    isConfigured,
    hasAnyConfiguredProvider,
    supportsVision,
    showSettings,
    showSuccessMessage,
    isTransitioning,
    setShowSettings,
    setShowSuccessMessage,
    setIsTransitioning,
  } = useConfigurationStore();

  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  const hasShownSuccessRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  // Check if store is hydrated from localStorage
  useEffect(() => {
    // Zustand persist automatically rehydrates on mount
    // We can detect this by checking if we have any data or if it's the initial state
    const checkHydration = () => {
      // If we have any userProviders or selectedProvider, the store has been hydrated
      if (userProviders.length > 0 || currentProvider) {
        setIsStoreHydrated(true);
        console.log("✅ Configuration store hydrated from localStorage");
      } else {
        // If no data, we still consider it hydrated (empty state is valid)
        setIsStoreHydrated(true);
        console.log("✅ Configuration store hydrated (empty state)");
      }
    };

    // Small delay to ensure Zustand has time to rehydrate
    const timer = setTimeout(checkHydration, 100);
    return () => clearTimeout(timer);
  }, [userProviders.length, currentProvider]);

  // Show success message when provider is configured for the first time (not on refresh)
  useEffect(() => {
    if (
      isConfigured &&
      !hasShownSuccessRef.current &&
      !isInitialLoadRef.current &&
      isStoreHydrated
    ) {
      setShowSuccessMessage(true);
      setIsTransitioning(true);
      hasShownSuccessRef.current = true;

      // Hide success message after 2 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
        setIsTransitioning(false);
        onConfigurationComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [
    isConfigured,
    onConfigurationComplete,
    setShowSuccessMessage,
    setIsTransitioning,
    isStoreHydrated,
  ]);

  // Mark initial load as complete after store is hydrated
  useEffect(() => {
    if (isStoreHydrated) {
      isInitialLoadRef.current = false;
    }
  }, [isStoreHydrated]);

  // Reset success flag when provider changes
  useEffect(() => {
    hasShownSuccessRef.current = false;
  }, [currentProvider?.id]);

  // Show loading state while store is being hydrated
  if (!isStoreHydrated) {
    return (
      <div className="flex-1 flex flex-col justify-center">
        <Card className="w-full min-h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              AI Chat Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
              <p className="text-gray-600">Loading configuration...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show configuration screen only if no provider is configured AND settings are not being shown
  if (!hasAnyConfiguredProvider && !showSettings) {
    return (
      <div className="flex-1 flex flex-col justify-center">
        <Card className="w-full min-h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              AI Chat Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!user?.id ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
                <p className="text-gray-600">Loading user authentication...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 mb-4">
                  Configure an AI provider to start chatting
                </p>
                <Button
                  onClick={() => setShowSettings(true)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Provider
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {showSettings && (
          <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl z-10">
            <CardHeader>
              <CardTitle className="text-lg">Provider Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderSelector />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {showSuccessMessage && (
        <Card
          className={`border-green-200 bg-green-50 transition-all duration-500 flex-shrink-0 ${
            isTransitioning ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Provider configured successfully!
              </span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              You can now start chatting with {currentProvider?.name} -{" "}
              {currentModel?.name}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Provider Info */}
      <Card className="transition-all duration-300 flex-shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-500" />
              {currentProvider?.name || "No Provider Selected"} -{" "}
              {currentModel?.name || "No Model Selected"}
              {supportsVision && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Vision Enabled
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 px-2"
            >
              <Settings className="h-3 w-3 mr-1" />
              {showSettings ? "Hide" : "Settings"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-gray-600">
            {currentModel?.description ||
              "Select a provider and model to start chatting"}
            {supportsVision && (
              <span className="block mt-1 text-green-600">
                ✓ Supports images and file attachments
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="transition-all duration-300 flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-lg">Provider Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <ProviderSelector />
          </CardContent>
        </Card>
      )}

      {/* Placeholder Chat Container when no provider configured but settings shown */}
      {!hasAnyConfiguredProvider && showSettings && (
        <Card className="flex flex-col min-h-[600px] transition-all duration-500 opacity-50">
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-sm">
                  Configure a provider above to start chatting
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
