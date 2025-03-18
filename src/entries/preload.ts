/**
 * Preload Script
 * 
 * This script ensures all necessary modules are loaded and initialized
 * before the main application starts.
 */

import { ENV } from "@/config/env";
import { initializeState } from "@/state";

console.log(`🔄 Preloading ${ENV.APP_NAME} dependencies v${ENV.APP_VERSION}`);

// Initialize state first to ensure all Axion atoms are created
initializeState();

// Log success in development mode
if (ENV.IS_DEV) {
  console.log("✅ Preload complete: State initialized");
}

// Export for direct use in HTML if needed
export default {
  initialized: true,
  appName: ENV.APP_NAME,
  version: ENV.APP_VERSION
};