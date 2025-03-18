import { injectSidebar } from "@/features/sidebar/injector";
import { setupMessaging } from "@/services/messaging";
import { setupErrorTracking } from "@/services/monitoring/error-tracking";
import { ENV, DEV } from "@/config/env";
import { observeNovelAiInterface } from "@/services/novelai/observer";
import { initNovelAIService, generateImage } from "@/services/novelai";

/**
 * Content Script Initialization Function
 */
async function initializeContentScript() {
  try {
    console.log(
      `🚀 Initializing ${ENV.APP_NAME} content script v${ENV.APP_VERSION}`
    );

    // Initialize error tracking
    setupErrorTracking("content");

    // Setup messaging system
    setupMessaging();

    // Check if we're on the NovelAI page
    if (!window.location.href.includes("novelai.net/image")) {
      DEV.log("Not on NovelAI image page, content script will not activate");
      return;
    }

    // Initialize NovelAI integration service
    await initNovelAIService();

    // Set up sidebar based on page load state
    if (document.readyState === "complete") {
      await injectSidebar();
    } else {
      window.addEventListener("load", async () => {
        await injectSidebar();
      });
    }

    // Start observing NovelAI interface
    observeNovelAiInterface();

    // Listen for messages from the sidebar iframe
    window.addEventListener("message", (event) => {
      // Process specific message types
      switch (event.data?.type) {
        case "GENERATE_IMAGE":
          generateImage();
          break;
        
        case "TOGGLE_SIDEBAR":
          // This is handled in the injector
          break;
          
        default:
          // Unknown message type, do nothing
          break;
      }
    });

    // Debug mode logging
    if (ENV.IS_DEV) {
      DEV.log(
        "Content script initialized with analytics:",
        ENV.ANALYTICS_ENABLED ? "enabled" : "disabled"
      );
    }
  } catch (error) {
    console.error("Failed to initialize content script:", error);
  }
}

// Run initialization
initializeContentScript();
