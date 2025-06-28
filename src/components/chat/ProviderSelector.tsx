"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PROVIDERS, Provider, Model, UserProviderConfig } from "@/lib/types";
import { useProviderConfigStore } from "@/lib/stores/providerConfigStore";
import { useSelectedProviderStore } from "@/lib/stores/selectedProviderStore";
import { ProviderConfig } from "./ProviderConfig";
import {
  Settings,
  ChevronDown,
  ChevronUp,
  Bot,
  Sparkles,
  CheckCircle,
} from "lucide-react";

export function ProviderSelector() {
  const {
    userProviders,
    addProvider,
    updateProviderConfig,
    removeProvider,
    getProviderConfig,
    isProviderConfigured,
  } = useProviderConfigStore();

  const {
    selectedProvider,
    selectedModel,
    selectProvider,
    selectModel,
    getCurrentProvider,
    getCurrentModel,
  } = useSelectedProviderStore();

  const [showConfig, setShowConfig] = useState(false);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [justConfigured, setJustConfigured] = useState<string | null>(null);

  const currentProvider = getCurrentProvider();
  const currentModel = getCurrentModel();

  const handleProviderSelect = (providerId: string) => {
    console.log("handleProviderSelect", providerId);
    if (isProviderConfigured(providerId)) {
      selectProvider(providerId);
      setShowSuccess(true);

      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    }
  };

  const handleModelSelect = (modelId: string) => {
    selectModel(modelId);
  };

  const handleProviderConfigSave = (providerConfig: UserProviderConfig) => {
    // First add the provider if it doesn't exist
    const provider = PROVIDERS.find((p) => p.id === providerConfig.providerId);
    if (provider) {
      addProvider(provider);
    }

    // Then update the configuration
    updateProviderConfig(providerConfig.providerId, providerConfig.apiKey);
    setJustConfigured(providerConfig.providerId);

    // Auto-select the provider if it's the first one being configured
    if (userProviders.length === 0) {
      selectProvider(providerConfig.providerId);
    }

    // Clear the "just configured" state after a delay
    setTimeout(() => {
      setJustConfigured(null);
    }, 3000);
  };

  const handleProviderConfigRemove = (providerId: string) => {
    removeProvider(providerId);
  };

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {showSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">
            Provider selected successfully! You can now start chatting.
          </span>
        </div>
      )}

      {/* Current Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Current AI Provider
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className="h-6 px-2"
            >
              <Settings className="h-3 w-3 mr-1" />
              {showConfig ? "Hide" : "Configure"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {currentProvider && currentModel ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{currentProvider.name}</p>
                  <p className="text-xs text-gray-500">{currentModel.name}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Sparkles className="h-3 w-3" />
                  Active
                </div>
              </div>
              <p className="text-xs text-gray-600">
                {currentModel.description}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No provider configured</p>
          )}
        </CardContent>
      </Card>

      {/* Provider Configuration */}
      {showConfig && (
        <div className="space-y-4">
          <Separator />

          {/* Available Providers */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Available Providers
            </h3>
            {PROVIDERS.map((provider) => {
              const isConfigured = isProviderConfigured(provider.id);
              const isSelected = selectedProvider === provider.id;
              const isExpanded = expandedProvider === provider.id;
              const wasJustConfigured = justConfigured === provider.id;

              return (
                <Card
                  key={provider.id}
                  className={`${
                    isSelected ? "border-blue-200 bg-blue-50" : ""
                  } ${wasJustConfigured ? "border-green-200 bg-green-50" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isConfigured ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        {provider.name}
                        {wasJustConfigured && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Just configured
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isConfigured && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProviderSelect(provider.id)}
                            disabled={isSelected}
                            className="h-6 px-2 text-xs"
                          >
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedProvider(isExpanded ? null : provider.id)
                          }
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0 space-y-3">
                      <p className="text-xs text-gray-600">
                        {provider.description}
                      </p>

                      {/* Provider Configuration */}
                      <ProviderConfig
                        provider={provider}
                        currentConfig={getProviderConfig(provider.id)}
                        onSave={handleProviderConfigSave}
                        onRemove={() => handleProviderConfigRemove(provider.id)}
                      />

                      {/* Model Selection */}
                      {isConfigured && (
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-700">
                            Select Model
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {provider.models.map((model) => (
                              <Button
                                key={model.id}
                                variant={
                                  selectedModel === model.id
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handleModelSelect(model.id)}
                                className="justify-start text-xs h-8"
                                disabled={!isSelected}
                              >
                                <div className="text-left">
                                  <div className="font-medium">
                                    {model.name}
                                  </div>
                                  <div className="text-xs opacity-70">
                                    {model.description}
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
