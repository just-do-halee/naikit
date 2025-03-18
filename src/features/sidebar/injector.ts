/**
 * Sidebar Injection Module
 *
 * This module handles the injection of the NaiKit sidebar into the NovelAI page.
 */
import { createMessenger } from "@/services/messaging";
import { storage } from "@/services/storage";
import { ENV, DEV } from "@/config/env";

/**
 * Sidebar injection configuration
 */
const SIDEBAR_CONFIG = {
  id: "naikit-sidebar",
  defaultWidth: 424,
  minWidth: 300,
  maxWidth: 800,
  zIndex: 9999,
};

/**
 * Inject the sidebar into the NovelAI page
 *
 * @returns Success status of the injection
 */
export async function injectSidebar(): Promise<boolean> {
  try {
    // Check if sidebar is already injected
    if (document.getElementById(SIDEBAR_CONFIG.id)) {
      DEV.log("Sidebar already injected");
      return true;
    }

    console.log(`Injecting ${ENV.APP_NAME} sidebar...`);

    // Get saved width or use default
    const savedWidth = await storage.get<number>("sidebar-width", SIDEBAR_CONFIG.defaultWidth);
    const width = Math.max(SIDEBAR_CONFIG.minWidth, Math.min(SIDEBAR_CONFIG.maxWidth, savedWidth || SIDEBAR_CONFIG.defaultWidth));

    // Create sidebar container
    const container = document.createElement("div");
    container.id = SIDEBAR_CONFIG.id;
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: ${width}px;
      z-index: ${SIDEBAR_CONFIG.zIndex};
      transform: translateX(0);
      transition: transform 0.3s ease-in-out;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    `;

    // Create sidebar iframe
    const iframe = document.createElement("iframe");
    iframe.id = `${SIDEBAR_CONFIG.id}-iframe`;
    
    // Get the URL for the sidebar HTML page
    const sidebarUrl = chrome.runtime.getURL("pages/sidebar.html");
    
    // Add a cache-busting parameter in development mode
    iframe.src = ENV.IS_DEV 
      ? `${sidebarUrl}?t=${Date.now()}` 
      : sidebarUrl;
      
    iframe.style.cssText = `
      border: none;
      height: 100%;
      width: 100%;
      background: transparent;
    `;
    
    // Set sandbox attributes for security but allow necessary functionality
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");

    // Create toggle button
    const toggleButton = document.createElement("button");
    toggleButton.id = `${SIDEBAR_CONFIG.id}-toggle`;
    toggleButton.innerHTML = "◀";
    toggleButton.style.cssText = `
      position: absolute;
      right: -30px;
      top: 50%;
      width: 30px;
      height: 60px;
      background: #2F3542;
      color: white;
      border: none;
      border-radius: 0 4px 4px 0;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      z-index: ${SIDEBAR_CONFIG.zIndex + 1};
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateY(-50%);
    `;

    // Toggle sidebar visibility handler
    const toggleSidebar = () => {
      if (container.style.transform === "translateX(0px)") {
        container.style.transform = `translateX(-${container.style.width})`;
        toggleButton.innerHTML = "▶";
        // Save settings
        storage.set("sidebar-collapsed", true);
      } else {
        container.style.transform = "translateX(0px)";
        toggleButton.innerHTML = "◀";
        // Save settings
        storage.set("sidebar-collapsed", false);
      }
    };

    // Add event listener to toggle button
    toggleButton.addEventListener("click", toggleSidebar);

    // Add elements to DOM
    container.appendChild(iframe);
    container.appendChild(toggleButton);
    document.body.appendChild(container);

    // Setup messaging system
    setupSidebarMessaging(iframe);

    // Listen for width change messages from the sidebar
    window.addEventListener("message", (event) => {
      if (event.source === iframe.contentWindow && event.data.type === "RESIZE_SIDEBAR") {
        const newWidth = Math.max(
          SIDEBAR_CONFIG.minWidth,
          Math.min(SIDEBAR_CONFIG.maxWidth, event.data.payload.width)
        );
        container.style.width = `${newWidth}px`;
        storage.set("sidebar-width", newWidth);
      }
    });

    // Apply saved collapse state
    const isCollapsed = await storage.get<boolean>("sidebar-collapsed", false);
    if (isCollapsed) {
      container.style.transform = `translateX(-${width}px)`;
      toggleButton.innerHTML = "▶";
    }

    // Adjust NovelAI UI to make room for sidebar
    adjustNovelAIUI(width, isCollapsed === true);

    console.log(`${ENV.APP_NAME} sidebar injected successfully`);
    return true;
  } catch (error) {
    console.error("Failed to inject sidebar:", error);
    return false;
  }
}

/**
 * Adjust NovelAI UI to work with our sidebar
 */
function adjustNovelAIUI(sidebarWidth: number, isCollapsed: boolean): void {
  if (isCollapsed) return; // No adjustment needed if sidebar is collapsed
  
  // Find the main content container
  const mainContent = document.querySelector('.app-content') as HTMLElement;
  if (mainContent) {
    mainContent.style.paddingLeft = `${sidebarWidth}px`;
    mainContent.style.transition = 'padding-left 0.3s ease-in-out';
  }
  
  // Add event listener to adjust when sidebar is toggled
  window.addEventListener("message", (event) => {
    if (event.data.type === "TOGGLE_SIDEBAR") {
      const isVisible = event.data.payload.isVisible;
      if (mainContent) {
        mainContent.style.paddingLeft = isVisible ? `${sidebarWidth}px` : "0";
      }
    }
  });
}

/**
 * Setup messaging between the sidebar and content script
 */
function setupSidebarMessaging(iframe: HTMLIFrameElement): void {
  const messenger = createMessenger("content");

  // Content script -> sidebar message forwarding
  messenger.onMessage((message) => {
    iframe.contentWindow?.postMessage(message, "*");
  });

  // Sidebar -> content script message reception
  window.addEventListener("message", (event) => {
    // Only process messages from our sidebar iframe
    if (event.source === iframe.contentWindow) {
      messenger.sendMessage(event.data.type, event.data.payload);
    }
  });
}
