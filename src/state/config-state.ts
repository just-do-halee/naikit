/**
 * Configuration State Management with Axion
 * 
 * This file implements the state management for application-wide configuration
 * using Axion instead of Zustand/Immer.
 */

import axion from "axion-state";

// Types for configuration
export interface AppTheme {
  mode: "light" | "dark" | "system";
  accentColor: string;
  fontSize: "small" | "medium" | "large";
  reducedMotion: boolean;
  customColors?: Record<string, string>;
}

export interface EditorSettings {
  autoSave: boolean;
  autoCompile: boolean;
  spellCheck: boolean;
  suggestions: boolean;
  autoComplete: boolean;
  autoFormat: boolean;
}

export interface AnimationSettings {
  enableTransitions: boolean;
  transitionSpeed: "slow" | "normal" | "fast";
  enableAnimations: boolean;
  reduceMotion: boolean;
}

export interface SyncSettings {
  autoSyncWithNovelAI: boolean;
  syncInterval: number; // in milliseconds
  autoDetectChanges: boolean;
  confirmBeforeOverwrite: boolean;
}

export interface UISettings {
  sidebarWidth: number;
  showTooltips: boolean;
  showKeyboardShortcuts: boolean;
  compactMode: boolean;
  showLineNumbers: boolean;
}

export interface ConfigState {
  theme: AppTheme;
  editor: EditorSettings;
  animation: AnimationSettings;
  sync: SyncSettings;
  ui: UISettings;
  firstRun: boolean;
  keyboardShortcuts: Record<string, string>;
  developerMode: boolean;
}

// Default values
const defaultTheme: AppTheme = {
  mode: "system",
  accentColor: "#8E6FD8", // Default purple accent
  fontSize: "medium",
  reducedMotion: false,
};

const defaultEditor: EditorSettings = {
  autoSave: true,
  autoCompile: true,
  spellCheck: true,
  suggestions: true,
  autoComplete: true,
  autoFormat: true,
};

const defaultAnimation: AnimationSettings = {
  enableTransitions: true,
  transitionSpeed: "normal",
  enableAnimations: true,
  reduceMotion: false,
};

const defaultSync: SyncSettings = {
  autoSyncWithNovelAI: true,
  syncInterval: 1000, // 1 second
  autoDetectChanges: true,
  confirmBeforeOverwrite: true,
};

const defaultUI: UISettings = {
  sidebarWidth: 300,
  showTooltips: true,
  showKeyboardShortcuts: true,
  compactMode: false,
  showLineNumbers: true,
};

// Default keyboard shortcuts
const defaultKeyboardShortcuts: Record<string, string> = {
  toggleMode: "Ctrl+W",
  save: "Ctrl+S",
  compile: "Ctrl+R",
  newPreset: "Ctrl+N",
  toggleSidebar: "Ctrl+B",
  help: "F1",
};

// Create initial state
const initialConfigState: ConfigState = {
  theme: defaultTheme,
  editor: defaultEditor,
  animation: defaultAnimation,
  sync: defaultSync,
  ui: defaultUI,
  firstRun: true, // Will be set to false after first run
  keyboardShortcuts: defaultKeyboardShortcuts,
  developerMode: false,
};

// Create Axion atom for config state
export const configState = axion<ConfigState>(initialConfigState);

// Actions
export const configActions = {
  // Theme settings
  setThemeMode: (mode: "light" | "dark" | "system") => {
    configState.at("theme").at("mode").set(mode);
  },
  
  setAccentColor: (color: string) => {
    configState.at("theme").at("accentColor").set(color);
  },
  
  setFontSize: (size: "small" | "medium" | "large") => {
    configState.at("theme").at("fontSize").set(size);
  },
  
  setReducedMotion: (enabled: boolean) => {
    configState.at("theme").at("reducedMotion").set(enabled);
    // Also update animation settings
    configState.at("animation").at("reduceMotion").set(enabled);
  },
  
  // Editor settings
  updateEditorSettings: (settings: Partial<EditorSettings>) => {
    configState.at("editor").update(current => {
      return Object.assign({}, current as object, settings);
    });
  },
  
  // Animation settings
  updateAnimationSettings: (settings: Partial<AnimationSettings>) => {
    configState.at("animation").update(current => {
      return Object.assign({}, current as object, settings);
    });
  },
  
  // Sync settings
  updateSyncSettings: (settings: Partial<SyncSettings>) => {
    configState.at("sync").update(current => {
      return Object.assign({}, current as object, settings);
    });
  },
  
  // UI settings
  updateUISettings: (settings: Partial<UISettings>) => {
    configState.at("ui").update(current => {
      return Object.assign({}, current as object, settings);
    });
  },
  
  // Sidebar width specifically (common operation)
  setSidebarWidth: (width: number) => {
    configState.at("ui").at("sidebarWidth").set(width);
  },
  
  // Keyboard shortcuts
  updateKeyboardShortcut: (action: string, shortcut: string) => {
    configState.at("keyboardShortcuts").at(action).set(shortcut);
  },
  
  resetKeyboardShortcuts: () => {
    configState.at("keyboardShortcuts").set(defaultKeyboardShortcuts);
  },
  
  // Developer mode
  toggleDeveloperMode: () => {
    configState.at("developerMode").update(current => !current);
  },
  
  // First run
  completeFirstRun: () => {
    configState.at("firstRun").set(false);
  },
  
  // Reset all settings
  resetAllSettings: () => {
    configState.set(initialConfigState);
  },
  
  // Import/Export
  exportSettings: () => {
    return JSON.stringify(configState.get());
  },
  
  importSettings: (settingsJson: string) => {
    try {
      const settings = JSON.parse(settingsJson) as ConfigState;
      configState.set(settings);
      return true;
    } catch (error) {
      console.error("Failed to import settings:", error);
      return false;
    }
  },
};

// Derived states
export const effectiveThemeMode = axion.derive(() => {
  const themeMode = configState.get().theme.mode;
  
  if (themeMode === "system") {
    // Check system preference
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDarkMode ? "dark" : "light";
  }
  
  return themeMode;
});

export const fontSizeValue = axion.derive(() => {
  const fontSize = configState.get().theme.fontSize;
  
  switch (fontSize) {
    case "small": return "0.875rem"; // 14px
    case "medium": return "1rem";    // 16px
    case "large": return "1.125rem"; // 18px
    default: return "1rem";
  }
});

export const shouldUseReducedMotion = axion.derive(() => {
  const { animation, theme } = configState.get();
  
  // Check if user has explicitly set reduced motion
  if (theme.reducedMotion || animation.reduceMotion) {
    return true;
  }
  
  // Check system preference
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
});