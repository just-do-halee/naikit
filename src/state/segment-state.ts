/**
 * Segment State Management with Axion
 * 
 * This file implements the state management for the segment model using Axion.
 * It replaces the originally planned Zustand implementation as per requirements.
 */

import axion from "axion-state";
import { nanoid } from "nanoid";
// Only import what we need
import {
  Segment,
  RootSegments,
  Group,
} from "@/core/segment-model/types";
import {
  createTextSegment,
  createWeightedSegment,
  createPresetSegment,
  createInlineWildcardSegment,
} from "@/core/segment-model/segment-factory";
import {
  updateSegment,
  insertSegment,
  removeSegment,
  optimizeSegmentTree,
} from "@/core/segment-model/segment-operations";

// Define Segment Store Types
interface SegmentState {
  segments: Record<string, Segment>;
  rootSegments: RootSegments;
  groups: Record<string, Group>;
  activeMode: "compose" | "finetune";
  selectedIds: string[];
}

// Create initial state
const initialRootSegments: RootSegments = {
  main: {
    positive: nanoid(8),
    negative: nanoid(8),
  },
  characters: {}
};

// Create initial segments with empty root segments
const initialMainPositive = createTextSegment("");
const initialMainNegative = createTextSegment("");

const initialSegments = {
  [initialRootSegments.main.positive]: initialMainPositive,
  [initialRootSegments.main.negative]: initialMainNegative,
};

// Create Axion atom for segment state
export const segmentState = axion<SegmentState>({
  segments: initialSegments,
  rootSegments: initialRootSegments,
  groups: {},
  activeMode: "compose",
  selectedIds: [],
});

// Actions
export const segmentActions = {
  // Segment creation
  createTextSegment: (content: string) => {
    const newSegment = createTextSegment(content);
    segmentState.at("segments").update(segments => {
      return Object.assign({}, segments as object, {
        [newSegment.id]: newSegment
      });
    });
    return newSegment.id;
  },

  createWeightedSegment: (childIds: string[], bracketType: "increase" | "decrease", level: number) => {
    const state = segmentState.get();
    const children = childIds.map(id => state.segments[id] as Segment).filter(Boolean);
    const newSegment = createWeightedSegment(children, bracketType, level);
    
    // Add the new segment to the state
    segmentState.at("segments").update(segments => {
      return Object.assign({}, segments as object, {
        [newSegment.id]: newSegment
      });
    });

    return newSegment.id;
  },

  createPresetSegment: (name: string, mode: "random" | "fixed", selected?: string, values?: string[]) => {
    const newSegment = createPresetSegment(name, mode, selected, values);
    segmentState.at("segments").update(segments => {
      return Object.assign({}, segments as object, {
        [newSegment.id]: newSegment
      });
    });
    return newSegment.id;
  },

  createInlineWildcardSegment: (options: string[]) => {
    const newSegment = createInlineWildcardSegment(options);
    segmentState.at("segments").update(segments => {
      return Object.assign({}, segments as object, {
        [newSegment.id]: newSegment
      });
    });
    return newSegment.id;
  },

  // Segment updates
  updateSegment: <T extends Segment>(id: string, updates: Partial<Omit<T, "type" | "id">>) => {
    const state = segmentState.get();
    const segment = state.segments[id] as Segment;
    if (!segment) return;

    const updatedSegment = updateSegment(segment, updates);
    segmentState.at("segments").at(id).set(updatedSegment);
  },

  // Segment tree operations
  addChildToSegment: (parentId: string, childId: string, index?: number) => {
    const state = segmentState.get();
    const parent = state.segments[parentId] as Segment;
    const child = state.segments[childId] as Segment;
    if (!parent || !child) return;

    const updatedParent = insertSegment(parent, child, index);
    segmentState.at("segments").at(parentId).set(updatedParent);
  },

  removeSegmentFromTree: (parentId: string, childId: string) => {
    const state = segmentState.get();
    const parent = state.segments[parentId] as Segment;
    if (!parent) return;

    const [updatedParent, removed] = removeSegment(parent, childId);
    if (removed) {
      segmentState.at("segments").at(parentId).set(updatedParent);
    }
  },

  // Mode switching
  setActiveMode: (mode: "compose" | "finetune") => {
    segmentState.at("activeMode").set(mode);
  },

  // Selection management
  selectSegment: (id: string, multiSelect: boolean = false) => {
    if (multiSelect) {
      segmentState.at("selectedIds").update(ids => {
        if (Array.isArray(ids)) {
          return [...ids, id];
        }
        return [id];
      });
    } else {
      segmentState.at("selectedIds").set([id]);
    }
  },

  deselectSegment: (id: string) => {
    segmentState.at("selectedIds").update(ids => {
      if (Array.isArray(ids)) {
        return ids.filter(i => i !== id);
      }
      return [];
    });
  },

  clearSelection: () => {
    segmentState.at("selectedIds").set([]);
  },

  // Group management
  createGroup: (name: string, segmentIds: string[], color: string = "#3A86FF") => {
    const groupId = `group_${nanoid(8)}`;
    const newGroup: Group = {
      id: groupId,
      name,
      segmentIds,
      weightMode: "relative",
      color,
    };

    segmentState.at("groups").update(groups => {
      return Object.assign({}, groups as object, {
        [groupId]: newGroup
      });
    });

    return groupId;
  },

  updateGroup: (id: string, updates: Partial<Omit<Group, "id">>) => {
    segmentState.at("groups").at(id).update(group => {
      return Object.assign({}, group as object, updates);
    });
  },

  removeGroup: (id: string) => {
    segmentState.at("groups").update(groups => {
      if (!groups) return {};
      const result: Record<string, unknown> = Object.assign({} as Record<string, unknown>, groups as object);
      if (id in result) {
        delete result[id];
      }
      return result;
    });
  },

  // Character management
  addCharacter: () => {
    const positiveId = nanoid(8);
    const negativeId = nanoid(8);
    
    // Create empty segments
    const positiveSegment = createTextSegment("");
    const negativeSegment = createTextSegment("");
    
    // Get the next available index
    const state = segmentState.get();
    const characterIndices = Object.keys(state.rootSegments.characters).map(Number);
    const nextIndex = characterIndices.length > 0 ? Math.max(...characterIndices) + 1 : 0;
    
    // Update segments
    segmentState.at("segments").update(segments => {
      return Object.assign({}, segments as object, {
        [positiveId]: positiveSegment,
        [negativeId]: negativeSegment
      });
    });
    
    // Update root segments
    segmentState.at("rootSegments").at("characters").update(characters => {
      return Object.assign({}, characters as object, {
        [nextIndex]: {
          positive: positiveId,
          negative: negativeId
        }
      });
    });
    
    return nextIndex;
  },
  
  removeCharacter: (index: number) => {
    segmentState.at("rootSegments").at("characters").update(characters => {
      if (!characters) return {};
      const result: Record<string, unknown> = Object.assign({} as Record<string, unknown>, characters as object);
      if (index.toString() in result) {
        delete result[index.toString()];
      }
      return result;
    });
  },

  // Tree optimization
  optimizeTree: (rootId: string) => {
    const state = segmentState.get();
    const rootSegment = state.segments[rootId] as Segment;
    if (!rootSegment) return;

    const optimizedSegment = optimizeSegmentTree(rootSegment);
    segmentState.at("segments").at(rootId).set(optimizedSegment);
  }
};

// Derived state for selected segments
export const selectedSegments = axion.derive(() => {
  const state = segmentState.get();
  return state.selectedIds.map(id => state.segments[id] as Segment).filter(Boolean);
});

// Export hooks for React components
export const useSegmentState = () => {
  return segmentState.get();
};

export const useSegments = () => {
  return segmentState.at("segments").get();
};

export const useRootSegments = () => {
  return segmentState.at("rootSegments").get();
};

export const useGroups = () => {
  return segmentState.at("groups").get();
};

export const useActiveMode = () => {
  return segmentState.at("activeMode").get();
};

export const useSelectedIds = () => {
  return segmentState.at("selectedIds").get();
};

export const useSelectedSegments = () => {
  return selectedSegments.get();
};