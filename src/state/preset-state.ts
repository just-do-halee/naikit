/**
 * Preset State Management with Axion
 * 
 * This file implements the state management for presets and wildcards
 * using Axion instead of Zustand/Immer.
 */

import axion from "axion-state";
import { nanoid } from "nanoid";

// Type utilities for safe property access
function safeGetProperty<T, K extends string>(obj: unknown, key: K, defaultValue: T): T {
  if (obj && typeof obj === 'object' && key in obj) {
    return (obj as Record<K, unknown>)[key] as T;
  }
  return defaultValue;
}

function safeUpdateProperty<T, K extends string>(
  obj: unknown, 
  key: K, 
  value: T
): Record<string, unknown> {
  const result = { ...(obj as Record<string, unknown> || {}) };
  result[key] = value;
  return result;
}

function safeFilter<T>(arr: unknown, predicate: (item: T) => boolean): T[] {
  if (Array.isArray(arr)) {
    return arr.filter(item => predicate(item as T)) as T[];
  }
  return [];
}

function safeIncludes<T>(arr: unknown, item: T): boolean {
  if (Array.isArray(arr)) {
    return arr.includes(item);
  }
  return false;
}

function safeMap<T, U>(arr: unknown, mapper: (item: T) => U): U[] {
  if (Array.isArray(arr)) {
    return arr.map(item => mapper(item as T));
  }
  return [];
}

// Types for preset system
export type PresetCategory = "CHARACTER" | "STYLE" | "SCENE" | "OBJECT" | "CUSTOM";

export interface PresetValue {
  id: string;
  value: string;
  weight?: number; // Optional weight for value-specific weighting
}

export interface Preset {
  id: string;
  name: string;
  category: PresetCategory;
  description?: string;
  values: PresetValue[];
  defaultWeight?: number; // Default weight for all values
  prefix?: string;
  suffix?: string;
  color?: string;
  tags?: string[];
  dateCreated: number;
  dateModified: number;
}

export interface PresetFolder {
  id: string;
  name: string;
  presetIds: string[];
  parentId?: string;
  dateCreated: number;
  dateModified: number;
}

// Define Preset Store State
interface PresetState {
  presets: Record<string, Preset>;
  folders: Record<string, PresetFolder>;
  recentlyUsed: string[]; // IDs of recently used presets
  favorites: string[]; // IDs of favorited presets
}

// Default Category Colors
const categoryColors: Record<PresetCategory, string> = {
  CHARACTER: "#4A9F8E", // Teal
  STYLE: "#8E6FD8",     // Purple
  SCENE: "#E67E22",     // Orange
  OBJECT: "#3498DB",    // Blue
  CUSTOM: "#9B59B6",    // Violet
};

// Create initial state
const initialPresetState: PresetState = {
  presets: {},
  folders: {
    "root": {
      id: "root",
      name: "Root",
      presetIds: [],
      dateCreated: Date.now(),
      dateModified: Date.now(),
    }
  },
  recentlyUsed: [],
  favorites: [],
};

// Create Axion atom for preset state
export const presetState = axion<PresetState>(initialPresetState);

// Actions
export const presetActions = {
  // Preset CRUD
  createPreset: (
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
    const presetId = `preset_${nanoid(8)}`;
    const now = Date.now();
    
    // Generate preset values with IDs
    const presetValues: PresetValue[] = values.map(value => ({
      id: nanoid(8),
      value
    }));
    
    // Create new preset
    const newPreset: Preset = {
      id: presetId,
      name,
      category,
      values: presetValues,
      description: options?.description,
      defaultWeight: options?.defaultWeight,
      prefix: options?.prefix,
      suffix: options?.suffix,
      color: options?.color || categoryColors[category],
      tags: options?.tags || [],
      dateCreated: now,
      dateModified: now,
    };
    
    // Add preset to state
    presetState.at("presets").update(presets => {
      return Object.assign({}, presets as object, {
        [presetId]: newPreset
      });
    });
    
    // Add to folder
    const folderId = options?.folderId || "root";
    presetState.at("folders").at(folderId).update(folder => {
      if (!folder) return folder;
      return {
        ...safeUpdateProperty(
          safeUpdateProperty(folder || {}, 
            'presetIds', 
            [...safeGetProperty(folder, 'presetIds', [] as string[]), presetId]
          ),
          'dateModified', 
          now
        )
      };
    });
    
    return presetId;
  },
  
  updatePreset: (
    id: string,
    updates: Partial<Omit<Preset, "id" | "dateCreated">>
  ) => {
    presetState.at("presets").at(id).update(preset => {
      if (!preset) return preset;
      const result = { ...(preset as Record<string, unknown>), ...updates };
      result.dateModified = Date.now();
      return result as Preset;
    });
  },
  
  deletePreset: (id: string) => {
    // Remove from any folders
    presetState.at("folders").update(folders => {
      if (!folders || typeof folders !== 'object') return folders;
      
      const updatedFolders: Record<string, unknown> = { ...folders as Record<string, unknown> };
      
      Object.keys(updatedFolders).forEach(folderId => {
        const folder = updatedFolders[folderId];
        if (folder && typeof folder === 'object') {
          const presetIds = safeGetProperty(folder, 'presetIds', [] as string[]);
          
          if (safeIncludes(presetIds, id)) {
            updatedFolders[folderId] = {
              ...folder as Record<string, unknown>,
              presetIds: safeFilter<string>(presetIds, presetId => presetId !== id),
              dateModified: Date.now()
            };
          }
        }
      });
      
      return updatedFolders;
    });
    
    // Remove from recently used and favorites
    presetState.at("recentlyUsed").update(recent => 
      safeFilter<string>(recent, presetId => presetId !== id)
    );
    
    presetState.at("favorites").update(favs => 
      safeFilter<string>(favs, presetId => presetId !== id)
    );
    
    // Remove the preset itself
    presetState.at("presets").update(presets => {
      if (!presets || typeof presets !== 'object') return presets;
      
      const result = { ...(presets as Record<string, unknown>) };
      if (id in result) {
        delete result[id];
      }
      return result;
    });
  },
  
  // Preset Value Management
  addPresetValue: (presetId: string, value: string) => {
    presetState.at("presets").at(presetId).update(preset => {
      if (!preset) return preset;
      
      const newValue: PresetValue = {
        id: nanoid(8),
        value
      };
      
      return {
        ...(preset as Record<string, unknown>),
        values: [...safeGetProperty(preset, 'values', [] as PresetValue[]), newValue],
        dateModified: Date.now()
      } as Preset;
    });
  },
  
  updatePresetValue: (presetId: string, valueId: string, newValue: string, weight?: number) => {
    presetState.at("presets").at(presetId).update(preset => {
      if (!preset) return preset;
      
      const values = safeGetProperty(preset, 'values', [] as PresetValue[]);
      const updatedValues = safeMap<PresetValue, PresetValue>(values, v => { 
        if (v.id === valueId) {
          return {
            ...v,
            value: newValue,
            ...(weight !== undefined ? { weight } : {})
          };
        }
        return v;
      });
      
      return {
        ...(preset as Record<string, unknown>),
        values: updatedValues,
        dateModified: Date.now()
      } as Preset;
    });
  },
  
  removePresetValue: (presetId: string, valueId: string) => {
    presetState.at("presets").at(presetId).update(preset => {
      if (!preset) return preset;
      
      const values = safeGetProperty(preset, 'values', [] as PresetValue[]);
      
      return {
        ...(preset as Record<string, unknown>),
        values: safeFilter<PresetValue>(values, v => v.id !== valueId),
        dateModified: Date.now()
      } as Preset;
    });
  },
  
  // Folder Management
  createFolder: (name: string, parentId: string = "root") => {
    const folderId = `folder_${nanoid(8)}`;
    const now = Date.now();
    
    // Create new folder
    const newFolder: PresetFolder = {
      id: folderId,
      name,
      presetIds: [],
      parentId,
      dateCreated: now,
      dateModified: now
    };
    
    // Add folder to state
    presetState.at("folders").update(folders => {
      return {
        ...(folders as Record<string, unknown> || {}),
        [folderId]: newFolder
      };
    });
    
    return folderId;
  },
  
  updateFolder: (id: string, updates: Partial<Omit<PresetFolder, "id" | "dateCreated">>) => {
    presetState.at("folders").at(id).update(folder => {
      if (!folder) return folder;
      
      return {
        ...(folder as Record<string, unknown>),
        ...updates,
        dateModified: Date.now()
      } as PresetFolder;
    });
  },
  
  deleteFolder: (id: string) => {
    if (id === "root") return; // Prevent deleting root folder
    
    // Get all presets in the folder
    const state = presetState.get();
    const folders = state.folders || {};
    const folder = folders[id] as PresetFolder | undefined;
    if (!folder) return;
    
    // Move presets to parent folder
    const parentId = folder.parentId || "root";
    const presetsToMove = safeGetProperty(folder, 'presetIds', [] as string[]);
    
    presetState.at("folders").at(parentId).update(parentFolder => {
      if (!parentFolder) return parentFolder;
      
      const currentPresetIds = safeGetProperty(parentFolder, 'presetIds', [] as string[]);
      
      return {
        ...(parentFolder as Record<string, unknown>),
        presetIds: [...currentPresetIds, ...presetsToMove],
        dateModified: Date.now()
      } as PresetFolder;
    });
    
    // Remove the folder
    presetState.at("folders").update(folders => {
      if (!folders || typeof folders !== 'object') return folders;
      
      const result = { ...(folders as Record<string, unknown>) };
      if (id in result) {
        delete result[id];
      }
      return result;
    });
  },
  
  movePresetToFolder: (presetId: string, sourceFolderId: string, targetFolderId: string) => {
    // Remove from source folder
    presetState.at("folders").at(sourceFolderId).update(folder => {
      if (!folder) return folder;
      
      const presetIds = safeGetProperty(folder, 'presetIds', [] as string[]);
      
      return {
        ...(folder as Record<string, unknown>),
        presetIds: safeFilter<string>(presetIds, id => id !== presetId),
        dateModified: Date.now()
      } as PresetFolder;
    });
    
    // Add to target folder
    presetState.at("folders").at(targetFolderId).update(folder => {
      if (!folder) return folder;
      
      const presetIds = safeGetProperty(folder, 'presetIds', [] as string[]);
      
      return {
        ...(folder as Record<string, unknown>),
        presetIds: [...presetIds, presetId],
        dateModified: Date.now()
      } as PresetFolder;
    });
  },
  
  // User Interaction Tracking
  markAsRecentlyUsed: (presetId: string) => {
    presetState.at("recentlyUsed").update(recent => {
      // Remove if already exists
      const filtered = safeFilter<string>(recent, id => id !== presetId);
      // Add to front
      return [presetId, ...filtered].slice(0, 20); // Keep only recent 20
    });
  },
  
  toggleFavorite: (presetId: string) => {
    presetState.at("favorites").update(favs => {
      if (safeIncludes(favs, presetId)) {
        return safeFilter<string>(favs, id => id !== presetId);
      } else {
        const currentFavs = Array.isArray(favs) ? favs : [];
        return [...currentFavs, presetId];
      }
    });
  },
  
  // Export/Import
  exportPresets: (presetIds: string[]) => {
    const state = presetState.get();
    const presets = state.presets || {};
    
    const presetsToExport: Record<string, Preset> = {};
    for (const id of presetIds) {
      if (id in presets) {
        presetsToExport[id] = presets[id] as Preset;
      }
    }
    
    return JSON.stringify(presetsToExport);
  },
  
  importPresets: (presetsJson: string, targetFolderId: string = "root") => {
    try {
      const importedPresets = JSON.parse(presetsJson) as Record<string, Preset>;
      const now = Date.now();
      
      // Generate new IDs for all presets
      const idMap: Record<string, string> = {};
      const presetsToAdd: Record<string, Preset> = {};
      
      Object.values(importedPresets).forEach(preset => {
        const newId = `preset_${nanoid(8)}`;
        idMap[preset.id] = newId;
        
        // Create new values with new IDs
        const presetValues = safeGetProperty(preset, 'values', [] as PresetValue[]);
        const newValues = safeMap<PresetValue, PresetValue>(presetValues, v => ({
          id: nanoid(8),
          value: v.value || '',
          ...(v.weight !== undefined ? { weight: v.weight } : {})
        }));
        
        // Add with new ID
        presetsToAdd[newId] = {
          ...((preset as unknown) as Record<string, unknown>),
          id: newId,
          values: newValues,
          dateCreated: now,
          dateModified: now
        } as Preset;
      });
      
      // Update state
      presetState.at("presets").update(presets => {
        return Object.assign({}, presets as object, presetsToAdd as object);
      });
      
      // Add to target folder
      const newPresetIds = Object.values(idMap);
      presetState.at("folders").at(targetFolderId).update(folder => {
        if (!folder) return folder;
        
        const currentPresetIds = safeGetProperty(folder, 'presetIds', [] as string[]);
        
        return {
          ...(folder as Record<string, unknown>),
          presetIds: [...currentPresetIds, ...newPresetIds],
          dateModified: now
        } as PresetFolder;
      });
      
      return newPresetIds;
    } catch (error) {
      console.error("Failed to import presets:", error);
      return [];
    }
  }
};

// Derived states
export const favoritePresets = axion.derive(() => {
  const state = presetState.get();
  const favorites = state.favorites || [];
  const presets = state.presets || {};
  
  return safeMap<string, Preset | null>(favorites, id => {
    if (id in presets) {
      return presets[id] as Preset;
    }
    return null;
  }).filter(Boolean) as Preset[];
});

export const recentlyUsedPresets = axion.derive(() => {
  const state = presetState.get();
  const recentlyUsed = state.recentlyUsed || [];
  const presets = state.presets || {};
  
  return safeMap<string, Preset | null>(recentlyUsed, id => {
    if (id in presets) {
      return presets[id] as Preset;
    }
    return null;
  }).filter(Boolean) as Preset[];
});

export const folderStructure = axion.derive(() => {
  const state = presetState.get();
  const folders = state.folders || {};
  const presets = state.presets || {};
  
  // Build folder hierarchy
  const result: Record<string, {
    folder: PresetFolder;
    presets: Preset[];
    subFolders: string[];
  }> = {};
  
  // Initialize all folders
  Object.entries(folders).forEach(([folderId, folder]) => {
    if (folder && typeof folder === 'object') {
      const presetIds = safeGetProperty(folder, 'presetIds', [] as string[]);
      
      // Get presets that belong to this folder
      const folderPresets = presetIds
        .map(id => (id in presets) ? presets[id] as Preset : null)
        .filter(Boolean) as Preset[];
      
      result[folderId] = {
        folder: folder as PresetFolder,
        presets: folderPresets,
        subFolders: []
      };
    }
  });
  
  // Build parent-child relationships
  Object.values(folders).forEach(folder => {
    if (folder && typeof folder === 'object') {
      const parentId = safeGetProperty(folder, 'parentId', '');
      const id = safeGetProperty(folder, 'id', '');
      
      if (parentId && id && parentId in result) {
        result[parentId].subFolders.push(id);
      }
    }
  });
  
  return result;
});