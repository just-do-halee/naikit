/**
 * NovelAI Integration State Management with Axion
 * 
 * This file implements the state management for NovelAI integration using Axion.
 */

import axion from "axion-state";
import { Segment } from "@/core/segment-model/types";
import { compileSegmentTree } from "@/core/compiler/segment-compiler";

// Types for NovelAI interaction
export type SyncStatus = "idle" | "syncing" | "error" | "success" | "disabled";
export type SyncDirection = "toNovelAI" | "fromNovelAI" | "bidirectional";

// Interface for NovelAI prompt data (simplified version of their actual structure)
export interface NovelAIPromptData {
  positive: string;
  negative: string;
  characterPositives: Record<number, string>;
  characterNegatives: Record<number, string>;
}

// Image generation parameters
export interface ImageGenerationParameters {
  width: number;
  height: number;
  scale: number;
  sampler: string;
  steps: number;
  seed: number | null;
  strength: number;
  noise: number;
  batchSize: number; 
  ucPreset: number;
  qualityToggle: boolean;
  modelId: string;
}

// Status of generation
export interface GenerationStatus {
  isGenerating: boolean;
  progress: number;
  estimatedTimeRemaining: number | null;
  currentBatch: number;
  totalBatches: number;
}

// Anlas info (NovelAI's currency for image generation)
export interface AnlasInfo {
  balance: number;
  estimatedCost: number;
}

// State definition
export interface NovelAIState {
  // Connection
  isConnected: boolean;
  isAvailable: boolean;
  errorMessage: string | null;
  
  // Synchronization
  syncStatus: SyncStatus;
  lastSyncTime: number | null;
  syncDirection: SyncDirection;
  autoSync: boolean;
  
  // NovelAI data
  promptData: NovelAIPromptData;
  
  // Generation settings
  parameters: ImageGenerationParameters;
  
  // Generation status
  generationStatus: GenerationStatus;
  
  // Anlas info
  anlasInfo: AnlasInfo;
}

// Default values
const defaultNovelAIState: NovelAIState = {
  isConnected: false,
  isAvailable: false,
  errorMessage: null,
  
  syncStatus: "idle",
  lastSyncTime: null,
  syncDirection: "bidirectional",
  autoSync: true,
  
  promptData: {
    positive: "",
    negative: "",
    characterPositives: {},
    characterNegatives: {},
  },
  
  parameters: {
    width: 832,
    height: 1216,
    scale: 11,
    sampler: "k_euler_ancestral",
    steps: 28,
    seed: null,
    strength: 0.7,
    noise: 0.2,
    batchSize: 1,
    ucPreset: 0,
    qualityToggle: true,
    modelId: "nai-diffusion-3",
  },
  
  generationStatus: {
    isGenerating: false,
    progress: 0,
    estimatedTimeRemaining: null,
    currentBatch: 0,
    totalBatches: 0,
  },
  
  anlasInfo: {
    balance: 0,
    estimatedCost: 0,
  },
};

// Create Axion atom for NovelAI state
export const novelAIState = axion<NovelAIState>(defaultNovelAIState);

// Actions
export const novelAIActions = {
  // Connection management
  setConnectionStatus: (isConnected: boolean, errorMessage: string | null = null) => {
    axion.tx(() => {
      novelAIState.at("isConnected").set(isConnected);
      novelAIState.at("errorMessage").set(errorMessage);
    });
  },
  
  setAvailability: (isAvailable: boolean) => {
    novelAIState.at("isAvailable").set(isAvailable);
  },
  
  // Synchronization
  setSyncStatus: (status: SyncStatus) => {
    novelAIState.at("syncStatus").set(status);
    
    if (status === "success") {
      novelAIState.at("lastSyncTime").set(Date.now());
    }
  },
  
  setSyncDirection: (direction: SyncDirection) => {
    novelAIState.at("syncDirection").set(direction);
  },
  
  setAutoSync: (enabled: boolean) => {
    novelAIState.at("autoSync").set(enabled);
  },
  
  // Update prompt data from NovelAI
  updatePromptDataFromNovelAI: (data: Partial<NovelAIPromptData>) => {
    novelAIState.at("promptData").update(current => {
      return Object.assign({}, current as object, data);
    });
  },
  
  // Push prompt data to NovelAI (will be implemented in the service)
  pushPromptToNovelAI: (segments: Record<string, Segment>, rootPositiveId: string, rootNegativeId: string) => {
    // This action doesn't directly modify state
    // It will trigger a service function that syncs data to NovelAI
    const positive = segments[rootPositiveId] 
      ? compileSegmentTree(segments[rootPositiveId]) 
      : "";
      
    const negative = segments[rootNegativeId]
      ? compileSegmentTree(segments[rootNegativeId])
      : "";
    
    // Later this will trigger a sync service call
    // For now, update our local state to simulate the sync
    novelAIState.at("promptData").update(current => {
      return Object.assign({}, current as object, {
        positive,
        negative,
      });
    });
    
    // Set sync status to success
    novelAIState.at("syncStatus").set("success");
    novelAIState.at("lastSyncTime").set(Date.now());
  },
  
  // Generation parameters
  updateGenerationParameters: (params: Partial<ImageGenerationParameters>) => {
    novelAIState.at("parameters").update(current => {
      return Object.assign({}, current as object, params);
    });
  },
  
  // Generation status
  updateGenerationStatus: (status: Partial<GenerationStatus>) => {
    novelAIState.at("generationStatus").update(current => {
      return Object.assign({}, current as object, status);
    });
  },
  
  startGeneration: () => {
    novelAIState.at("generationStatus").update(current => {
      return Object.assign({}, current as object, {
        isGenerating: true,
        progress: 0,
        currentBatch: 1,
      });
    });
  },
  
  stopGeneration: () => {
    novelAIState.at("generationStatus").update(current => {
      return Object.assign({}, current as object, {
        isGenerating: false,
      });
    });
  },
  
  // Anlas info
  updateAnlasInfo: (info: Partial<AnlasInfo>) => {
    novelAIState.at("anlasInfo").update(current => {
      return Object.assign({}, current as object, info);
    });
  },
};

// Derived state
export const canGenerate = axion.derive(() => {
  const { isConnected, isAvailable } = novelAIState.get();
  const { isGenerating } = novelAIState.get().generationStatus;
  const { balance, estimatedCost } = novelAIState.get().anlasInfo;
  
  return (
    isConnected && 
    isAvailable && 
    !isGenerating && 
    balance >= estimatedCost
  );
});

export const currentResolution = axion.derive(() => {
  const { width, height } = novelAIState.get().parameters;
  return { width, height };
});

export const estimatedTimeForGeneration = axion.derive(() => {
  const { steps, batchSize } = novelAIState.get().parameters;
  
  // Very rough estimate - would be improved with real data
  // Based on approx. 1 second per step for a 512x512 image
  // Higher resolutions take longer based on pixel count ratio
  const { width, height } = novelAIState.get().parameters;
  const pixelRatio = (width * height) / (512 * 512);
  
  // Base estimate in seconds
  const baseEstimate = steps * pixelRatio;
  
  // Total for all batches
  return baseEstimate * batchSize;
});