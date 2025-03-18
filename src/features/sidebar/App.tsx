import React, { useEffect, useState, createContext, useContext } from "react";
import { SidebarContainer, MainContent } from "./components";
import { useRootSegmentsReactive } from "@/state/react-bindings";
import { initializeTestSegments } from "@/utils/test-segments";
import { isObject, hasProperty, safeGet } from "@/shared/utils/type-safety";
import { initializeState } from "@/state";

/**
 * Type guard for RootSegments structure
 */
function isValidRootSegments(data: unknown): boolean {
  if (!isObject(data)) return false;
  
  // Check main property structure
  if (!hasProperty(data, 'main')) return false;
  const main = data.main;
  
  if (!isObject(main)) return false;
  if (!hasProperty(main, 'positive') || !hasProperty(main, 'negative')) return false;
  if (typeof main.positive !== 'string' || typeof main.negative !== 'string') return false;
  
  // Check characters property structure if it exists
  if (hasProperty(data, 'characters')) {
    const characters = data.characters;
    if (!isObject(characters)) return false;
  }
  
  return true;
}

// Create a context for Axion initialization state
type AxionContextType = {
  isReady: boolean;
  forceReady: () => void;
};

const AxionContext = createContext<AxionContextType>({
  isReady: false,
  forceReady: () => {}
});

// Provider component that ensures Axion is properly initialized
const AxionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    console.log("AxionProvider: Checking initialization status");
    
    // If window.__AXION_INITIALIZED is already true, we're good
    if (window.__AXION_INITIALIZED) {
      console.log("AxionProvider: Axion already initialized");
      setIsReady(true);
      return;
    }
    
    // Manually initialize Axion with complete state to ensure it's ready
    try {
      // Force initialization with true flag to explicitly set initialized flag
      initializeState(true);
      window.__AXION_INITIALIZED = true;
      console.log("AxionProvider: Manually initialized Axion");
      setIsReady(true);
    } catch (error) {
      console.error("AxionProvider: Failed to initialize Axion:", error);
      // We'll try again with the interval below
    }
    
    // Set up an interval to check until initialization is complete
    const checkInterval = setInterval(() => {
      if (window.__AXION_INITIALIZED) {
        console.log("AxionProvider: Axion initialization detected");
        setIsReady(true);
        clearInterval(checkInterval);
      }
    }, 200);
    
    return () => clearInterval(checkInterval);
  }, []);
  
  // Force ready function for emergency cases
  const forceReady = () => {
    console.log("AxionProvider: Forcing ready state");
    window.__AXION_INITIALIZED = true;
    setIsReady(true);
  };
  
  return (
    <AxionContext.Provider value={{ isReady, forceReady }}>
      {children}
    </AxionContext.Provider>
  );
};

// Hook to use the Axion context
const useAxionInitialized = () => useContext(AxionContext);

// We'll remove this unused hook

/**
 * Sidebar Main App Component
 * 
 * Root component for the NaiKit sidebar that integrates all UI components.
 */
const App: React.FC = () => {
  // Use our new context-based initialization tracking
  const { isReady } = useAxionInitialized();
  
  // Use the improved hook that handles loading, errors and data
  const [rootSegmentsRaw, _isRootSegmentsLoading, rootSegmentsError] = useRootSegmentsReactive();
  // Use _ prefix for unused variables
  
  // Log any errors to the console for debugging
  useEffect(() => {
    if (rootSegmentsError) {
      console.error("Error loading root segments:", rootSegmentsError);
    }
  }, [rootSegmentsError]);
  
  // Use a safe default if data is not yet available
  const rootSegmentsData = rootSegmentsRaw || { 
    main: { positive: '', negative: '' }, 
    characters: {} 
  };
  
  // Initialize test segments for development purposes
  useEffect(() => {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Initializing test segments for development...');
      
      // Validate rootSegments structure
      if (!rootSegmentsData || !isValidRootSegments(rootSegmentsData)) {
        console.error('Root segments data is not valid');
        return;
      }
      
      // Now TypeScript knows rootSegmentsData has the correct structure
      // Without using type assertions
      const mainPositive = safeGet<string>(rootSegmentsData, 'main', 'positive');
      const mainNegative = safeGet<string>(rootSegmentsData, 'main', 'negative');
      
      if (mainPositive) {
        initializeTestSegments(mainPositive);
      }
      
      if (mainNegative) {
        initializeTestSegments(mainNegative);
      }
      
      // Safely access character data if it exists
      const character0 = safeGet(rootSegmentsData, 'characters', '0');
      if (isObject(character0)) {
        const charPositive = safeGet<string>(character0, 'positive');
        const charNegative = safeGet<string>(character0, 'negative');
        
        if (charPositive) initializeTestSegments(charPositive);
        if (charNegative) initializeTestSegments(charNegative);
      }
    }
  }, [rootSegmentsData]);
  
  // Show loading state if Axion isn't ready
  if (!isReady) {
    return (
      <div className="sidebar-app h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Loading...</p>
          <p className="text-sm text-gray-500">Initializing application state</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-app h-screen w-full">
      <SidebarContainer>
        <MainContent />
      </SidebarContainer>
    </div>
  );
};

export { AxionProvider };
export default App;
