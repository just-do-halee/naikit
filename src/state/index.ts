/**
 * State Management Unified Exports
 * 
 * This file provides a centralized export point for all state-related functionality.
 * It helps maintain clean imports throughout the application.
 */

// Core Axion State Exports
export * from './segment-state';
export * from './preset-state';
export * from './config-state';
export * from './novelai-state';

// React-specific Bindings
export * from './react-bindings';
export * from './preset-react-bindings';
export * from './config-react-bindings';
export * from './novelai-react-bindings';

// Utilities and Types
export { default as axion } from 'axion-state';
export { useAxion, useAxionEffect } from 'axion-state/react';

/**
 * Initialize all application state
 * This ensures that Axion atoms are properly created before use
 */
// Import directly to ensure they get initialized
import { segmentState } from './segment-state';
import { presetState } from './preset-state';
import { configState } from './config-state';
import { novelAIState } from './novelai-state';

// Add a global flag to track initialization state
declare global {
  interface Window {
    __AXION_INITIALIZED?: boolean;
  }
}

export function initializeState(markAsInitialized = true) {
  // Check if already initialized
  if (window.__AXION_INITIALIZED && markAsInitialized) {
    console.log('[NaiKit State] Already initialized, skipping initialization');
    return true;
  }

  try {
    // Force initialization by accessing the atoms
    console.log('[NaiKit State] Ensuring atoms are initialized...');
    
    // Verify that atoms exist - this will throw if they don't
    if (!segmentState) {
      console.error('[NaiKit State] segment-state atom not found');
    } else {
      console.log('[NaiKit State] segment-state atom found');
      // Log current state
      console.log('[NaiKit State] segment-state value:', segmentState.get());
    }
    
    if (!presetState) {
      console.error('[NaiKit State] preset-state atom not found');
    } else {
      console.log('[NaiKit State] preset-state atom found');
      console.log('[NaiKit State] preset-state value:', presetState.get());
    }
    
    if (!configState) {
      console.error('[NaiKit State] config-state atom not found');
    } else {
      console.log('[NaiKit State] config-state atom found');
      console.log('[NaiKit State] config-state value:', configState.get());
    }
    
    if (!novelAIState) {
      console.error('[NaiKit State] novelai-state atom not found');
    } else {
      console.log('[NaiKit State] novelai-state atom found');
      console.log('[NaiKit State] novelai-state value:', novelAIState.get());
    }
    
    // Initialize with test data if in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('[NaiKit State] Development mode detected, initializing with test data');
      // This will be a no-op if you've already imported test-segments elsewhere
      try {
        const { initializeTestSegments } = require('../utils/test-segments');
        const mainPositiveId = segmentState.get().rootSegments?.main?.positive;
        if (mainPositiveId) {
          initializeTestSegments(mainPositiveId);
          console.log('[NaiKit State] Test data initialized for main positive');
        }
      } catch (e) {
        console.warn('[NaiKit State] Could not initialize test data:', e);
      }
    }
    
    // Only mark as initialized if explicitly requested
    // This allows us to separate structure initialization from data loading
    if (markAsInitialized) {
      window.__AXION_INITIALIZED = true;
      console.log('[NaiKit State] All state modules successfully verified and marked as initialized');
    } else {
      console.log('[NaiKit State] All state modules successfully verified (waiting for data load)');
    }
    
    return true;
  } catch (error) {
    console.error('[NaiKit State] Failed to initialize state:', error);
    return false;
  }
}