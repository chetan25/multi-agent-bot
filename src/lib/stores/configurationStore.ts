import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getProviderById,
  Provider,
  Model,
  UserProviderConfig,
  ChatConfig,
} from "@/lib/types";

interface ConfigurationState {
  // Provider configuration
  userProviders: UserProviderConfig[];
  selectedProvider: string;
  selectedModel: string;

  // UI state
  showSettings: boolean;
  showSuccessMessage: boolean;
  isTransitioning: boolean;

  // Computed values (will be updated when state changes)
  currentProvider: Provider | undefined;
  currentModel: Model | undefined;
  isConfigured: boolean;
  hasAnyConfiguredProvider: boolean;
  supportsVision: boolean;
  supportsImageGeneration: boolean;
  providerConfig: UserProviderConfig | undefined;

  // Actions
  addProvider: (provider: Provider) => void;
  updateProviderConfig: (providerId: string, apiKey: string) => void;
  removeProvider: (providerId: string) => void;
  selectProvider: (providerId: string) => void;
  selectModel: (modelId: string) => void;
  setShowSettings: (show: boolean) => void;
  setShowSuccessMessage: (show: boolean) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  getProviderConfig: (providerId: string) => UserProviderConfig | undefined;
  isProviderConfigured: (providerId: string) => boolean;
  clearAllProviders: () => void;
  reset: () => void;
  getSelectedProviderId: () => string;
  getSelectedModelId: () => string;
  _updateComputedValues: (state: any) => any;
}

export const useConfigurationStore = create<ConfigurationState>()(
  persist(
    (set, get) => ({
      // Initial state
      userProviders: [],
      selectedProvider: "",
      selectedModel: "",
      showSettings: false,
      showSuccessMessage: false,
      isTransitioning: false,
      currentProvider: undefined,
      currentModel: undefined,
      isConfigured: false,
      hasAnyConfiguredProvider: false,
      supportsVision: false,
      supportsImageGeneration: false,
      providerConfig: undefined,

      // Helper function to update computed values
      _updateComputedValues: (state: any) => {
        const currentProvider = state.selectedProvider
          ? getProviderById(state.selectedProvider)
          : undefined;
        const currentModel =
          currentProvider && state.selectedModel
            ? currentProvider.models.find(
                (m: any) => m.id === state.selectedModel
              )
            : undefined;
        const providerConfig = state.selectedProvider
          ? state.userProviders.find(
              (p: any) => p.providerId === state.selectedProvider
            )
          : undefined;
        const isConfigured = providerConfig?.isConfigured || false;
        const hasAnyConfiguredProvider = state.userProviders.some(
          (p: any) => p.isConfigured
        );
        const supportsVision = currentModel?.supportsVision || false;
        const supportsImageGeneration =
          currentModel?.supportsImageGeneration || false;

        return {
          currentProvider,
          currentModel,
          isConfigured,
          hasAnyConfiguredProvider,
          supportsVision,
          supportsImageGeneration,
          providerConfig,
        };
      },

      // Provider management actions
      addProvider: (provider: Provider) => {
        console.log("➕ Adding provider:", provider.name);
        set((state) => {
          const existingIndex = state.userProviders.findIndex(
            (p) => p.providerId === provider.id
          );
          let newProviders;

          if (existingIndex >= 0) {
            // Update existing provider config
            newProviders = [...state.userProviders];
            newProviders[existingIndex] = {
              ...newProviders[existingIndex],
              providerId: provider.id,
            };
            console.log("🔄 Updated existing provider config:", provider.name);
          } else {
            // Add new provider config
            const newProviderConfig: UserProviderConfig = {
              providerId: provider.id,
              apiKey: "",
              isConfigured: false,
            };
            newProviders = [...state.userProviders, newProviderConfig];
            console.log("➕ Added new provider config:", provider.name);
          }

          const newState = { ...state, userProviders: newProviders };
          const computedValues = get()._updateComputedValues(newState);

          return { ...newState, ...computedValues };
        });
      },

      updateProviderConfig: (providerId: string, apiKey: string) => {
        console.log("🔧 Updating provider config:", providerId);
        set((state) => {
          const newProviders = state.userProviders.map((provider) =>
            provider.providerId === providerId
              ? { ...provider, apiKey, isConfigured: true }
              : provider
          );

          const newState = { ...state, userProviders: newProviders };
          const computedValues = get()._updateComputedValues(newState);

          console.log("✅ Provider config updated:", {
            providerId,
            newProviders: newProviders.map((p) => ({
              id: p.providerId,
              configured: p.isConfigured,
            })),
            computedValues,
          });

          return { ...newState, ...computedValues };
        });
      },

      removeProvider: (providerId: string) => {
        console.log("🗑️ Removing provider:", providerId);
        set((state) => {
          const newProviders = state.userProviders.filter(
            (p) => p.providerId !== providerId
          );

          const newState = { ...state, userProviders: newProviders };
          const computedValues = get()._updateComputedValues(newState);

          return { ...newState, ...computedValues };
        });
      },

      selectProvider: (providerId: string) => {
        console.log("🎯 Selecting provider:", providerId);
        const provider = getProviderById(providerId);
        if (provider) {
          const newModelId =
            provider.models.length > 0 ? provider.models[0].id : "";

          set((state) => {
            const newState = {
              ...state,
              selectedProvider: providerId,
              selectedModel: newModelId,
            };
            const computedValues = get()._updateComputedValues(newState);

            console.log("🔄 Selected provider state:", {
              selectedProvider: providerId,
              selectedModel: newModelId,
              computedValues,
            });

            return { ...newState, ...computedValues };
          });
        }
      },

      selectModel: (modelId: string) => {
        console.log("🎯 Selecting model:", modelId);
        set((state) => {
          const newState = { ...state, selectedModel: modelId };
          const computedValues = get()._updateComputedValues(newState);

          console.log("🔄 Selected model state:", {
            selectedModel: modelId,
            computedValues,
          });

          return { ...newState, ...computedValues };
        });
      },

      // UI state actions
      setShowSettings: (show: boolean) => {
        set({ showSettings: show });
      },

      setShowSuccessMessage: (show: boolean) => {
        set({ showSuccessMessage: show });
      },

      setIsTransitioning: (transitioning: boolean) => {
        set({ isTransitioning: transitioning });
      },

      // Utility actions
      getProviderConfig: (providerId: string) => {
        const provider = get().userProviders.find(
          (p) => p.providerId === providerId
        );
        console.log("🔍 Provider config for", providerId, ":", provider);
        return provider;
      },

      isProviderConfigured: (providerId: string) => {
        const provider = get().getProviderConfig(providerId);
        const isConfigured = provider?.isConfigured || false;
        console.log("🔍 Provider", providerId, "configured:", isConfigured);
        return isConfigured;
      },

      clearAllProviders: () => {
        console.log("🗑️ Clearing all provider configurations");
        set((state) => {
          const newState = { ...state, userProviders: [] };
          const computedValues = get()._updateComputedValues(newState);

          return { ...newState, ...computedValues };
        });
      },

      reset: () => {
        console.log("🔄 Resetting configuration state");
        set((state) => {
          const newState = {
            ...state,
            selectedProvider: "",
            selectedModel: "",
            showSettings: false,
            showSuccessMessage: false,
            isTransitioning: false,
          };
          const computedValues = get()._updateComputedValues(newState);

          return { ...newState, ...computedValues };
        });
      },

      getSelectedProviderId: () => {
        return get().selectedProvider;
      },

      getSelectedModelId: () => {
        return get().selectedModel;
      },
    }),
    {
      name: "configuration-store",
      version: 2,
      partialize: (state) => ({
        userProviders: state.userProviders,
        selectedProvider: state.selectedProvider,
        selectedModel: state.selectedModel,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("🔄 Configuration store rehydrated:", {
            providerCount: state.userProviders.length,
            selectedProvider: state.selectedProvider,
            selectedModel: state.selectedModel,
            providers: state.userProviders.map((p) => p.providerId),
          });

          // Update computed values after rehydration
          const computedValues = state._updateComputedValues(state);
          Object.assign(state, computedValues);

          console.log(
            "✅ Computed values updated after rehydration:",
            computedValues
          );
        }
      },
      migrate: (persistedState: any, version: number) => {
        console.log("🔄 Migrating configuration store from version:", version);

        if (version === 0) {
          // Migrate from old chat-config structure
          const oldConfig = persistedState as ChatConfig;
          if (oldConfig) {
            console.log("🔄 Migrating from old chat-config structure");
            return {
              userProviders: oldConfig.userProviders || [],
              selectedProvider: oldConfig.selectedProvider || "",
              selectedModel: oldConfig.selectedModel || "",
            };
          }
        }

        if (version === 1) {
          // Migrate from separate provider stores
          console.log("🔄 Migrating from separate provider stores");

          // Try to get data from old provider config store
          try {
            const oldProviderConfig = localStorage.getItem(
              "provider-config-store"
            );
            const oldSelectedProvider = localStorage.getItem(
              "selected-provider-store"
            );

            let userProviders: UserProviderConfig[] = [];
            let selectedProvider = "";
            let selectedModel = "";

            if (oldProviderConfig) {
              const parsed = JSON.parse(oldProviderConfig);
              if (parsed.state && parsed.state.userProviders) {
                userProviders = parsed.state.userProviders;
                console.log(
                  "🔄 Migrated userProviders from old store:",
                  userProviders.length
                );
              }
            }

            if (oldSelectedProvider) {
              const parsed = JSON.parse(oldSelectedProvider);
              if (parsed.state) {
                selectedProvider = parsed.state.selectedProvider || "";
                selectedModel = parsed.state.selectedModel || "";
                console.log(
                  "🔄 Migrated selected provider from old store:",
                  selectedProvider
                );
              }
            }

            return {
              userProviders,
              selectedProvider,
              selectedModel,
            };
          } catch (error) {
            console.error("Error migrating from old stores:", error);
          }
        }

        // Update computed values after migration
        if (persistedState) {
          const computedValues =
            (persistedState as any)._updateComputedValues?.(persistedState) ||
            {};
          return { ...persistedState, ...computedValues };
        }

        return persistedState;
      },
    }
  )
);
