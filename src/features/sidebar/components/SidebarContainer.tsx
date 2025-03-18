import React, { useState, useEffect, useRef, useCallback } from "react";
import { ENV } from "@/config/env";
import { useActiveModeReactive, ActiveMode } from "@/state/react-bindings";

interface SidebarContainerProps {
  children?: React.ReactNode;
}

/**
 * Main Sidebar Container Component
 * 
 * This component serves as the primary container for the NaiKit sidebar.
 * It handles the sidebar layout, resizing functionality, and basic structure.
 */
export const SidebarContainer: React.FC<SidebarContainerProps> = ({ children }) => {
  // Resizing state
  const [width, setWidth] = useState(424);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef<number>(0);
  const initialWidth = useRef<number>(0);
  
  // Handle width changes by notifying the parent content script
  const notifyWidthChange = useCallback((newWidth: number) => {
    if (window.parent) {
      window.parent.postMessage({
        type: "RESIZE_SIDEBAR",
        payload: {
          width: newWidth
        }
      }, "*");
    }
  }, []);
  
  // Handle mouse events for resizing
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    initialWidth.current = width;
  };

  const handleResizeEnd = () => {
    if (isResizing) {
      setIsResizing(false);
      // Notify parent of final width when resizing ends
      notifyWidthChange(width);
    }
  };

  // Add global mouse event listeners when resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - resizeStartX.current;
      const newWidth = Math.max(300, Math.min(800, initialWidth.current + deltaX));
      setWidth(newWidth);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, notifyWidthChange, width]);

  return (
    <div 
      className="sidebar-container bg-gray-900 text-white h-full flex flex-col"
      style={{ width: `${width}px` }}
    >
      <SidebarHeader />
      
      <div className="sidebar-content flex-1 overflow-y-auto">
        {children}
      </div>
      
      <SidebarFooter />
      
      {/* Resize handle */}
      <div
        className="resize-handle absolute right-0 top-0 w-4 h-full cursor-ew-resize hover:bg-blue-500/20 z-10"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
};

/**
 * Sidebar Header Component
 * 
 * Contains the title, mode selection tabs, and any other header content.
 */
const SidebarHeader: React.FC = () => {
  // Get the current mode with loading and error states
  const [rawActiveMode, _isLoadingMode, modeError] = useActiveModeReactive();
  // Use _ prefix for unused variables
  const [activeMode, setActiveMode] = useState<ActiveMode>("compose");
  
  // Handle errors
  useEffect(() => {
    if (modeError) {
      console.error("Failed to load active mode:", modeError);
    }
  }, [modeError]);
  
  // Import the type guard from react-bindings.ts
  const isValidMode = (mode: unknown): mode is ActiveMode => 
    mode === "compose" || mode === "finetune";
    
  // Update active mode when Axion state changes
  useEffect(() => {
    if (rawActiveMode && isValidMode(rawActiveMode)) {
      setActiveMode(rawActiveMode);
    }
  }, [rawActiveMode]);
  
  // Toggle mode handler
  const toggleMode = useCallback(() => {
    const newMode = activeMode === "compose" ? "finetune" : "compose";
    setActiveMode(newMode);
    
    // Here we would normally call segmentActions.setActiveMode(newMode)
    // but we'll just update our local state for now until Axion is fully working
  }, [activeMode]);
  
  return (
    <div className="sidebar-header border-b border-gray-700 p-2">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg font-bold">{ENV.APP_NAME}</h1>
        <div className="text-xs text-gray-400">v{ENV.APP_VERSION}</div>
      </div>
      
      <ModeTabs activeMode={activeMode} onModeChange={toggleMode} />
    </div>
  );
};

interface ModeTabsProps {
  activeMode: "compose" | "finetune";
  onModeChange: () => void;
}

/**
 * Mode Selection Tabs Component
 * 
 * Provides tabs for switching between Compose and Fine-tune modes.
 */
const ModeTabs: React.FC<ModeTabsProps> = ({ activeMode, onModeChange }) => {
  return (
    <div className="mode-tabs flex border border-gray-700 rounded overflow-hidden">
      <button
        className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
          activeMode === "compose" 
            ? "bg-blue-600 text-white" 
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
        }`}
        onClick={() => activeMode !== "compose" && onModeChange()}
      >
        Compose
      </button>
      <button
        className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
          activeMode === "finetune" 
            ? "bg-blue-600 text-white" 
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
        }`}
        onClick={() => activeMode !== "finetune" && onModeChange()}
      >
        Fine-tune
      </button>
    </div>
  );
};

/**
 * Sidebar Footer Component
 * 
 * Contains generation controls, status indicators, etc.
 */
const SidebarFooter: React.FC = () => {
  // For development purposes, we'll use mock values
  // These will be replaced with actual state when the NovelAI service is integrated
  const isConnected = true;
  const isAvailable = true;
  const isGenerating = false;
  const progress = 0;
  const balance = 10.5;
  const estimatedCost = 0.5;
  
  // Handle generate button click
  const handleGenerate = () => {
    // Send message to parent window to trigger generation
    window.parent.postMessage({
      type: "GENERATE_IMAGE",
      payload: {}
    }, "*");
  };
  
  // Determine status display
  let statusText = "Disconnected";
  let statusClass = "text-red-400";
  
  if (isConnected) {
    if (isGenerating) {
      statusText = `Generating (${progress}%)`;
      statusClass = "text-yellow-400";
    } else if (isAvailable) {
      statusText = "Connected";
      statusClass = "text-green-400";
    } else {
      statusText = "Unavailable";
      statusClass = "text-orange-400";
    }
  }
  
  // Format Anlas display
  const anlasDisplay = balance.toFixed(2);
  const costDisplay = estimatedCost.toFixed(2);
  
  return (
    <div className="sidebar-footer border-t border-gray-700 p-2">
      <div className="flex justify-between items-center mb-1">
        <div className="text-xs text-gray-400">
          Status: <span className={statusClass}>{statusText}</span>
        </div>
        <div className="text-xs text-gray-400">
          Anlas: <span className="text-blue-300">{anlasDisplay}</span>
          {estimatedCost > 0 && <span className="ml-1">({costDisplay}/gen)</span>}
        </div>
      </div>
      
      <div className="flex justify-end">
        <button 
          className={`py-1 px-3 rounded text-sm font-medium ${
            isConnected && isAvailable && !isGenerating
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
          onClick={handleGenerate}
          disabled={!isConnected || !isAvailable || isGenerating}
        >
          {isGenerating ? `Generating... ${progress}%` : "Generate"}
        </button>
      </div>
    </div>
  );
};