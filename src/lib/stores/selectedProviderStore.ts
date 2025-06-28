import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProviderById, Provider, Model, ChatConfig } from "@/lib/types";

interface SelectedProviderState {
  selectedProvider: string;
  selectedModel: string;
  selectProvider: (providerId: string) => void;
  selectModel: (modelId: string) => void;
  getCurrentProvider: () => Provider | undefined;
  getCurrentModel: () => Model | undefined;
  reset: () => void;
  getSelectedProviderId: () => string;
  getSelectedModelId: () => string;
}

export const useSelectedProviderStore = create<SelectedProviderState>()(
  persist(
    (set, get) => ({
      selectedProvider: "",
      selectedModel: "",

      selectProvider: (providerId: string) => {
        console.log("🎯 Selecting provider:", providerId);
        const provider = getProviderById(providerId);
        if (provider) {
          const newModelId =
            provider.models.length > 0 ? provider.models[0].id : "";
          set({
            selectedProvider: providerId,
            selectedModel: newModelId,
          });
          console.log("🔄 Selected provider state:", {
            selectedProvider: providerId,
            selectedModel: newModelId,
          });
        }
      },

      selectModel: (modelId: string) => {
        console.log("🎯 Selecting model:", modelId);
        set({ selectedModel: modelId });
        console.log("🔄 Selected model state:", { selectedModel: modelId });
      },

      getCurrentProvider: () => {
        const { selectedProvider } = get();
        if (!selectedProvider) return undefined;
        const provider = getProviderById(selectedProvider);
        console.log("🔍 Current provider:", provider?.name || "None");
        return provider;
      },

      getCurrentModel: () => {
        const { selectedProvider, selectedModel } = get();
        if (!selectedProvider || !selectedModel) return undefined;
        const provider = getProviderById(selectedProvider);
        if (!provider) return undefined;
        const model = provider.models.find((m) => m.id === selectedModel);
        console.log("🔍 Current model:", model?.name || "None");
        return model;
      },

      getSelectedProviderId: () => {
        return get().selectedProvider;
      },

      getSelectedModelId: () => {
        return get().selectedModel;
      },

      reset: () => {
        console.log("🔄 Resetting selected provider state");
        set({ selectedProvider: "", selectedModel: "" });
      },
    }),
    {
      name: "selected-provider-store",
      version: 2,
      partialize: (state) => ({
        selectedProvider: state.selectedProvider,
        selectedModel: state.selectedModel,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("🔄 Selected provider store rehydrated:", {
            selectedProvider: state.selectedProvider,
            selectedModel: state.selectedModel,
            providerName:
              getProviderById(state.selectedProvider)?.name || "None",
            modelName:
              getProviderById(state.selectedProvider)?.models.find(
                (m) => m.id === state.selectedModel
              )?.name || "None",
          });
        }
      },
      migrate: (persistedState: any, version: number) => {
        console.log(
          "🔄 Migrating selected provider store from version:",
          version
        );

        if (version === 0) {
          // Migrate from old chat-config structure
          const oldConfig = persistedState as ChatConfig;
          if (oldConfig) {
            console.log("🔄 Migrating from old chat-config structure");
            return {
              selectedProvider: oldConfig.selectedProvider || "",
              selectedModel: oldConfig.selectedModel || "",
            };
          }
        }

        if (version === 1) {
          // Migrate from shared chat-config storage
          if (persistedState) {
            console.log("🔄 Migrating from shared chat-config storage");
            return {
              selectedProvider: persistedState.selectedProvider || "",
              selectedModel: persistedState.selectedModel || "",
            };
          }
        }

        return persistedState;
      },
    }
  )
);
