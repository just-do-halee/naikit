/**
 * Service Initialization Module
 *
 * Initializes application services and manages the startup sequence.
 */
import { ENV } from "@/config/env";
import { setupMessaging } from "./messaging";
import { initStorageService } from "./storage";
import { initNovelAIService } from "./novelai";

// Import and initialize all state
import { initializeState } from "@/state";

/**
 * Initialize all essential services
 *
 * @returns Initialization promise
 */
export async function initializeServices(): Promise<void> {
  try {
    // Log service initialization
    if (ENV.IS_DEV) {
      console.group("🚀 Initializing services");
      console.time("Services initialization");
    }
    
    // Initialize state structure first (without setting initialized flag)
    initializeState(false);
    
    if (ENV.IS_DEV) {
      console.log("✅ State structure initialized");
    }

    // Initialize storage service (loads persisted Axion state)
    await initStorageService();
    
    // Now we can mark Axion as fully initialized since storage loaded the state
    window.__AXION_INITIALIZED = true;
    
    if (ENV.IS_DEV) {
      console.log("✅ Axion fully initialized with persisted state");
    }

    // Initialize messaging system
    setupMessaging();

    // Initialize NovelAI integration service
    await initNovelAIService();

    // Add additional service initialization here...

    // Log initialization completion
    if (ENV.IS_DEV) {
      console.timeEnd("Services initialization");
      console.log("✅ All services initialized successfully");
      console.groupEnd();
    }
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
    throw error;
  }
}
