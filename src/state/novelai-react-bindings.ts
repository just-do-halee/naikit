/**
 * React Bindings for NovelAI State
 * 
 * This file provides React hooks for the NovelAI state management
 */

import { useAxion } from "axion-state/react";
import { useCallback, useEffect } from "react";
import {
  novelAIState,
  novelAIActions,
  canGenerate,
  currentResolution,
  estimatedTimeForGeneration,
  ImageGenerationParameters,
  NovelAIPromptData,
  GenerationStatus,
  AnlasInfo,
  SyncStatus,
  SyncDirection
} from "./novelai-state";
import { Segment } from "@/core/segment-model/types";
import { useSegmentStateReactive } from "./react-bindings";

// Basic state hooks
export function useNovelAIState() {
  return useAxion(novelAIState);
}

export function useNovelAIConnectionStatus() {
  return {
    isConnected: useAxion(novelAIState.at("isConnected")),
    isAvailable: useAxion(novelAIState.at("isAvailable")),
    errorMessage: useAxion(novelAIState.at("errorMessage"))
  };
}

export function useNovelAISyncStatus() {
  return {
    syncStatus: useAxion(novelAIState.at("syncStatus")),
    lastSyncTime: useAxion(novelAIState.at("lastSyncTime")),
    syncDirection: useAxion(novelAIState.at("syncDirection")),
    autoSync: useAxion(novelAIState.at("autoSync"))
  };
}

export function useNovelAIPromptData() {
  return useAxion(novelAIState.at("promptData"));
}

export function useGenerationParameters() {
  return useAxion(novelAIState.at("parameters"));
}

export function useGenerationStatus() {
  return useAxion(novelAIState.at("generationStatus"));
}

export function useAnlasInfo() {
  return useAxion(novelAIState.at("anlasInfo"));
}

// Derived hooks
export function useCanGenerate() {
  return useAxion(canGenerate);
}

export function useCurrentResolution() {
  return useAxion(currentResolution);
}

export function useEstimatedGenerationTime() {
  return useAxion(estimatedTimeForGeneration);
}

// Actions as hooks
export function useNovelAIActions() {
  // Connection management
  const setConnectionStatus = useCallback((isConnected: boolean, errorMessage: string | null = null) => {
    novelAIActions.setConnectionStatus(isConnected, errorMessage);
  }, []);
  
  const setAvailability = useCallback((isAvailable: boolean) => {
    novelAIActions.setAvailability(isAvailable);
  }, []);
  
  // Synchronization
  const setSyncStatus = useCallback((status: SyncStatus) => {
    novelAIActions.setSyncStatus(status);
  }, []);
  
  const setSyncDirection = useCallback((direction: SyncDirection) => {
    novelAIActions.setSyncDirection(direction);
  }, []);
  
  const setAutoSync = useCallback((enabled: boolean) => {
    novelAIActions.setAutoSync(enabled);
  }, []);
  
  // Update prompt data from NovelAI
  const updatePromptDataFromNovelAI = useCallback((data: Partial<NovelAIPromptData>) => {
    novelAIActions.updatePromptDataFromNovelAI(data);
  }, []);
  
  // Push prompt data to NovelAI
  const pushPromptToNovelAI = useCallback((segments: Record<string, Segment>, rootPositiveId: string, rootNegativeId: string) => {
    novelAIActions.pushPromptToNovelAI(segments, rootPositiveId, rootNegativeId);
  }, []);
  
  // Generation parameters
  const updateGenerationParameters = useCallback((params: Partial<ImageGenerationParameters>) => {
    novelAIActions.updateGenerationParameters(params);
  }, []);
  
  // Generation status
  const updateGenerationStatus = useCallback((status: Partial<GenerationStatus>) => {
    novelAIActions.updateGenerationStatus(status);
  }, []);
  
  const startGeneration = useCallback(() => {
    novelAIActions.startGeneration();
  }, []);
  
  const stopGeneration = useCallback(() => {
    novelAIActions.stopGeneration();
  }, []);
  
  // Anlas info
  const updateAnlasInfo = useCallback((info: Partial<AnlasInfo>) => {
    novelAIActions.updateAnlasInfo(info);
  }, []);
  
  return {
    setConnectionStatus,
    setAvailability,
    setSyncStatus,
    setSyncDirection,
    setAutoSync,
    updatePromptDataFromNovelAI,
    pushPromptToNovelAI,
    updateGenerationParameters,
    updateGenerationStatus,
    startGeneration,
    stopGeneration,
    updateAnlasInfo
  };
}

// Sync hooks
export function useSyncWithNovelAI() {
  const segmentState = useSegmentStateReactive();
  const { pushPromptToNovelAI, setSyncStatus } = useNovelAIActions();
  const autoSync = useAxion(novelAIState.at("autoSync"));
  
  const syncToNovelAI = useCallback(() => {
    if (!segmentState) {
      console.error("Segment state is not available");
      return;
    }
    
    setSyncStatus("syncing");
    try {
      const { segments, rootSegments } = segmentState;
      if (!segments || !rootSegments || !rootSegments.main) {
        throw new Error("Required segment data is missing");
      }
      
      pushPromptToNovelAI(
        segments, 
        rootSegments.main.positive,
        rootSegments.main.negative
      );
      // Success is set in the action
    } catch (error) {
      setSyncStatus("error");
      console.error("Error syncing to NovelAI:", error);
    }
  }, [segmentState, pushPromptToNovelAI, setSyncStatus]);
  
  // Auto sync effect
  useEffect(() => {
    if (!autoSync) return undefined;
    
    // Setup auto sync here - this would integrate with a service
    // For this implementation, we'll do a simple interval timer
    
    const autoSyncInterval = setInterval(() => {
      if (segmentState) {
        syncToNovelAI();
      }
    }, 5000); // Every 5 seconds
    
    return () => {
      clearInterval(autoSyncInterval);
    };
  }, [autoSync, syncToNovelAI, segmentState]);
  
  return { syncToNovelAI };
}

// Generation hook
export function useImageGeneration() {
  const isGenerating = useAxion(novelAIState.at("generationStatus").at("isGenerating"));
  const progress = useAxion(novelAIState.at("generationStatus").at("progress"));
  const canGenerateImage = useCanGenerate();
  const { startGeneration, stopGeneration, updateGenerationStatus } = useNovelAIActions();
  
  // Generate image
  const generateImage = useCallback(() => {
    if (!canGenerateImage) return undefined;
    
    startGeneration();
    
    // This would connect to a service that interfaces with NovelAI
    // For now, we'll simulate progress
    
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 5;
      
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        updateGenerationStatus({
          progress: 100,
          isGenerating: false,
        });
      } else {
        updateGenerationStatus({
          progress: currentProgress
        });
      }
    }, 500);
    
    return () => {
      clearInterval(progressInterval);
    };
  }, [canGenerateImage, startGeneration, updateGenerationStatus]);
  
  const cancelGeneration = useCallback(() => {
    stopGeneration();
  }, [stopGeneration]);
  
  return {
    isGenerating,
    progress,
    generateImage,
    cancelGeneration,
    canGenerate: canGenerateImage
  };
}

// Resolution presets hook
export function useResolutionPresets() {
  const currentParams = useGenerationParameters();
  const { updateGenerationParameters } = useNovelAIActions();
  
  // Common NovelAI resolution presets
  const presets = [
    { name: "Portrait", width: 832, height: 1216 },
    { name: "Landscape", width: 1216, height: 832 },
    { name: "Square", width: 1024, height: 1024 },
    { name: "Wide", width: 1408, height: 768 },
    { name: "Tall", width: 768, height: 1408 },
  ];
  
  const setResolution = useCallback((width: number, height: number) => {
    updateGenerationParameters({ width, height });
  }, [updateGenerationParameters]);
  
  const selectPreset = useCallback((presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      setResolution(preset.width, preset.height);
    }
  }, [presets, setResolution]);
  
  return {
    presets,
    currentWidth: currentParams ? (currentParams as ImageGenerationParameters).width : 1024,
    currentHeight: currentParams ? (currentParams as ImageGenerationParameters).height : 1024,
    setResolution,
    selectPreset
  };
}