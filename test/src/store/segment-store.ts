/**
 * 테스트용 세그먼트 스토어
 * 기존 main 코드의 스토어를 가져와서 사용
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { nanoid } from 'nanoid';

// Immer에서 Set과 Map을 사용하기 위한 플러그인 활성화
enableMapSet();
import { 
  Segment,
  RootSegments, 
  BracketType 
} from '@main/src/modules/segment-model/types';
import {
  createTextSegment,
  createWeightedSegment,
  createPresetSegment,
  createInlineWildcardSegment,
} from '@main/src/modules/segment-model/segment-factory';
import {
  updateSegment as updateSegmentOp,
  findSegmentById,
} from '@main/src/modules/segment-model/segment-operations';

// 다른 스토어들과 통합
import { useGroupStore } from './group-store';
import { useModeStore } from './mode-store';

interface SegmentState {
  segments: Record<string, Segment>;
  rootSegments: RootSegments;
  changedSegmentIds: Set<string>;
  lastCompileVersion: number;
}

interface SegmentActions {
  addSegment: (segment: Segment, parentId?: string, index?: number) => string;
  updateSegment: (id: string, updates: Partial<Segment>) => void;
  removeSegment: (id: string) => void;
  setRootSegment: (
    type: 'main' | 'character',
    promptType: 'positive' | 'negative',
    id: string,
    characterIndex?: number
  ) => void;
  resetChangedSegmentIds: () => void;
}

interface SegmentQueries {
  getSegmentById: (id: string) => Segment | undefined;
  getRootSegment: (
    type: 'main' | 'character',
    promptType: 'positive' | 'negative',
    characterIndex?: number
  ) => Segment | undefined;
}

interface SegmentAdvancedActions {
  createAndAddTextSegment: (
    content: string,
    parentId?: string,
    index?: number
  ) => string;
  createAndAddWeightedSegment: (
    childSegmentIds: string[],
    bracketType: BracketType,
    bracketLevel: number,
    parentId?: string,
    index?: number
  ) => string;
  createAndAddPresetSegment: (
    name: string,
    mode: 'random' | 'fixed',
    selectedValue?: string,
    values?: string[],
    parentId?: string,
    index?: number
  ) => string;
  createAndAddInlineWildcardSegment: (
    options: string[],
    parentId?: string,
    index?: number
  ) => string;
  addCharacter: () => number;
  removeCharacter: (characterIndex: number) => void;
  reorderCharacters: (fromIndex: number, toIndex: number) => void;
}

// 유틸리티 함수
function ensureChangedIdsSet(state: SegmentState): Set<string> {
  if (!state.changedSegmentIds) {
    state.changedSegmentIds = new Set<string>();
  }
  return state.changedSegmentIds;
}

function ensureCharactersObject(
  state: SegmentState
): Record<number, { positive: string; negative: string }> {
  if (!state.rootSegments.characters) {
    state.rootSegments.characters = {};
  }
  return state.rootSegments.characters;
}

function isSegmentDefined(
  segment: Segment | undefined | null
): segment is Segment {
  return segment !== undefined && segment !== null;
}

function handleRootSegmentRemoval(
  state: SegmentState,
  removedId: string,
  changedIds: Set<string>
): void {
  // 메인 프롬프트 루트 처리
  Object.entries(state.rootSegments.main).forEach(([promptType, rootId]) => {
    if (rootId === removedId) {
      const newRoot = createTextSegment('');
      state.segments[newRoot.id] = newRoot;
      state.rootSegments.main[promptType as 'positive' | 'negative'] = newRoot.id;
      changedIds.add(newRoot.id);
    }
  });

  // 캐릭터 루트 처리
  if (state.rootSegments.characters) {
    for (const [characterIndex, character] of Object.entries(state.rootSegments.characters)) {
      if (character) {
        for (const [promptType, rootId] of Object.entries(character)) {
          if (rootId === removedId) {
            const newRoot = createTextSegment('');
            state.segments[newRoot.id] = newRoot;
            if (state.rootSegments.characters) {
              state.rootSegments.characters[parseInt(characterIndex)][
                promptType as 'positive' | 'negative'
              ] = newRoot.id;
              changedIds.add(newRoot.id);
            }
          }
        }
      }
    }
  }
}

// 테스트용 초기 데이터 설정
const mainPositiveRoot = createTextSegment('');
const mainNegativeRoot = createTextSegment('');

// 세그먼트 스토어 타입 정의
type SegmentStoreState = SegmentState &
  SegmentActions &
  SegmentQueries &
  SegmentAdvancedActions;

export const useSegmentStore = create<SegmentStoreState>()(
  immer((set, get) => ({
    // 초기 상태
    segments: {
      [mainPositiveRoot.id]: mainPositiveRoot,
      [mainNegativeRoot.id]: mainNegativeRoot,
    },
    rootSegments: {
      main: {
        positive: mainPositiveRoot.id,
        negative: mainNegativeRoot.id,
      },
      characters: {},
    },
    changedSegmentIds: new Set<string>(),
    lastCompileVersion: 0,

    // 액션
    addSegment: (segment: Segment, parentId?: string, index?: number): string => {
      const segmentId = segment.id || nanoid();
      const segmentWithId = { ...segment, id: segmentId };

      set((state) => {
        // 세그먼트 맵에 추가
        state.segments[segmentId] = segmentWithId;

        // 변경 세그먼트 ID 추적
        const changedIds = ensureChangedIdsSet(state);
        changedIds.add(segmentId);

        // 부모가 지정된 경우 부모에 추가
        if (parentId && state.segments[parentId]) {
          const parent = state.segments[parentId];

          // 불변 방식으로 children 배열 업데이트
          const updatedParent = {
            ...parent,
            children: parent.children ? [...parent.children] : [],
          };

          if (
            index !== undefined &&
            index >= 0 &&
            updatedParent.children &&
            index <= updatedParent.children.length
          ) {
            // 자식 배열에 세그먼트 객체 추가 (배열 인덱스 위치에)
            updatedParent.children.splice(index, 0, segmentWithId);
          } else {
            // 자식 배열 초기화 및 세그먼트 객체 추가 (배열 끝에)
            updatedParent.children = updatedParent.children || [];
            updatedParent.children.push(segmentWithId);
          }

          // 부모 업데이트
          state.segments[parentId] = updatedParent;
          changedIds.add(parentId);
        }
        
        // 상태 변경을 확실하게 트리거하기 위해 lastCompileVersion 증가
        state.lastCompileVersion += 1;
      });

      return segmentId;
    },

    updateSegment: (id: string, updates: Partial<Segment>): void => {
      set((state) => {
        const segment = state.segments[id];
        if (segment) {
          // 불변 업데이트 적용
          state.segments[id] = updateSegmentOp(segment, updates);

          // 변경 세그먼트 ID 추적
          const changedIds = ensureChangedIdsSet(state);
          changedIds.add(id);
          
          // 상태 변경을 확실하게 트리거하기 위해 lastCompileVersion 증가
          state.lastCompileVersion += 1;
        }
      });
    },

    removeSegment: (id: string): void => {
      set((state) => {
        // 변경 세그먼트 ID 추적
        const changedIds = ensureChangedIdsSet(state);

        // 영향 받는 부모 찾기
        Object.entries(state.segments).forEach(([parentId, segment]) => {
          if (segment.children) {
            const index = segment.children.findIndex(child => child.id === id);
            if (index !== -1) {
              // 불변 방식으로 자식 제거
              const newChildren = [...segment.children];
              newChildren.splice(index, 1);
              state.segments[parentId] = {
                ...segment,
                children: newChildren,
              };
              changedIds.add(parentId);
            }
          }
        });

        // 세그먼트 맵에서 제거
        if (state.segments[id]) {
          delete state.segments[id];
          changedIds.add(id);
        }

        // 루트 세그먼트인 경우 처리
        handleRootSegmentRemoval(state, id, changedIds);
        
        // 상태 변경을 확실하게 트리거하기 위해 lastCompileVersion 증가
        state.lastCompileVersion += 1;
      });
    },

    setRootSegment: (
      type: 'main' | 'character',
      promptType: 'positive' | 'negative',
      id: string,
      characterIndex?: number
    ): void => {
      set((state) => {
        // 변경 세그먼트 ID 추적
        const changedIds = ensureChangedIdsSet(state);

        if (type === 'main') {
          // 기존 루트가 있으면 변경됨 표시
          const oldRootId = state.rootSegments.main[promptType];
          if (oldRootId) {
            changedIds.add(oldRootId);
          }

          // 새 루트 설정
          state.rootSegments.main[promptType] = id;
          changedIds.add(id);
        } else if (type === 'character' && characterIndex !== undefined) {
          // characters 객체 준비
          const characters = ensureCharactersObject(state);

          // 캐릭터가 없으면 생성
          if (!characters[characterIndex]) {
            characters[characterIndex] = {
              positive: '',
              negative: '',
            };
          }

          // 기존 루트가 있으면 변경됨 표시
          const oldRootId = characters[characterIndex][promptType];
          if (oldRootId) {
            changedIds.add(oldRootId);
          }

          // 새 루트 설정
          characters[characterIndex][promptType] = id;
          changedIds.add(id);
        }
      });
    },

    // 쿼리
    getSegmentById: (id: string): Segment | undefined => {
      return get().segments[id];
    },

    getRootSegment: (
      type: 'main' | 'character',
      promptType: 'positive' | 'negative',
      characterIndex?: number
    ): Segment | undefined => {
      const state = get();

      if (type === 'main') {
        const rootId = state.rootSegments.main[promptType];
        return rootId ? state.segments[rootId] : undefined;
      } else if (type === 'character' && characterIndex !== undefined) {
        const characters = state.rootSegments.characters;
        const character = characters ? characters[characterIndex] : undefined;
        if (character) {
          const rootId = character[promptType];
          return rootId ? state.segments[rootId] : undefined;
        }
      }

      return undefined;
    },

    // 고급 액션
    createAndAddTextSegment: (
      content: string,
      parentId?: string,
      index?: number
    ): string => {
      const segment = createTextSegment(content);
      return get().addSegment(segment, parentId, index);
    },

    createAndAddWeightedSegment: (
      childSegmentIds: string[],
      bracketType: BracketType,
      bracketLevel: number,
      parentId?: string,
      index?: number
    ): string => {
      const state = get();

      // 존재하는 세그먼트만 필터링
      const childSegments = childSegmentIds
        .map((id) => state.segments[id])
        .filter(isSegmentDefined);

      // 새 세그먼트 생성
      const segment = createWeightedSegment(
        childSegments,
        bracketType,
        bracketLevel
      );

      // 세그먼트 추가
      const segmentId = get().addSegment(segment, parentId, index);

      // 이제 각 자식 세그먼트를 원래 부모에서 제거 (이동)
      set((state) => {
        const changedIds = ensureChangedIdsSet(state);

        childSegmentIds.forEach((id) => {
          // 모든 부모에서 해당 자식 검색 및 제거
          Object.entries(state.segments).forEach(
            ([potentialParentId, parentSegment]) => {
              if (parentSegment.children && potentialParentId !== segmentId) {
                const childIndex = parentSegment.children.findIndex(child => child.id === id);

                if (childIndex !== -1) {
                  // 불변 방식으로 자식 제거
                  const newChildren = [...parentSegment.children];
                  newChildren.splice(childIndex, 1);
                  state.segments[potentialParentId] = {
                    ...parentSegment,
                    children: newChildren,
                  };
                  changedIds.add(potentialParentId);
                }
              }
            }
          );
        });
      });

      return segmentId;
    },

    createAndAddPresetSegment: (
      name: string,
      mode: 'random' | 'fixed',
      selectedValue?: string,
      values?: string[],
      parentId?: string,
      index?: number
    ): string => {
      const segment = createPresetSegment(name, mode, selectedValue, values);
      return get().addSegment(segment, parentId, index);
    },

    createAndAddInlineWildcardSegment: (
      options: string[],
      parentId?: string,
      index?: number
    ): string => {
      const segment = createInlineWildcardSegment(options);
      return get().addSegment(segment, parentId, index);
    },

    addCharacter: (): number => {
      // 새 캐릭터 인덱스 결정
      let newIndex = 0;
      
      // 현재 캐릭터 인덱스 확인
      const state = get();
      if (state.rootSegments.characters) {
        const existingIndices = Object.keys(state.rootSegments.characters).map(Number);
        newIndex = Math.max(-1, ...existingIndices) + 1;
      }
      
      // 새 캐릭터 루트 세그먼트 생성
      const positiveRoot = createTextSegment('');
      const negativeRoot = createTextSegment('');
      
      set(state => {
        // 세그먼트 맵에 추가
        state.segments[positiveRoot.id] = positiveRoot;
        state.segments[negativeRoot.id] = negativeRoot;
        
        // 변경 ID 추적
        const changedIds = ensureChangedIdsSet(state);
        changedIds.add(positiveRoot.id);
        changedIds.add(negativeRoot.id);
        
        // 캐릭터 객체 초기화
        const characters = ensureCharactersObject(state);
        
        // 캐릭터 정보 추가
        characters[newIndex] = {
          positive: positiveRoot.id,
          negative: negativeRoot.id
        };
      });
      
      return newIndex;
    },

    removeCharacter: (characterIndex: number): void => {
      set((state) => {
        // 변경 세그먼트 ID 추적
        const changedIds = ensureChangedIdsSet(state);

        // characters 객체가 없으면 생성 후 종료
        const characters = state.rootSegments.characters;
        if (!characters) {
          state.rootSegments.characters = {};
          return;
        }

        const character = characters[characterIndex];
        if (character) {
          // 루트 세그먼트 ID
          const positiveId = character.positive;
          const negativeId = character.negative;

          // 세그먼트 맵에서 제거
          if (positiveId && state.segments[positiveId]) {
            delete state.segments[positiveId];
            changedIds.add(positiveId);
          }

          if (negativeId && state.segments[negativeId]) {
            delete state.segments[negativeId];
            changedIds.add(negativeId);
          }

          // 캐릭터 제거
          delete characters[characterIndex];
        }
      });
    },

    reorderCharacters: (fromIndex: number, toIndex: number): void => {
      // characters 객체 확인
      const state = get();
      
      // 스토어에 characters 객체가 없으면 생성
      if (!state.rootSegments.characters) {
        set((state) => {
          state.rootSegments.characters = {};
        });
        return;
      }
      
      const characters = state.rootSegments.characters;

      // 범위 체크
      const characterIndices = Object.keys(characters).map(Number).sort();
      if (
        characterIndices.length <= 1 ||
        fromIndex < 0 ||
        fromIndex >= characterIndices.length ||
        toIndex < 0 ||
        toIndex >= characterIndices.length ||
        fromIndex === toIndex
      ) {
        return;
      }

      set((state) => {
        // 변경 세그먼트 ID 추적
        const changedIds = ensureChangedIdsSet(state);

        // characters 객체가 없으면 생성 (중복 검사이지만 안전을 위해)
        if (!state.rootSegments.characters) {
          state.rootSegments.characters = {};
          return;
        }

        // 실제 인덱스 구하기
        const indices = Object.keys(state.rootSegments.characters).map(Number).sort();
        const fromActualIndex = indices[fromIndex];
        const toActualIndex = indices[toIndex];

        if (fromActualIndex === undefined || toActualIndex === undefined) {
          return;
        }

        // 캐릭터 객체 직접 교환
        const temp = { ...state.rootSegments.characters[fromActualIndex] };
        state.rootSegments.characters[fromActualIndex] = { ...state.rootSegments.characters[toActualIndex] };
        state.rootSegments.characters[toActualIndex] = temp;

        // 변경된 세그먼트 표시
        if (temp.positive) changedIds.add(temp.positive);
        if (temp.negative) changedIds.add(temp.negative);
        if (state.rootSegments.characters[fromActualIndex].positive) {
          changedIds.add(state.rootSegments.characters[fromActualIndex].positive);
        }
        if (state.rootSegments.characters[fromActualIndex].negative) {
          changedIds.add(state.rootSegments.characters[fromActualIndex].negative);
        }
      });
    },

    resetChangedSegmentIds: (): void => {
      set((state) => {
        state.changedSegmentIds.clear();
        state.lastCompileVersion += 1;
      });
    },
  }))
);