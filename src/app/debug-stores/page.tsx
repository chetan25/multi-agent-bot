"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProviderConfigStore } from "@/lib/stores/providerConfigStore";
import { useSelectedProviderStore } from "@/lib/stores/selectedProviderStore";
import {
  debugStoreState,
  clearAllPersistedData,
  exportStoreState,
  checkStoreHydration,
  migrateOldData,
  getStorageInfo,
} from "@/lib/stores/storeUtils";
import { PROVIDERS } from "@/lib/types";

export default function DebugStoresPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  const {
    userProviders,
    addProvider,
    updateProviderConfig,
    removeProvider,
    clearAllProviders,
  } = useProviderConfigStore();
  const {
    selectedProvider,
    selectedModel,
    selectProvider,
    selectModel,
    reset,
  } = useSelectedProviderStore();

  useEffect(() => {
    // Run initial debug check
    updateDebugInfo();
    updateStorageInfo();
  }, []);

  const updateDebugInfo = () => {
    const info = {
      providerConfig: {
        userProviders: userProviders.map((p) => ({
          providerId: p.providerId,
          isConfigured: p.isConfigured,
          hasApiKey: !!p.apiKey,
          apiKeyLength: p.apiKey?.length || 0,
        })),
      },
      selectedProvider: {
        selectedProvider,
        selectedModel,
      },
      timestamp: new Date().toISOString(),
    };
    setDebugInfo(info);
  };

  const updateStorageInfo = () => {
    setStorageInfo(getStorageInfo());
  };

  const handleDebugStore = () => {
    debugStoreState();
    updateDebugInfo();
    updateStorageInfo();
  };

  const handleClearAll = () => {
    if (
      confirm(
        "Are you sure you want to clear all persisted data? This cannot be undone."
      )
    ) {
      clearAllPersistedData();
      updateDebugInfo();
      updateStorageInfo();
    }
  };

  const handleExportState = () => {
    const exportData = exportStoreState();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `store-state-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCheckHydration = () => {
    checkStoreHydration();
    updateDebugInfo();
  };

  const handleMigrateOldData = () => {
    migrateOldData();
    updateDebugInfo();
    updateStorageInfo();
  };

  const handleAddTestProvider = () => {
    const testProvider = PROVIDERS[0]; // OpenAI
    addProvider(testProvider);
    updateProviderConfig(testProvider.id, "test-api-key-123");
    updateDebugInfo();
  };

  const handleSelectTestProvider = () => {
    selectProvider("openai");
    selectModel("gpt-4o");
    updateDebugInfo();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Store Debug & Management
        </h1>
        <p className="text-gray-600">
          Debug and manage Zustand store persistence for provider configurations
        </p>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Store Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={handleDebugStore} variant="outline">
              Debug Store
            </Button>
            <Button onClick={handleCheckHydration} variant="outline">
              Check Hydration
            </Button>
            <Button onClick={handleMigrateOldData} variant="outline">
              Migrate Old Data
            </Button>
            <Button onClick={handleExportState} variant="outline">
              Export State
            </Button>
            <Button onClick={handleAddTestProvider} variant="outline">
              Add Test Provider
            </Button>
            <Button onClick={handleSelectTestProvider} variant="outline">
              Select Test Provider
            </Button>
            <Button onClick={clearAllProviders} variant="outline">
              Clear Providers
            </Button>
            <Button onClick={reset} variant="outline">
              Reset Selection
            </Button>
            <Button onClick={handleClearAll} variant="destructive">
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current State */}
      <Card>
        <CardHeader>
          <CardTitle>Current Store State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Provider Config Store</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo?.providerConfig, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Selected Provider Store</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(debugInfo?.selectedProvider, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {storageInfo?.providerConfigSize || 0}
              </div>
              <div className="text-sm text-gray-600">
                Provider Config (bytes)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {storageInfo?.selectedProviderSize || 0}
              </div>
              <div className="text-sm text-gray-600">
                Selected Provider (bytes)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {storageInfo?.oldChatConfigSize || 0}
              </div>
              <div className="text-sm text-gray-600">
                Old Chat Config (bytes)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {storageInfo?.totalSize || 0}
              </div>
              <div className="text-sm text-gray-600">Total (bytes)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Local Storage Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>Local Storage Raw Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">provider-config-store</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                {localStorage.getItem("provider-config-store") || "No data"}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">selected-provider-store</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                {localStorage.getItem("selected-provider-store") || "No data"}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">chat-config (old)</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                {localStorage.getItem("chat-config") || "No data"}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
