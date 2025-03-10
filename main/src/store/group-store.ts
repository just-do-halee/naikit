/**
 * 그룹 관리 스토어
 * 
 * 세그먼트 그룹 관리 및 그룹 가중치 조절
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { Group, GroupWeightMode } from '@/modules/segment-model/types';
import { useSegmentStore } from './segment-store';
import { calculateDisplayValue } from '@/modules/segment-model/segment-factory';
import { assertExists } from '@/utils/type-safety';

/**
 * 그룹 상태 인터페이스
 */
interface GroupState {
  /** 그룹 맵 (ID => 그룹) */
  groups: Record<string, Group>;
}

/**
 * 그룹 액션 인터페이스
 */
interface GroupActions {
  /**
   * 그룹 추가
   */
  addGroup: (group: Partial<Group>) => string;
  
  /**
   * 그룹 업데이트
   */
  updateGroup: (id: string, updates: Partial<Omit<Group, 'id'>>) => void;
  
  /**
   * 그룹 제거
   */
  removeGroup: (id: string) => void;
  
  /**
   * 그룹에 세그먼트 추가
   */
  addSegmentsToGroup: (groupId: string, segmentIds: string[]) => void;
  
  /**
   * 그룹에서 세그먼트 제거
   */
  removeSegmentsFromGroup: (groupId: string, segmentIds: string[]) => void;
}

/**
 * 그룹 생성 인터페이스
 */
interface GroupCreation {
  /**
   * 그룹 생성
   */
  createGroup: (name: string, segmentIds: string[], color?: string) => string;
}

/**
 * 그룹 가중치 인터페이스
 */
interface GroupWeightActions {
  /**
   * 그룹 가중치 조절
   */
  adjustGroupWeights: (
    groupId: string, 
    targetWeight: number, 
    mode?: GroupWeightMode
  ) => boolean;
  
  /**
   * 그룹 이름 변경
   */
  renameGroup: (groupId: string, newName: string) => void;
  
  /**
   * 그룹 색상 변경
   */
  setGroupColor: (groupId: string, color: string) => void;
  
  /**
   * 그룹 가중치 모드 변경
   */
  setGroupWeightMode: (groupId: string, mode: GroupWeightMode) => void;
}

/**
 * 그룹 쿼리 인터페이스
 */
interface GroupQueries {
  /**
   * 지정된 세그먼트를 포함하는 그룹 찾기
   */
  findGroupsBySegmentId: (segmentId: string) => Group[];
}

/**
 * 기본 그룹 색상 배열
 */
const DEFAULT_GROUP_COLORS = [
  '#E8C547', // 기본 노란색
  '#5E6AD2', // 보라색
  '#2AC28E', // 초록색
  '#E55A5A', // 빨간색
  '#5E9ED9', // 파란색
  '#9C27B0', // 자주색
  '#FF9800', // 주황색
  '#607D8B'  // 회색
];

/**
 * 다음 색상 선택 (순환)
 */
function getNextGroupColor(existingGroups: Group[]): string {
  // 색상 사용 횟수 카운트
  const colorCounts = DEFAULT_GROUP_COLORS.reduce<Record<string, number>>(
    (acc, color) => {
      acc[color] = 0;
      return acc;
    }, 
    {}
  );
  
  // 기존 그룹 색상 카운트
  existingGroups.forEach(group => {
    if (colorCounts[group.color] !== undefined) {
      colorCounts[group.color]++;
    }
  });
  
  // 가장 적게 사용된 색상 찾기
  let minCount = Infinity;
  let minColor = DEFAULT_GROUP_COLORS[0];
  
  Object.entries(colorCounts).forEach(([color, count]) => {
    if (count < minCount) {
      minCount = count;
      minColor = color;
    }
  });
  
  return minColor;
}

/**
 * 그룹 상태 저장소
 */
export const useGroupStore = create<
  GroupState & GroupActions & GroupCreation & GroupWeightActions & GroupQueries
>()(
  immer((set, get) => ({
    // 초기 상태
    groups: {},
    
    // 그룹 추가
    addGroup: (groupData) => {
      const id = (groupData as { id?: string }).id || nanoid();
      
      const defaultColor = getNextGroupColor(Object.values(get().groups));
      
      const group: Group = {
        id,
        name: groupData.name || '그룹',
        segmentIds: groupData.segmentIds || [],
        weightMode: groupData.weightMode || 'relative',
        color: groupData.color || defaultColor
      };
      
      set(state => {
        state.groups[id] = group;
      });
      
      return id;
    },
    
    // 그룹 업데이트
    updateGroup: (id, updates) => {
      set(state => {
        const group = state.groups[id];
        if (group) {
          state.groups[id] = {
            ...group,
            ...updates
          };
        }
      });
    },
    
    // 그룹 제거
    removeGroup: (id) => {
      set(state => {
        delete state.groups[id];
      });
    },
    
    // 그룹에 세그먼트 추가
    addSegmentsToGroup: (groupId, segmentIds) => {
      set(state => {
        const group = state.groups[groupId];
        if (group) {
          // 중복 제거하여 추가
          const newSegmentIds = Array.from(new Set([...group.segmentIds, ...segmentIds]));
          state.groups[groupId].segmentIds = newSegmentIds;
        }
      });
    },
    
    // 그룹에서 세그먼트 제거
    removeSegmentsFromGroup: (groupId, segmentIds) => {
      set(state => {
        const group = state.groups[groupId];
        if (group) {
          state.groups[groupId].segmentIds = group.segmentIds.filter(
            id => !segmentIds.includes(id)
          );
        }
      });
    },
    
    // 그룹 생성
    createGroup: (name, segmentIds, color) => {
      assertExists(name, 'Group name is required');
      
      if (!segmentIds.length) {
        throw new Error('At least one segment ID must be provided');
      }
      
      const defaultColor = getNextGroupColor(Object.values(get().groups));
      
      const group: Group = {
        id: nanoid(),
        name,
        segmentIds,
        weightMode: 'relative',
        color: color || defaultColor
      };
      
      set(state => {
        state.groups[group.id] = group;
      });
      
      return group.id;
    },
    
    // 그룹 가중치 조절
    adjustGroupWeights: (groupId, targetWeight, mode) => {
      const group = get().groups[groupId];
      if (!group) return false;
      
      const segmentStore = useSegmentStore.getState();
      const weightedSegments = group.segmentIds
        .map(id => segmentStore.getSegmentById(id))
        .filter(seg => seg && seg.type === 'weighted');
      
      if (weightedSegments.length === 0) return false;
      
      // 가중치 모드
      const weightMode = mode || group.weightMode;
      
      if (weightMode === 'absolute') {
        // 절대 모드: 모든 세그먼트를 동일한 가중치로 설정
        // 가장 가까운 양자화된 가중치 찾기
        let bracketType: 'increase' | 'decrease';
        let bracketLevel: number;
        
        if (targetWeight > 1.0) {
          bracketType = 'increase';
          bracketLevel = Math.round(Math.log(targetWeight) / Math.log(1.05));
        } else {
          bracketType = 'decrease';
          bracketLevel = Math.round(Math.log(1/targetWeight) / Math.log(1.05));
        }
        
        // 제한: -78 ~ 78
        bracketLevel = Math.max(-78, Math.min(78, Math.abs(bracketLevel)));
        
        // 모든 세그먼트 업데이트
        weightedSegments.forEach(segment => {
          if (segment) {
            segmentStore.updateSegment(segment.id, {
              bracketType,
              bracketLevel
            });
          }
        });
      } else {
        // 상대 모드: 기존 비율 유지하며 스케일링
        weightedSegments.forEach(segment => {
          if (segment && 'displayValue' in segment) {
            const newWeight = segment.displayValue * targetWeight;
            
            // 가장 가까운 양자화된 가중치 계산
            let bracketType: 'increase' | 'decrease';
            let bracketLevel: number;
            
            if (newWeight > 1.0) {
              bracketType = 'increase';
              bracketLevel = Math.round(Math.log(newWeight) / Math.log(1.05));
            } else {
              bracketType = 'decrease';
              bracketLevel = Math.round(Math.log(1/newWeight) / Math.log(1.05));
            }
            
            // 제한: -78 ~ 78
            bracketLevel = Math.max(-78, Math.min(78, Math.abs(bracketLevel)));
            
            // 세그먼트 업데이트
            segmentStore.updateSegment(segment.id, {
              bracketType,
              bracketLevel
            });
          }
        });
      }
      
      return true;
    },
    
    // 그룹 이름 변경
    renameGroup: (groupId, newName) => {
      assertExists(newName, 'New group name is required');
      
      set(state => {
        const group = state.groups[groupId];
        if (group) {
          state.groups[groupId].name = newName;
        }
      });
    },
    
    // 그룹 색상 변경
    setGroupColor: (groupId, color) => {
      assertExists(color, 'Group color is required');
      
      set(state => {
        const group = state.groups[groupId];
        if (group) {
          state.groups[groupId].color = color;
        }
      });
    },
    
    // 그룹 가중치 모드 변경
    setGroupWeightMode: (groupId, mode) => {
      set(state => {
        const group = state.groups[groupId];
        if (group) {
          state.groups[groupId].weightMode = mode;
        }
      });
    },
    
    // 지정된 세그먼트를 포함하는 그룹 찾기
    findGroupsBySegmentId: (segmentId) => {
      return Object.values(get().groups).filter(
        group => group.segmentIds.includes(segmentId)
      );
    }
  }))
);
