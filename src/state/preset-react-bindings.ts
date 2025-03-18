/**
 * React Bindings for Preset State
 * 
 * This file provides React hooks for the preset state manager
 */

import { useAxion } from "axion-state/react";
import { useCallback } from "react";
import { 
  presetState, 
  presetActions, 
  favoritePresets, 
  recentlyUsedPresets,
  folderStructure,
  Preset,
  PresetCategory,
  PresetFolder
} from "./preset-state";

// Basic state hooks
export function usePresetState() {
  return useAxion(presetState);
}

export function usePreset(id: string | null) {
  return id ? useAxion(presetState.at("presets").at(id)) : null;
}

export function useAllPresets() {
  return useAxion(presetState.at("presets"));
}

export function useFolder(id: string | null) {
  return id ? useAxion(presetState.at("folders").at(id)) : null;
}

export function useAllFolders() {
  return useAxion(presetState.at("folders"));
}

export function useFavorites() {
  return useAxion(favoritePresets);
}

export function useRecentlyUsed() {
  return useAxion(recentlyUsedPresets);
}

export function useFolderStructure() {
  return useAxion(folderStructure);
}

// Actions as hooks
export function usePresetActions() {
  // Preset CRUD
  const createPreset = useCallback(
    (
      name: string,
      category: PresetCategory,
      values: string[],
      options?: {
        description?: string;
        defaultWeight?: number;
        prefix?: string;
        suffix?: string;
        color?: string;
        tags?: string[];
        folderId?: string;
      }
    ) => {
      return presetActions.createPreset(name, category, values, options);
    },
    []
  );

  const updatePreset = useCallback(
    (id: string, updates: Partial<Omit<Preset, "id" | "dateCreated">>) => {
      presetActions.updatePreset(id, updates);
    },
    []
  );

  const deletePreset = useCallback((id: string) => {
    presetActions.deletePreset(id);
  }, []);

  // Preset value management
  const addPresetValue = useCallback((presetId: string, value: string) => {
    presetActions.addPresetValue(presetId, value);
  }, []);

  const updatePresetValue = useCallback(
    (presetId: string, valueId: string, newValue: string, weight?: number) => {
      presetActions.updatePresetValue(presetId, valueId, newValue, weight);
    },
    []
  );

  const removePresetValue = useCallback((presetId: string, valueId: string) => {
    presetActions.removePresetValue(presetId, valueId);
  }, []);

  // Folder management
  const createFolder = useCallback(
    (name: string, parentId: string = "root") => {
      return presetActions.createFolder(name, parentId);
    },
    []
  );

  const updateFolder = useCallback(
    (id: string, updates: Partial<Omit<PresetFolder, "id" | "dateCreated">>) => {
      presetActions.updateFolder(id, updates);
    },
    []
  );

  const deleteFolder = useCallback((id: string) => {
    presetActions.deleteFolder(id);
  }, []);

  const movePresetToFolder = useCallback(
    (presetId: string, sourceFolderId: string, targetFolderId: string) => {
      presetActions.movePresetToFolder(presetId, sourceFolderId, targetFolderId);
    },
    []
  );

  // User interaction
  const markAsRecentlyUsed = useCallback((presetId: string) => {
    presetActions.markAsRecentlyUsed(presetId);
  }, []);

  const toggleFavorite = useCallback((presetId: string) => {
    presetActions.toggleFavorite(presetId);
  }, []);

  // Import/export
  const exportPresets = useCallback((presetIds: string[]) => {
    return presetActions.exportPresets(presetIds);
  }, []);

  const importPresets = useCallback(
    (presetsJson: string, targetFolderId: string = "root") => {
      return presetActions.importPresets(presetsJson, targetFolderId);
    },
    []
  );

  return {
    createPreset,
    updatePreset,
    deletePreset,
    addPresetValue,
    updatePresetValue,
    removePresetValue,
    createFolder,
    updateFolder,
    deleteFolder,
    movePresetToFolder,
    markAsRecentlyUsed,
    toggleFavorite,
    exportPresets,
    importPresets,
  };
}

// Specialized hooks for common operations
export function usePresetSearch() {
  const allPresets = useAllPresets();
  
  // Return a function that searches presets
  return useCallback(
    (searchTerm: string, category?: PresetCategory) => {
      const term = searchTerm.toLowerCase().trim();
      const presets = allPresets as Record<string, Preset>;
      
      if (!term && !category) return Object.values(presets);
      
      return Object.values(presets).filter(preset => {
        // Category filter
        if (category && preset.category !== category) return false;
        
        // Skip term filter if no term
        if (!term) return true;
        
        // Check name
        if (preset.name.toLowerCase().includes(term)) return true;
        
        // Check description
        if (preset.description?.toLowerCase().includes(term)) return true;
        
        // Check tags
        if (preset.tags?.some((tag: string) => tag.toLowerCase().includes(term))) return true;
        
        // Check values
        if (preset.values.some((v: {id: string, value: string, weight?: number}) => v.value.toLowerCase().includes(term))) return true;
        
        return false;
      });
    },
    [allPresets]
  );
}

export function useFolderPresets(folderId: string) {
  const folder = useFolder(folderId) as PresetFolder | null;
  const allPresets = useAllPresets() as Record<string, Preset>;
  
  // Return an array of presets in the folder
  return folder && folder.presetIds
    ? folder.presetIds.map(id => allPresets[id]).filter(Boolean) 
    : [];
}

export function useIsFavorite() {
  const favs = useAxion(presetState.at("favorites")) as string[];
  
  return useCallback(
    (presetId: string) => {
      return Array.isArray(favs) && favs.includes(presetId);
    },
    [favs]
  );
}

export function usePresetCategories() {
  const allPresets = useAllPresets();
  
  // Get all used categories and count
  const categories = Object.values(allPresets as Record<string, Preset>).reduce((acc, preset) => {
    const cat = preset.category as PresetCategory;
    if (!acc[cat]) {
      acc[cat] = 0;
    }
    acc[cat]++;
    return acc;
  }, {} as Record<PresetCategory, number>);
  
  // Add any unused categories with count 0
  const allCategories: PresetCategory[] = ["CHARACTER", "STYLE", "SCENE", "OBJECT", "CUSTOM"];
  allCategories.forEach(cat => {
    if (categories[cat] === undefined) {
      categories[cat] = 0;
    }
  });
  
  return categories;
}