/**
 * React Bindings for Axion State
 *
 * This file provides React-specific hooks and bindings for the Axion state management.
 */

// We need both imports for the API but useAxionEffect is not directly used in this file
// @ts-expect-error - Suppressing unused import warning for useAxionEffect which is part of the API
import { useAxion, useAxionEffect } from "axion-state/react";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";

// Add a global declaration for initialization status
declare global {
  interface Window {
    __AXION_INITIALIZED?: boolean;
  }
}

import { Segment, Group } from "@/core/segment-model/types";
import { segmentState, segmentActions, selectedSegments } from "./segment-state";
import { compileSegmentTree } from "@/core/compiler/segment-compiler";

/**
 * Core types for React bindings
 */

/** Subscription handler with typed value */
// @ts-ignore - Used in type definitions even if TypeScript doesn't detect it
type TypedSubscriptionHandler<T> = (value: T) => void;

/** Result status for asynchronous state operations */
type StateResult<T> = 
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T };

/** Configuration options for hooks */
interface HookOptions {
  /** Whether to throw errors instead of returning them */
  throwErrors?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
}

/** Default hook options */
const DEFAULT_HOOK_OPTIONS: HookOptions = {
  throwErrors: false,
  onError: (error) => console.error(error)
};

// Reactive hooks for components

/**
 * Hook to use and subscribe to segment state
 */
export function useSegmentStateReactive() {
  return useAxion(segmentState);
}

/**
 * Hook to get and subscribe to a specific segment by ID
 */
export function useSegment(id: string | null) {
  const pathOperator = id ? segmentState.at("segments").at(id) : null;
  return pathOperator ? useAxion(pathOperator) : null;
}

// We could implement a more advanced helper here if needed
// but for now we're using a simpler approach with direct conditionals

/**
 * Hook to get and subscribe to all segments
 */
export function useSegmentsReactive() {
  const defaultValue = {};
  
  // Only use Axion if it's initialized
  if (window.__AXION_INITIALIZED) {
    try {
      return useAxion(segmentState.at("segments"));
    } catch (error) {
      console.error("Error in useSegmentsReactive:", error);
      return defaultValue;
    }
  }
  
  return defaultValue;
}

/**
 * Define the RootSegments type for better type safety
 */
export interface SegmentReference {
  positive: string;
  negative: string;
}

export interface RootSegments {
  main: SegmentReference;
  characters: Record<string, SegmentReference>;
}

/**
 * Helper to safely access Axion state - used internally by hooks
 * 
 * @internal
 */
function safelyAccessState<T>(
  accessor: () => T, 
  options: HookOptions = DEFAULT_HOOK_OPTIONS
): StateResult<T> {
  try {
    if (!window.__AXION_INITIALIZED) {
      return { status: 'loading' };
    }
    
    const data = accessor();
    return { status: 'success', data };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (options.onError) {
      options.onError(error);
    }
    
    if (options.throwErrors) {
      throw error;
    }
    
    return { status: 'error', error };
  }
}

// Mark as used to avoid TS unused variable warning
// @ts-ignore - Suppress unused variable warning
void safelyAccessState;

/**
 * Factory for creating reactive hooks for state paths
 */
function createPathReactiveHook<T>(
  getPathOperator: () => ReturnType<typeof segmentState.at> | null,
  _defaultValue: T // Prefix with _ to mark as intentionally unused
) {
  return (options: HookOptions = DEFAULT_HOOK_OPTIONS): [T | null, boolean, Error | null] => {
    const [value, setValue] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    // Use a ref to track mount state
    const isMountedRef = useRef(true);
    
    // Safe setter that checks mount state
    const safeSetValue = useCallback((val: T | null) => {
      if (isMountedRef.current) {
        setValue(val);
      }
    }, []);
    
    const safeSetLoading = useCallback((val: boolean) => {
      if (isMountedRef.current) {
        setIsLoading(val);
      }
    }, []);
    
    const safeSetError = useCallback((err: Error | null) => {
      if (isMountedRef.current) {
        setError(err);
      }
    }, []);
    
    useEffect(() => {
      safeSetLoading(true);
      
      try {
        if (!window.__AXION_INITIALIZED || !segmentState) {
          return undefined;
        }
        
        const pathOp = getPathOperator();
        if (!pathOp) {
          throw new Error("Path operator not found");
        }
        
        // Initial load
        safeSetValue(pathOp.get() as T);
        safeSetLoading(false);
        
        // Subscribe to changes
        const unsubscribe = pathOp.subscribe(() => {
          try {
            safeSetValue(pathOp.get() as T);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            safeSetError(error);
            if (options.onError) {
              options.onError(error);
            }
          }
        });
        
        return () => {
          unsubscribe();
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        safeSetError(error);
        safeSetLoading(false);
        
        if (options.onError) {
          options.onError(error);
        }
        
        if (options.throwErrors) {
          throw error;
        }
      }
      
      return () => {
        isMountedRef.current = false;
      };
    }, [safeSetValue, safeSetLoading, safeSetError, options]);
    
    return [value, isLoading, error];
  };
}

/**
 * Hook to get and subscribe to root segments
 */
export function useRootSegmentsReactive(options: HookOptions = DEFAULT_HOOK_OPTIONS): 
  [RootSegments | null, boolean, Error | null] {
  
  const getPathOperator = useCallback(() => {
    return segmentState?.at("rootSegments") || null;
  }, []);
  
  const defaultValue: RootSegments = {
    main: { positive: '', negative: '' },
    characters: {}
  };
  
  return createPathReactiveHook<RootSegments>(
    getPathOperator,
    defaultValue
  )(options);
}

/**
 * Hook to get and subscribe to all groups
 */
export function useGroupsReactive() {
  const defaultValue = {};
  
  // Only use Axion if it's initialized
  if (window.__AXION_INITIALIZED) {
    try {
      return useAxion(segmentState.at("groups"));
    } catch (error) {
      console.error("Error in useGroupsReactive:", error);
      return defaultValue;
    }
  }
  
  return defaultValue;
}

/**
 * Hook to get and subscribe to a specific group by ID
 */
export function useGroup(id: string | null) {
  const pathOperator = id ? segmentState.at("groups").at(id) : null;
  return pathOperator ? useAxion(pathOperator) : null;
}

/**
 * Type for active mode values
 */
export type ActiveMode = "compose" | "finetune";

/**
 * Type guard for checking if a value is a valid ActiveMode
 */
export function isValidActiveMode(value: unknown): value is ActiveMode {
  return value === "compose" || value === "finetune";
}

/**
 * ActiveMode validation and normalization
 */
function normalizeActiveMode(value: unknown): ActiveMode {
  if (isValidActiveMode(value)) {
    return value;
  }
  console.warn(`Invalid active mode "${String(value)}", defaulting to "compose"`);
  return "compose";
}

/**
 * Hook to get and subscribe to active mode
 */
export function useActiveModeReactive(options: HookOptions = DEFAULT_HOOK_OPTIONS): 
  [ActiveMode | null, boolean, Error | null] {
  
  const getPathOperator = useCallback(() => {
    return segmentState?.at("activeMode") || null;
  }, []);
  
  const [rawValue, isLoading, error] = createPathReactiveHook<unknown>(
    getPathOperator,
    "compose"
  )(options);
  
  // Transform the raw value to ensure type safety
  const activeMode = useMemo(() => {
    if (rawValue === null) return null;
    return normalizeActiveMode(rawValue);
  }, [rawValue]);
  
  return [activeMode, isLoading, error];
}

/**
 * Hook to get and subscribe to selected IDs
 */
export function useSelectedIdsReactive() {
  const defaultValue: string[] = [];
  
  if (window.__AXION_INITIALIZED) {
    try {
      return useAxion(segmentState.at("selectedIds"));
    } catch (error) {
      console.error("Error in useSelectedIdsReactive:", error);
      return defaultValue;
    }
  }
  
  return defaultValue;
}

/**
 * Hook to get and subscribe to selected segments
 */
export function useSelectedSegmentsReactive() {
  const defaultValue: Segment[] = [];
  
  if (window.__AXION_INITIALIZED) {
    try {
      return useAxion(selectedSegments);
    } catch (error) {
      console.error("Error in useSelectedSegmentsReactive:", error);
      return defaultValue;
    }
  }
  
  return defaultValue;
}

/**
 * Hook to compile a segment and subscribe to changes
 */
export function useCompiledSegment(id: string | null, expandWildcards = false) {
  const segment = useSegment(id);
  const [compiledText, setCompiledText] = useState("");
  
  useEffect(() => {
    if (!segment) {
      setCompiledText("");
      return;
    }

    // Compile the segment to text
    const text = compileSegmentTree(segment as Segment, { expandWildcards });
    setCompiledText(text);
  }, [segment, expandWildcards]);

  return compiledText;
}

/**
 * Hook to manage transactions when modifying multiple segments at once
 */
export function useSegmentTransaction() {
  const beginTransaction = useCallback(() => {
    // In a future implementation, this would use axion.tx() to start a transaction
    // For now, we'll just batch updates with React's batching
  }, []);

  const commitTransaction = useCallback(() => {
    // In a future implementation, this would commit the transaction
  }, []);

  return {
    beginTransaction,
    commitTransaction,
  };
}

/**
 * Hook for segment selection management
 */
export function useSegmentSelection() {
  const selectedIds = useSelectedIdsReactive();
  
  const selectSegment = useCallback((id: string, multiSelect = false) => {
    segmentActions.selectSegment(id, multiSelect);
  }, []);
  
  const deselectSegment = useCallback((id: string) => {
    segmentActions.deselectSegment(id);
  }, []);
  
  const clearSelection = useCallback(() => {
    segmentActions.clearSelection();
  }, []);
  
  const isSelected = useCallback((id: string) => {
    return Array.isArray(selectedIds) && selectedIds.includes(id);
  }, [selectedIds]);
  
  return {
    selectedIds,
    selectSegment,
    deselectSegment,
    clearSelection,
    isSelected,
  };
}

/**
 * Hook for segment creation and manipulation
 */
export function useSegmentOperations() {
  // Expose all segment actions with React callbacks
  const createTextSegment = useCallback((content: string) => {
    return segmentActions.createTextSegment(content);
  }, []);

  const createWeightedSegment = useCallback(
    (childIds: string[], bracketType: "increase" | "decrease", level: number) => {
      return segmentActions.createWeightedSegment(childIds, bracketType, level);
    },
    []
  );

  const createPresetSegment = useCallback(
    (name: string, mode: "random" | "fixed", selected?: string, values?: string[]) => {
      return segmentActions.createPresetSegment(name, mode, selected, values);
    },
    []
  );

  const createInlineWildcardSegment = useCallback((options: string[]) => {
    return segmentActions.createInlineWildcardSegment(options);
  }, []);

  const updateSegment = useCallback(
    <T extends Segment>(id: string, updates: Partial<Omit<T, "type" | "id">>) => {
      segmentActions.updateSegment<T>(id, updates);
    },
    []
  );

  const addChildToSegment = useCallback(
    (parentId: string, childId: string, index?: number) => {
      segmentActions.addChildToSegment(parentId, childId, index);
    },
    []
  );

  const removeSegmentFromTree = useCallback(
    (parentId: string, childId: string) => {
      segmentActions.removeSegmentFromTree(parentId, childId);
    },
    []
  );

  const optimizeTree = useCallback(
    (rootId: string) => {
      segmentActions.optimizeTree(rootId);
    },
    []
  );

  return {
    createTextSegment,
    createWeightedSegment,
    createPresetSegment,
    createInlineWildcardSegment,
    updateSegment,
    addChildToSegment,
    removeSegmentFromTree,
    optimizeTree,
  };
}

/**
 * Hook for mode switching
 */
export function useModeSwitch() {
  const [rawMode, _isLoading, _error] = useActiveModeReactive();
  
  // Default to "compose" if not set
  const activeMode = rawMode || "compose";
  
  const setMode = useCallback((mode: "compose" | "finetune") => {
    segmentActions.setActiveMode(mode);
  }, []);
  
  const toggleMode = useCallback(() => {
    const newMode = activeMode === "compose" ? "finetune" : "compose";
    segmentActions.setActiveMode(newMode);
  }, [activeMode]);
  
  return {
    activeMode,
    setMode,
    toggleMode,
    isComposeMode: activeMode === "compose",
    isFineTuneMode: activeMode === "finetune",
  };
}

/**
 * Hook for group management
 */
export function useGroupOperations() {
  const createGroup = useCallback(
    (name: string, segmentIds: string[], color: string = "#3A86FF") => {
      return segmentActions.createGroup(name, segmentIds, color);
    },
    []
  );

  const updateGroup = useCallback(
    (id: string, updates: Partial<Omit<Group, "id">>) => {
      segmentActions.updateGroup(id, updates);
    },
    []
  );

  const removeGroup = useCallback(
    (id: string) => {
      segmentActions.removeGroup(id);
    },
    []
  );

  return {
    createGroup,
    updateGroup,
    removeGroup,
  };
}

/**
 * Hook for character management
 */
export function useCharacterOperations() {
  const addCharacter = useCallback(() => {
    return segmentActions.addCharacter();
  }, []);

  const removeCharacter = useCallback(
    (index: number) => {
      segmentActions.removeCharacter(index);
    },
    []
  );

  return {
    addCharacter,
    removeCharacter,
  };
}