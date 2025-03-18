/**
 * React Bindings for Configuration State
 * 
 * This file provides React-specific hooks for the configuration state management
 */

import { useAxion } from "axion-state/react";
import { useCallback, useEffect } from "react";
import {
  configState,
  configActions,
  effectiveThemeMode,
  fontSizeValue,
  shouldUseReducedMotion,
  EditorSettings,
  AnimationSettings,
  SyncSettings,
  UISettings
  // AppTheme is not used, so removed
} from "./config-state";

// Basic state hooks
export function useConfig() {
  return useAxion(configState);
}

export function useTheme() {
  return useAxion(configState.at("theme"));
}

export function useEditorSettings() {
  return useAxion(configState.at("editor"));
}

export function useAnimationSettings() {
  return useAxion(configState.at("animation"));
}

export function useSyncSettings() {
  return useAxion(configState.at("sync"));
}

export function useUISettings() {
  return useAxion(configState.at("ui"));
}

export function useKeyboardShortcuts() {
  return useAxion(configState.at("keyboardShortcuts"));
}

export function useDeveloperMode() {
  return useAxion(configState.at("developerMode"));
}

export function useFirstRun() {
  return useAxion(configState.at("firstRun"));
}

// Derived hooks
export function useEffectiveThemeMode() {
  return useAxion(effectiveThemeMode);
}

export function useFontSizeValue() {
  return useAxion(fontSizeValue);
}

export function useShouldUseReducedMotion() {
  return useAxion(shouldUseReducedMotion);
}

// Actions as hooks
export function useConfigActions() {
  // Theme actions
  const setThemeMode = useCallback((mode: "light" | "dark" | "system") => {
    configActions.setThemeMode(mode);
  }, []);

  const setAccentColor = useCallback((color: string) => {
    configActions.setAccentColor(color);
  }, []);

  const setFontSize = useCallback((size: "small" | "medium" | "large") => {
    configActions.setFontSize(size);
  }, []);

  const setReducedMotion = useCallback((enabled: boolean) => {
    configActions.setReducedMotion(enabled);
  }, []);

  // Editor settings
  const updateEditorSettings = useCallback((settings: Partial<EditorSettings>) => {
    configActions.updateEditorSettings(settings);
  }, []);

  // Animation settings
  const updateAnimationSettings = useCallback((settings: Partial<AnimationSettings>) => {
    configActions.updateAnimationSettings(settings);
  }, []);

  // Sync settings
  const updateSyncSettings = useCallback((settings: Partial<SyncSettings>) => {
    configActions.updateSyncSettings(settings);
  }, []);

  // UI settings
  const updateUISettings = useCallback((settings: Partial<UISettings>) => {
    configActions.updateUISettings(settings);
  }, []);

  // Sidebar width
  const setSidebarWidth = useCallback((width: number) => {
    configActions.setSidebarWidth(width);
  }, []);

  // Keyboard shortcuts
  const updateKeyboardShortcut = useCallback((action: string, shortcut: string) => {
    configActions.updateKeyboardShortcut(action, shortcut);
  }, []);

  const resetKeyboardShortcuts = useCallback(() => {
    configActions.resetKeyboardShortcuts();
  }, []);

  // Developer mode
  const toggleDeveloperMode = useCallback(() => {
    configActions.toggleDeveloperMode();
  }, []);

  // First run
  const completeFirstRun = useCallback(() => {
    configActions.completeFirstRun();
  }, []);

  // Reset all settings
  const resetAllSettings = useCallback(() => {
    configActions.resetAllSettings();
  }, []);

  // Import/Export
  const exportSettings = useCallback(() => {
    return configActions.exportSettings();
  }, []);

  const importSettings = useCallback((settingsJson: string) => {
    return configActions.importSettings(settingsJson);
  }, []);

  return {
    setThemeMode,
    setAccentColor,
    setFontSize,
    setReducedMotion,
    updateEditorSettings,
    updateAnimationSettings,
    updateSyncSettings,
    updateUISettings,
    setSidebarWidth,
    updateKeyboardShortcut,
    resetKeyboardShortcuts,
    toggleDeveloperMode,
    completeFirstRun,
    resetAllSettings,
    exportSettings,
    importSettings,
  };
}

// Theme application hook
export function useThemeEffect() {
  const theme = useEffectiveThemeMode();
  const accentColor = useAxion(configState.at("theme").at("accentColor"));
  const fontSize = useFontSizeValue();
  const reducedMotion = useShouldUseReducedMotion();
  
  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute("data-theme", theme);
    
    // Set CSS variables for theme
    document.documentElement.style.setProperty("--accent-color", accentColor as string || "#3b82f6");
    document.documentElement.style.setProperty("--font-size", fontSize);
    
    // Set reduced motion class
    if (reducedMotion) {
      document.documentElement.classList.add("reduced-motion");
    } else {
      document.documentElement.classList.remove("reduced-motion");
    }
    
    // Apply dark/light mode to body
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [theme, accentColor, fontSize, reducedMotion]);
  
  return { theme, accentColor, fontSize, reducedMotion };
}

// First run hook 
export function useFirstRunEffect() {
  const isFirstRun = useFirstRun();
  const { completeFirstRun } = useConfigActions();
  
  useEffect(() => {
    if (isFirstRun) {
      // Do first run setup here
      // For example, show welcome screen, tutorial, etc.
      
      // Mark first run as complete
      // completeFirstRun();
      
      // Note: We're not automatically completing first run
      // so that we can show onboarding, but we leave the code
      // here for reference
    }
  }, [isFirstRun, completeFirstRun]);
  
  return isFirstRun;
}

// Keyboard shortcuts hook
export function useKeyboardShortcutEffect(
  shortcutKey: string,
  callback: () => void,
  deps: any[] = []
): void {
  const shortcuts = useKeyboardShortcuts();
  const shortcut = shortcuts ? (shortcuts as Record<string, string>)[shortcutKey] : undefined;
  
  useEffect(() => {
    if (!shortcut) return undefined;
    
    const parts = shortcut.split("+");
    const modifiers = {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false
    };
    
    let key = "";
    
    parts.forEach((part: string) => {
      const lowered = part.toLowerCase();
      if (lowered === "ctrl") modifiers.ctrl = true;
      else if (lowered === "alt") modifiers.alt = true;
      else if (lowered === "shift") modifiers.shift = true;
      else if (lowered === "meta" || lowered === "cmd") modifiers.meta = true;
      else key = part;
    });
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if all modifiers and key match
      if (
        e.ctrlKey === modifiers.ctrl &&
        e.altKey === modifiers.alt &&
        e.shiftKey === modifiers.shift &&
        e.metaKey === modifiers.meta &&
        e.key.toLowerCase() === key.toLowerCase()
      ) {
        e.preventDefault();
        callback();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcut, callback, ...deps]);
}