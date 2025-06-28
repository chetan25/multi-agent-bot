import { useProviderConfigStore } from "./providerConfigStore";
import { useSelectedProviderStore } from "./selectedProviderStore";

/**
 * Utility functions for managing Zustand stores
 */

// Debug function to log current store state
export const debugStoreState = () => {
  const providerConfig = useProviderConfigStore.getState();
  const selectedProvider = useSelectedProviderStore.getState();

  console.log("=== STORE STATE DEBUG ===");
  console.log("Provider Config Store:", {
    userProviders: providerConfig.userProviders.map((p) => ({
      providerId: p.providerId,
      isConfigured: p.isConfigured,
      hasApiKey: !!p.apiKey,
    })),
  });
  console.log("Selected Provider Store:", {
    selectedProvider: selectedProvider.selectedProvider,
    selectedModel: selectedProvider.selectedModel,
  });
  console.log("==========================");
};

// Function to clear all persisted data
export const clearAllPersistedData = () => {
  console.log("🗑️ Clearing all persisted data");

  // Clear provider config store
  useProviderConfigStore.getState().clearAllProviders();

  // Clear selected provider store
  useSelectedProviderStore.getState().reset();

  // Clear localStorage directly
  localStorage.removeItem("provider-config-store");
  localStorage.removeItem("selected-provider-store");
  localStorage.removeItem("chat-config"); // Remove old storage key

  console.log("✅ All persisted data cleared");
};

// Function to export store state for debugging
export const exportStoreState = () => {
  const providerConfig = useProviderConfigStore.getState();
  const selectedProvider = useSelectedProviderStore.getState();

  const exportData = {
    timestamp: new Date().toISOString(),
    providerConfig: {
      userProviders: providerConfig.userProviders.map((p) => ({
        providerId: p.providerId,
        isConfigured: p.isConfigured,
        hasApiKey: !!p.apiKey,
        apiKeyLength: p.apiKey?.length || 0,
      })),
    },
    selectedProvider: {
      selectedProvider: selectedProvider.selectedProvider,
      selectedModel: selectedProvider.selectedModel,
    },
  };

  console.log("📤 Store state export:", exportData);
  return exportData;
};

// Function to check if stores are properly hydrated
export const checkStoreHydration = () => {
  const providerConfig = useProviderConfigStore.getState();
  const selectedProvider = useSelectedProviderStore.getState();

  const hydrationStatus = {
    providerConfigHydrated: providerConfig.userProviders.length > 0 || true, // Always true if store exists
    selectedProviderHydrated: selectedProvider.selectedProvider !== undefined,
    timestamp: new Date().toISOString(),
  };

  console.log("🔍 Store hydration status:", hydrationStatus);
  return hydrationStatus;
};

// Function to migrate old data (if needed)
export const migrateOldData = () => {
  console.log("🔄 Checking for old data to migrate...");

  const oldChatConfig = localStorage.getItem("chat-config");
  if (oldChatConfig) {
    try {
      const parsed = JSON.parse(oldChatConfig);
      console.log("📦 Found old chat-config data:", parsed);

      // The stores will handle migration automatically via their migrate functions
      console.log("✅ Migration will be handled by store migrate functions");
    } catch (error) {
      console.error("❌ Error parsing old chat-config:", error);
    }
  } else {
    console.log("✅ No old data found to migrate");
  }
};

// Function to get storage usage info
export const getStorageInfo = () => {
  const storageInfo = {
    providerConfigSize:
      localStorage.getItem("provider-config-store")?.length || 0,
    selectedProviderSize:
      localStorage.getItem("selected-provider-store")?.length || 0,
    oldChatConfigSize: localStorage.getItem("chat-config")?.length || 0,
    totalSize: 0,
  };

  storageInfo.totalSize =
    storageInfo.providerConfigSize +
    storageInfo.selectedProviderSize +
    storageInfo.oldChatConfigSize;

  console.log("💾 Storage usage:", storageInfo);
  return storageInfo;
};
