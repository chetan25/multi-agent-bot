import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProviderConfig, Provider, ChatConfig } from "@/lib/types";

interface ProviderConfigState {
  userProviders: UserProviderConfig[];
  addProvider: (provider: Provider) => void;
  updateProviderConfig: (providerId: string, apiKey: string) => void;
  removeProvider: (providerId: string) => void;
  getProviderConfig: (providerId: string) => UserProviderConfig | undefined;
  isProviderConfigured: (providerId: string) => boolean;
  clearAllProviders: () => void;
}

export const useProviderConfigStore = create<ProviderConfigState>()(
  persist(
    (set, get) => ({
      userProviders: [],

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

          console.log("🔄 New provider config state:", {
            userProviders: newProviders,
          });
          return { userProviders: newProviders };
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

          console.log("🔄 New provider config state after update:", {
            userProviders: newProviders,
          });
          return { userProviders: newProviders };
        });
      },

      removeProvider: (providerId: string) => {
        console.log("🗑️ Removing provider:", providerId);
        set((state) => {
          const newProviders = state.userProviders.filter(
            (p) => p.providerId !== providerId
          );

          console.log("🔄 New provider config state after removal:", {
            userProviders: newProviders,
          });
          return { userProviders: newProviders };
        });
      },

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
        set({ userProviders: [] });
      },
    }),
    {
      name: "provider-config-store",
      version: 2,
      partialize: (state) => ({
        userProviders: state.userProviders,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("🔄 Provider config store rehydrated:", {
            providerCount: state.userProviders.length,
            providers: state.userProviders.map((p) => p.providerId),
          });
        }
      },
      migrate: (persistedState: any, version: number) => {
        console.log(
          "🔄 Migrating provider config store from version:",
          version
        );

        if (version === 0) {
          // Migrate from old chat-config structure
          const oldConfig = persistedState as ChatConfig;
          if (oldConfig && oldConfig.userProviders) {
            console.log("🔄 Migrating from old chat-config structure");
            return { userProviders: oldConfig.userProviders };
          }
        }

        if (version === 1) {
          // Migrate from shared chat-config storage
          if (persistedState && persistedState.userProviders) {
            console.log("🔄 Migrating from shared chat-config storage");
            return { userProviders: persistedState.userProviders };
          }
        }

        return persistedState;
      },
    }
  )
);
