import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';

export interface Group {
  id: string;
  name: string;
  segmentIds: string[];
  weightMode: 'relative' | 'absolute';
  color: string;
}

interface GroupState {
  groups: Record<string, Group>;
}

interface GroupActions {
  addGroup: (group: Partial<Group>) => string;
  updateGroup: (id: string, updates: Partial<Omit<Group, 'id'>>) => void;
  removeGroup: (id: string) => void;
  createGroup: (name: string, segmentIds: string[], color?: string) => string;
  findGroupsBySegmentId: (segmentId: string) => Group[];
  addSegmentToGroup: (groupId: string, segmentId: string) => void;
  removeSegmentFromGroup: (groupId: string, segmentId: string) => void;
}

const DEFAULT_GROUP_COLORS = [
  '#E8C547', '#5E6AD2', '#2AC28E', '#E55A5A', 
  '#5E9ED9', '#9C27B0', '#FF9800', '#607D8B'
];

export const useGroupStore = create<GroupState & GroupActions>()(
  immer((set, get) => ({
    groups: {},
    
    addGroup: (groupData) => {
      const id = groupData.id || nanoid();
      const colorIndex = Object.keys(get().groups).length % DEFAULT_GROUP_COLORS.length;
      const color = groupData.color || DEFAULT_GROUP_COLORS[colorIndex];
      
      const group: Group = {
        id,
        name: groupData.name || '그룹',
        segmentIds: groupData.segmentIds || [],
        weightMode: groupData.weightMode || 'relative',
        color
      };
      
      set(state => {
        state.groups[id] = group;
      });
      
      return id;
    },
    
    updateGroup: (id, updates) => {
      set(state => {
        if (state.groups[id]) {
          state.groups[id] = {
            ...state.groups[id],
            ...updates
          };
        }
      });
    },
    
    removeGroup: (id) => {
      set(state => {
        delete state.groups[id];
      });
    },
    
    createGroup: (name, segmentIds, color) => {
      const colorIndex = Object.keys(get().groups).length % DEFAULT_GROUP_COLORS.length;
      const selectedColor = color || DEFAULT_GROUP_COLORS[colorIndex];
      
      return get().addGroup({
        name,
        segmentIds,
        color: selectedColor
      });
    },
    
    findGroupsBySegmentId: (segmentId) => {
      return Object.values(get().groups).filter(
        group => group.segmentIds.includes(segmentId)
      );
    },

    addSegmentToGroup: (groupId, segmentId) => {
      set(state => {
        if (state.groups[groupId] && !state.groups[groupId].segmentIds.includes(segmentId)) {
          state.groups[groupId].segmentIds.push(segmentId);
        }
      });
    },

    removeSegmentFromGroup: (groupId, segmentId) => {
      set(state => {
        if (state.groups[groupId]) {
          state.groups[groupId].segmentIds = state.groups[groupId].segmentIds.filter(
            id => id !== segmentId
          );
        }
      });
    }
  }))
);