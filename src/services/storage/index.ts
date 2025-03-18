/**
 * Storage Service
 * Manages extension data and provides synchronization with Axion state
 */
import { ENV } from "@/config/env";
// Removed unused import: import axion from "axion-state";
import { segmentState } from "@/state/segment-state";
import { presetState } from "@/state/preset-state";
import { configState } from "@/state/config-state";

/**
 * Creates a storage key with the consistent prefix
 */
export function createStorageKey(key: string): string {
  return `${ENV.STORAGE_KEY_PREFIX}${key}`;
}

// Storage keys for application state
const STATE_KEYS = {
  SEGMENTS: createStorageKey("segments"),
  PRESETS: createStorageKey("presets"),
  CONFIG: createStorageKey("config"),
};

// Maximum size for segmented storage (Chrome has limits of ~5MB per item)
const MAX_STORAGE_CHUNK_SIZE = 4 * 1024 * 1024; // 4MB

/**
 * Basic storage utility for general purpose storage operations
 */
export const storage = {
  /**
   * Stores an item
   */
  async set<T>(key: string, value: T): Promise<void> {
    const storageKey = createStorageKey(key);
    try {
      await chrome.storage.local.set({ [storageKey]: JSON.stringify(value) });
    } catch (error) {
      console.error(`Failed to store item at key "${key}":`, error);
    }
  },

  /**
   * Loads an item
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const storageKey = createStorageKey(key);
    try {
      const result = await chrome.storage.local.get([storageKey]);
      if (result[storageKey] !== undefined) {
        return JSON.parse(result[storageKey]) as T;
      }
    } catch (error) {
      console.error(`Failed to retrieve item at key "${key}":`, error);
    }
    return defaultValue;
  },

  /**
   * Removes an item
   */
  async remove(key: string): Promise<void> {
    const storageKey = createStorageKey(key);
    try {
      await chrome.storage.local.remove(storageKey);
    } catch (error) {
      console.error(`Failed to remove item at key "${key}":`, error);
    }
  },

  /**
   * Clears all items with the app prefix
   */
  async clear(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(null);
      const keysToRemove = Object.keys(result).filter((key) =>
        key.startsWith(ENV.STORAGE_KEY_PREFIX)
      );

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  },
};

/**
 * Advanced storage service for Axion state persistence
 */
export const stateStorage = {
  /**
   * Initializes Axion state from persistent storage
   */
  async initialize() {
    try {
      console.log("Loading persisted state from storage...");
      
      // Track if we loaded any state
      let stateLoaded = false;
      
      // Load segments state
      const segmentsData = await this.loadSegmentsState();
      if (segmentsData) {
        segmentState.set(segmentsData);
        stateLoaded = true;
        console.log("Loaded segment state from storage");
      }

      // Load presets state
      const presetsData = await this.loadPresetsState();
      if (presetsData) {
        presetState.set(presetsData);
        stateLoaded = true;
        console.log("Loaded preset state from storage");
      }

      // Load config state
      const configData = await this.loadConfigState();
      if (configData) {
        configState.set(configData);
        stateLoaded = true;
        console.log("Loaded config state from storage");
      }

      if (ENV.IS_DEV) {
        if (stateLoaded) {
          console.log("🔄 States loaded from storage");
        } else {
          console.log("No persisted state found in storage, using defaults");
        }
      }

      // Setup change listeners to save state changes
      this.setupPersistence();
      
      return true;
    } catch (error) {
      console.error("Error initializing state from storage:", error);
      return false;
    }
  },

  /**
   * Sets up persistence listeners for state changes
   */
  setupPersistence() {
    // Debounced save function to avoid excessive storage writes
    const debouncedSaveSegments = this.debounce(
      () => this.saveSegmentsState(segmentState.get()),
      1000
    );

    const debouncedSavePresets = this.debounce(
      () => this.savePresetsState(presetState.get()),
      1000
    );

    const debouncedSaveConfig = this.debounce(
      () => this.saveConfigState(configState.get()),
      1000
    );

    // Subscribe to state changes
    segmentState.subscribe(debouncedSaveSegments);
    presetState.subscribe(debouncedSavePresets);
    configState.subscribe(debouncedSaveConfig);
  },

  /**
   * Saves segment state to storage
   */
  async saveSegmentsState(state: any) {
    try {
      const serialized = JSON.stringify(state);
      
      // Check if we need to use chunked storage (for large states)
      if (serialized.length > MAX_STORAGE_CHUNK_SIZE) {
        await this.saveChunkedData(STATE_KEYS.SEGMENTS, serialized);
      } else {
        await chrome.storage.local.set({ [STATE_KEYS.SEGMENTS]: serialized });
      }
      
      if (ENV.IS_DEV) {
        console.log("💾 Segments state saved");
      }
      return true;
    } catch (error) {
      console.error("Error saving segments state:", error);
      return false;
    }
  },

  /**
   * Loads segment state from storage
   */
  async loadSegmentsState() {
    try {
      // Check if we have chunked data first
      const data = await this.loadChunkedData(STATE_KEYS.SEGMENTS);
      if (data) {
        return JSON.parse(data);
      }
      
      // Try loading as a single item
      const result = await chrome.storage.local.get(STATE_KEYS.SEGMENTS);
      const serialized = result[STATE_KEYS.SEGMENTS];
      
      if (serialized) {
        return JSON.parse(serialized);
      }
      
      return null;
    } catch (error) {
      console.error("Error loading segments state:", error);
      return null;
    }
  },

  /**
   * Saves preset state to storage
   */
  async savePresetsState(state: any) {
    try {
      const serialized = JSON.stringify(state);
      
      if (serialized.length > MAX_STORAGE_CHUNK_SIZE) {
        await this.saveChunkedData(STATE_KEYS.PRESETS, serialized);
      } else {
        await chrome.storage.local.set({ [STATE_KEYS.PRESETS]: serialized });
      }
      
      if (ENV.IS_DEV) {
        console.log("💾 Presets state saved");
      }
      return true;
    } catch (error) {
      console.error("Error saving presets state:", error);
      return false;
    }
  },

  /**
   * Loads preset state from storage
   */
  async loadPresetsState() {
    try {
      // Check if we have chunked data first
      const data = await this.loadChunkedData(STATE_KEYS.PRESETS);
      if (data) {
        return JSON.parse(data);
      }
      
      // Try loading as a single item
      const result = await chrome.storage.local.get(STATE_KEYS.PRESETS);
      const serialized = result[STATE_KEYS.PRESETS];
      
      if (serialized) {
        return JSON.parse(serialized);
      }
      
      return null;
    } catch (error) {
      console.error("Error loading presets state:", error);
      return null;
    }
  },

  /**
   * Saves config state to storage
   */
  async saveConfigState(state: any) {
    try {
      const serialized = JSON.stringify(state);
      await chrome.storage.local.set({ [STATE_KEYS.CONFIG]: serialized });
      if (ENV.IS_DEV) {
        console.log("💾 Config state saved");
      }
      return true;
    } catch (error) {
      console.error("Error saving config state:", error);
      return false;
    }
  },

  /**
   * Loads config state from storage
   */
  async loadConfigState() {
    try {
      const result = await chrome.storage.local.get(STATE_KEYS.CONFIG);
      const serialized = result[STATE_KEYS.CONFIG];
      
      if (serialized) {
        return JSON.parse(serialized);
      }
      
      return null;
    } catch (error) {
      console.error("Error loading config state:", error);
      return null;
    }
  },

  /**
   * Clears all stored state
   */
  async clearAllState() {
    try {
      // Clear all state-related storage
      await chrome.storage.local.remove([
        STATE_KEYS.SEGMENTS,
        STATE_KEYS.PRESETS,
        STATE_KEYS.CONFIG,
      ]);
      
      // Also clear any chunked data
      await this.clearChunkedData(STATE_KEYS.SEGMENTS);
      await this.clearChunkedData(STATE_KEYS.PRESETS);
      
      console.log("⚠️ All state cleared from storage");
      return true;
    } catch (error) {
      console.error("Error clearing state:", error);
      return false;
    }
  },

  /**
   * Exports all state to a JSON string for backup
   */
  async exportAllState() {
    try {
      const exportData = {
        segments: segmentState.get(),
        presets: presetState.get(),
        config: configState.get(),
        version: "1.0", // For future compatibility
        timestamp: Date.now(),
      };
      
      return JSON.stringify(exportData);
    } catch (error) {
      console.error("Error exporting state:", error);
      throw error;
    }
  },

  /**
   * Imports state from a JSON string backup
   */
  async importAllState(jsonData: string) {
    try {
      const importData = JSON.parse(jsonData);
      
      // Basic validation
      if (!importData.segments || !importData.presets || !importData.config) {
        throw new Error("Invalid import data: missing required state objects");
      }
      
      // Import each state
      segmentState.set(importData.segments);
      presetState.set(importData.presets);
      configState.set(importData.config);
      
      // Save to storage
      await Promise.all([
        this.saveSegmentsState(importData.segments),
        this.savePresetsState(importData.presets),
        this.saveConfigState(importData.config),
      ]);
      
      console.log("✅ State imported successfully");
      return true;
    } catch (error) {
      console.error("Error importing state:", error);
      return false;
    }
  },

  /**
   * Saves large data by breaking it into chunks
   */
  async saveChunkedData(key: string, data: string) {
    try {
      // Calculate how many chunks we need
      const chunkCount = Math.ceil(data.length / MAX_STORAGE_CHUNK_SIZE);
      const chunks: { [key: string]: string } = {};
      
      // Create chunk metadata
      chunks[`${key}_info`] = JSON.stringify({
        count: chunkCount,
        total_length: data.length,
        timestamp: Date.now(),
      });
      
      // Split the data into chunks
      for (let i = 0; i < chunkCount; i++) {
        const start = i * MAX_STORAGE_CHUNK_SIZE;
        const end = Math.min(start + MAX_STORAGE_CHUNK_SIZE, data.length);
        chunks[`${key}_${i}`] = data.substring(start, end);
      }
      
      // Save all chunks
      await chrome.storage.local.set(chunks);
      return true;
    } catch (error) {
      console.error("Error saving chunked data:", error);
      return false;
    }
  },

  /**
   * Loads chunked data and reassembles it
   */
  async loadChunkedData(key: string) {
    try {
      // Load chunk metadata
      const infoResult = await chrome.storage.local.get(`${key}_info`);
      const infoData = infoResult[`${key}_info`];
      
      if (!infoData) {
        return null; // No chunked data
      }
      
      const info = JSON.parse(infoData);
      const { count, total_length } = info;
      
      // Prepare to collect chunks
      const chunkKeys: string[] = [];
      for (let i = 0; i < count; i++) {
        chunkKeys.push(`${key}_${i}`);
      }
      
      // Load all chunks
      const chunksResult = await chrome.storage.local.get(chunkKeys);
      
      // Reassemble the data
      let reassembled = "";
      for (let i = 0; i < count; i++) {
        const chunkKey = `${key}_${i}`;
        if (!chunksResult[chunkKey]) {
          throw new Error(`Missing chunk ${i} for key ${key}`);
        }
        reassembled += chunksResult[chunkKey];
      }
      
      // Verify length
      if (reassembled.length !== total_length) {
        console.warn(
          `Reassembled data length (${reassembled.length}) doesn't match expected length (${total_length})`
        );
      }
      
      return reassembled;
    } catch (error) {
      console.error("Error loading chunked data:", error);
      return null;
    }
  },

  /**
   * Clears all chunks for a key
   */
  async clearChunkedData(key: string) {
    try {
      // Get chunk info
      const infoResult = await chrome.storage.local.get(`${key}_info`);
      const infoData = infoResult[`${key}_info`];
      
      if (!infoData) {
        return true; // No chunks to clear
      }
      
      const info = JSON.parse(infoData);
      const { count } = info;
      
      // Collect all chunk keys
      const chunkKeys = [`${key}_info`];
      for (let i = 0; i < count; i++) {
        chunkKeys.push(`${key}_${i}`);
      }
      
      // Remove all chunks
      await chrome.storage.local.remove(chunkKeys);
      return true;
    } catch (error) {
      console.error("Error clearing chunked data:", error);
      return false;
    }
  },

  /**
   * Simple debounce function to limit frequency of function calls
   */
  debounce(fn: Function, delay: number) {
    let timeoutId: number | null = null;
    
    return function(this: any, ...args: any[]) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
        timeoutId = null;
      }, delay) as unknown as number;
    };
  },
};

/**
 * Initializes the storage service
 */
export function initStorageService(): Promise<boolean> {
  if (ENV.IS_DEV) {
    console.log("📦 Storage service initializing...");
  }
  
  // Initialize state storage
  return stateStorage.initialize();
}
