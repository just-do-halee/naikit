/**
 * React Bindings for Segment State
 * 
 * This file provides React-specific hooks for the segment state management
 */

import { useCallback } from "react";
import {
  segmentState,
  segmentActions,
  useSegmentState,
  useSegments,
  useRootSegments,
  useActiveMode,
  useSelectedIds,
  useSelectedSegments
} from "./segment-state";

// Re-export the hooks for use in components
export {
  useSegmentState,
  useSegments,
  useRootSegments,
  useActiveMode,
  useSelectedIds,
  useSelectedSegments
};

// Actions as hooks
export function useSegmentActions() {
  // Segment creation
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

  // Segment updates
  const updateSegment = useCallback(
    <T extends unknown>(id: string, updates: Partial<Omit<T, "type" | "id">>) => {
      segmentActions.updateSegment(id, updates);
    },
    []
  );

  // Update child segments (replace all children)
  const updateChildSegments = useCallback(
    (parentId: string, newChildren: any[]) => {
      const parent = segmentState.get().segments[parentId];
      if (!parent) return;

      segmentState.at("segments").at(parentId).update(segment => {
        if (!segment) return segment;
        return {
          ...segment,
          children: newChildren
        };
      });
    },
    []
  );

  // Segment tree operations
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

  // Mode switching
  const setActiveMode = useCallback((mode: "compose" | "finetune") => {
    segmentActions.setActiveMode(mode);
  }, []);

  // Selection management
  const selectSegment = useCallback((id: string, multiSelect: boolean = false) => {
    segmentActions.selectSegment(id, multiSelect);
  }, []);

  const deselectSegment = useCallback((id: string) => {
    segmentActions.deselectSegment(id);
  }, []);

  const clearSelection = useCallback(() => {
    segmentActions.clearSelection();
  }, []);

  // Group management
  const createGroup = useCallback(
    (name: string, segmentIds: string[], color: string = "#3A86FF") => {
      return segmentActions.createGroup(name, segmentIds, color);
    },
    []
  );

  const updateGroup = useCallback(
    (id: string, updates: any) => {
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

  // Character management
  const addCharacter = useCallback(() => {
    return segmentActions.addCharacter();
  }, []);

  const removeCharacter = useCallback(
    (index: number) => {
      segmentActions.removeCharacter(index);
    },
    []
  );

  // Tree optimization
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
    updateChildSegments,
    addChildToSegment,
    removeSegmentFromTree,
    setActiveMode,
    selectSegment,
    deselectSegment,
    clearSelection,
    createGroup,
    updateGroup,
    removeGroup,
    addCharacter,
    removeCharacter,
    optimizeTree
  };
}

// Specialized hooks for common operations
export function useSegmentSelection() {
  const selectedIds = useSelectedIds();
  
  const { selectSegment, deselectSegment, clearSelection } = useSegmentActions();
  
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

export function useAppMode() {
  return useActiveMode();
}

// Type definition for presets
export interface Preset {
  id: string;
  name: string;
  category: string;
  type: 'wildcard' | 'keyword';
  values?: string[];
  keywordValue?: string;
  color?: string;
}

// Type definition for group weight mode
export type GroupWeightMode = 'relative' | 'absolute';

// Type definition for groups
export interface Group {
  id: string;
  name: string;
  segmentIds: string[];
  weightMode: GroupWeightMode;
  color: string;
}

// Mock preset data for development - in a real app this would be from state
const mockPresets: Preset[] = [
  { id: 'p1', name: 'Character', category: 'CHARACTER', type: 'wildcard' },
  { id: 'p2', name: 'Scene', category: 'SCENE', type: 'wildcard' },
  { id: 'p3', name: 'Style', category: 'STYLE', type: 'wildcard' },
  { id: 'p4', name: 'Background', category: 'SCENE', type: 'wildcard' },
  { id: 'p5', name: 'Lighting', category: 'STYLE', type: 'wildcard' },
  { id: 'p6', name: 'Character_pose', category: 'CHARACTER', type: 'keyword', keywordValue: 'standing' },
];

// Hook to get presets
export function usePresets(): Preset[] {
  // In a real app, this would fetch from state
  return mockPresets;
}

// Hook for preset management operations
export function usePresetOperations() {
  // In a real implementation, these would update the state
  const addPreset = useCallback((preset: Omit<Preset, 'id'>) => {
    const newId = `p${Date.now()}`;
    console.log('Adding preset:', { id: newId, ...preset });
    // In a real implementation, we would update state here
    // For now, we'll just log it
  }, []);

  const updatePreset = useCallback((id: string, updates: Partial<Omit<Preset, 'id'>>) => {
    console.log('Updating preset:', id, updates);
    // In a real implementation, we would update state here
  }, []);

  const deletePreset = useCallback((id: string) => {
    console.log('Deleting preset:', id);
    // In a real implementation, we would update state here
  }, []);

  return {
    addPreset,
    updatePreset,
    deletePreset
  };
}

// Mock groups for development
const mockGroups: Group[] = [
  {
    id: 'g1',
    name: 'Main Character',
    segmentIds: ['segment1', 'segment2', 'segment3'],
    weightMode: 'relative',
    color: '#3A86FF'
  },
  {
    id: 'g2',
    name: 'Background Elements',
    segmentIds: ['segment4', 'segment5'],
    weightMode: 'absolute',
    color: '#FF006E'
  },
  {
    id: 'g3',
    name: 'Lighting and Mood',
    segmentIds: ['segment6'],
    weightMode: 'relative',
    color: '#FFBE0B'
  }
];

// Hook to get groups - enhanced version with mock data for development
export function useGroupsExtended(): Group[] {
  // In a real implementation, this would fetch from state/segmentState.at("groups").get()
  // For now we're using mock data
  return mockGroups;
}

// Hook for group management operations
export function useGroupOperations() {
  // In a real implementation, these would update the state
  const createGroup = useCallback((name: string, segmentIds: string[], color: string = '#3A86FF') => {
    const newId = `g${Date.now()}`;
    console.log('Creating group:', { 
      id: newId, 
      name, 
      segmentIds, 
      weightMode: 'relative', 
      color 
    });
    // In a real implementation, we would update state here
  }, []);

  const updateGroup = useCallback((id: string, updates: Partial<Omit<Group, 'id'>>) => {
    console.log('Updating group:', id, updates);
    // In a real implementation, we would update state here
  }, []);

  const deleteGroup = useCallback((id: string) => {
    console.log('Deleting group:', id);
    // In a real implementation, we would update state here
  }, []);

  const addSegmentsToGroup = useCallback((groupId: string, segmentIds: string[]) => {
    console.log('Adding segments to group:', groupId, segmentIds);
    // In a real implementation, we would update state here
  }, []);

  const removeSegmentsFromGroup = useCallback((groupId: string, segmentIds: string[]) => {
    console.log('Removing segments from group:', groupId, segmentIds);
    // In a real implementation, we would update state here
  }, []);

  return {
    createGroup,
    updateGroup,
    deleteGroup,
    addSegmentsToGroup,
    removeSegmentsFromGroup
  };
}