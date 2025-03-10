/**
 * 세그먼트 상태 관리 스토어
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import {
  Segment,
  TextSegment,
  WeightedSegment,
  PresetSegment,
  InlineWildcardSegment,
  RootSegments,
  BracketType,
  isTextSegment,
  isWeightedSegment,
  isPresetSegment,
  isInlineWildcardSegment,
} from "@/modules/segment-model/types";
import {
  createTextSegment,
  createWeightedSegment,
  createPresetSegment,
  createInlineWildcardSegment,
  calculateDisplayValue,
} from "@/modules/segment-model/segment-factory";
import {
  findSegmentById,
  updateSegment as updateSegmentOp,
  insertSegment as insertSegmentOp,
  removeSegment as removeSegmentOp,
  optimizeSegmentTree,
} from "@/modules/segment-model/segment-operations";
import { assertExists } from "@/utils/type-safety";

/**
 * 세그먼트 상태 인터페이스
 */
interface SegmentState {
  /**
   * 세그먼트 맵 (ID => 세그먼트)
   */
  segments: Record<string, Segment>;

  /**
   * 루트 세그먼트 참조
   */
  rootSegments: RootSegments;

  /**
   * 마지막 컴파일 버전 (증분 컴파일용)
   */
  lastCompileVersion: number;

  /**
   * 변경된 세그먼트 ID 목록 (증분 컴파일용)
   * Immer 호환을 위해 undefined일 수 있음
   */
  changedSegmentIds: Set<string> | undefined;
}

/**
 * 세그먼트 액션 인터페이스
 */
interface SegmentActions {
  /**
   * 세그먼트 추가
   */
  addSegment: (segment: Segment, parentId?: string, index?: number) => string;

  /**
   * 세그먼트 업데이트
   */
  updateSegment: (id: string, updates: Partial<Segment>) => void;

  /**
   * 세그먼트 제거
   */
  removeSegment: (id: string) => void;

  /**
   * 루트 세그먼트 설정
   */
  setRootSegment: (
    type: "main" | "character",
    promptType: "positive" | "negative",
    id: string,
    characterIndex?: number
  ) => void;

  /**
   * 변경된 세그먼트 ID 초기화
   */
  resetChangedSegmentIds: () => void;
}

/**
 * 세그먼트 쿼리 인터페이스
 */
interface SegmentQueries {
  /**
   * ID로 세그먼트 조회
   */
  getSegmentById: (id: string) => Segment | undefined;

  /**
   * 루트 세그먼트 조회
   */
  getRootSegment: (
    type: "main" | "character",
    promptType: "positive" | "negative",
    characterIndex?: number
  ) => Segment | undefined;
}

/**
 * 세그먼트 고급 액션 인터페이스
 */
interface SegmentAdvancedActions {
  /**
   * 텍스트 세그먼트 생성 및 추가
   */
  createAndAddTextSegment: (
    content: string,
    parentId?: string,
    index?: number
  ) => string;

  /**
   * 가중치 세그먼트 생성 및 추가
   */
  createAndAddWeightedSegment: (
    childSegmentIds: string[],
    bracketType: BracketType,
    bracketLevel: number,
    parentId?: string,
    index?: number
  ) => string;

  /**
   * 캐릭터 추가
   */
  addCharacter: () => number;

  /**
   * 캐릭터 제거
   */
  removeCharacter: (characterIndex: number) => void;

  /**
   * 캐릭터 순서 변경
   */
  reorderCharacters: (fromIndex: number, toIndex: number) => void;
}

// 유틸리티 타입 정의
type CharacterPrompt = {
  positive: string;
  negative: string;
};

// 유틸리티 함수 정의
/**
 * changedSegmentIds가 존재하는지 확인하고 없으면 생성
 */
function ensureChangedIdsSet(state: SegmentState): Set<string> {
  if (!state.changedSegmentIds) {
    state.changedSegmentIds = new Set<string>();
  }
  return state.changedSegmentIds;
}

/**
 * characters 객체가 존재하는지 확인하고 없으면 생성
 */
function ensureCharactersObject(
  state: SegmentState
): Record<number, CharacterPrompt> {
  if (!state.rootSegments.characters) {
    state.rootSegments.characters = {};
  }
  return state.rootSegments.characters;
}

/**
 * 세그먼트가 존재하는지 검증하는 타입 가드
 */
function isSegmentDefined(
  segment: Segment | undefined | null
): segment is Segment {
  return segment !== undefined && segment !== null;
}

/**
 * 루트 세그먼트 참조가 삭제되었을 때 처리
 */
function handleRootSegmentRemoval(
  state: SegmentState,
  removedId: string,
  changedIds: Set<string>
): void {
  // 메인 프롬프트 루트 처리
  Object.entries(state.rootSegments.main).forEach(([promptType, rootId]) => {
    if (rootId === removedId) {
      const newRoot = createTextSegment("");
      state.segments[newRoot.id] = newRoot;
      state.rootSegments.main[promptType as "positive" | "negative"] =
        newRoot.id;
      changedIds.add(newRoot.id);
    }
  });

  // 캐릭터 루트 처리
  if (state.rootSegments.characters) {
    Object.entries(state.rootSegments.characters).forEach(
      ([characterIndex, character]) => {
        Object.entries(character).forEach(([promptType, rootId]) => {
          if (rootId === removedId) {
            const newRoot = createTextSegment("");
            state.segments[newRoot.id] = newRoot;
            if (state.rootSegments.characters) {
              state.rootSegments.characters[parseInt(characterIndex)][
                promptType as "positive" | "negative"
              ] = newRoot.id;
              changedIds.add(newRoot.id);
            }
          }
        });
      }
    );
  }
}

/**
 * 세그먼트 상태 저장소 타입 정의
 */
type SegmentStoreState = SegmentState &
  SegmentActions &
  SegmentQueries &
  SegmentAdvancedActions;

/**
 * 세그먼트 상태 저장소
 */
export const useSegmentStore = create<SegmentStoreState>()(
  immer((set, get) => {
    // 초기 루트 세그먼트 생성
    const mainPositiveRoot = createTextSegment("");
    const mainNegativeRoot = createTextSegment("");

    return {
      // 초기 상태
      segments: {
        [mainPositiveRoot.id]: mainPositiveRoot,
        [mainNegativeRoot.id]: mainNegativeRoot,
      } as Record<string, Segment>,
      rootSegments: {
        main: {
          positive: mainPositiveRoot.id,
          negative: mainNegativeRoot.id,
        },
        characters: {},
      },
      lastCompileVersion: 0,
      changedSegmentIds: new Set<string>(),

      // 액션 구현
      addSegment: (
        segment: Segment,
        parentId?: string,
        index?: number
      ): string => {
        const segmentId = segment.id || nanoid();
        // 불변 방식으로 ID 설정
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
              index < updatedParent.children.length
            ) {
              updatedParent.children.splice(index, 0, segmentWithId);
            } else {
              updatedParent.children.push(segmentWithId);
            }

            // 부모 업데이트
            state.segments[parentId] = updatedParent;
            changedIds.add(parentId);
          }
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
          }
        });
      },

      removeSegment: (id: string): void => {
        set((state) => {
          // 변경 세그먼트 ID 추적
          const changedIds = ensureChangedIdsSet(state);

          // 영향 받는 부모 찾기
          const affectedParents: string[] = [];

          // 모든 부모에서 제거
          Object.entries(state.segments).forEach(([parentId, segment]) => {
            if (segment.children) {
              const index = segment.children.findIndex(
                (child) => child.id === id
              );
              if (index !== -1) {
                // 불변 방식으로 자식 제거
                const newChildren = [...segment.children];
                newChildren.splice(index, 1);
                state.segments[parentId] = {
                  ...segment,
                  children: newChildren,
                };
                affectedParents.push(parentId);
                changedIds.add(parentId);
              }
            }
          });

          // 세그먼트 맵에서 제거
          if (state.segments[id]) {
            const { [id]: removed, ...remainingSegments } = state.segments;
            state.segments = remainingSegments;
            changedIds.add(id);
          }

          // 루트 세그먼트인 경우 처리
          handleRootSegmentRemoval(state, id, changedIds);
        });
      },

      setRootSegment: (
        type: "main" | "character",
        promptType: "positive" | "negative",
        id: string,
        characterIndex?: number
      ): void => {
        set((state) => {
          // 변경 세그먼트 ID 추적
          const changedIds = ensureChangedIdsSet(state);

          if (type === "main") {
            // 기존 루트가 있으면 변경됨 표시
            const oldRootId = state.rootSegments.main[promptType];
            if (oldRootId) {
              changedIds.add(oldRootId);
            }

            // 새 루트 설정
            state.rootSegments.main[promptType] = id;
            changedIds.add(id);
          } else if (type === "character" && characterIndex !== undefined) {
            // characters 객체 준비
            const characters = ensureCharactersObject(state);

            // 캐릭터가 없으면 생성
            if (!characters[characterIndex]) {
              characters[characterIndex] = {
                positive: "",
                negative: "",
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

      getSegmentById: (id: string): Segment | undefined => {
        const segment = get().segments[id];
        return segment || undefined;
      },

      getRootSegment: (
        type: "main" | "character",
        promptType: "positive" | "negative",
        characterIndex?: number
      ): Segment | undefined => {
        const state = get();

        if (type === "main") {
          const rootId = state.rootSegments.main[promptType];
          return rootId ? state.segments[rootId] : undefined;
        } else if (type === "character" && characterIndex !== undefined) {
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

        // 존재하는 세그먼트만 필터링 (타입 가드 사용)
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
                  const childIndex = parentSegment.children.findIndex(
                    (child) => child.id === id
                  );

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

      addCharacter: (): number => {
        // 새 캐릭터 인덱스 결정
        let newIndex = 0;
        
        // 현재 캐릭터 인덱스 확인
        const store = get();
        if (store.rootSegments.characters) {
          const existingIndices = Object.keys(store.rootSegments.characters).map(Number);
          while (existingIndices.includes(newIndex)) {
            newIndex++;
          }
        }
        
        // 명시적 타입의 새 캐릭터 루트 세그먼트 생성
        const positiveRoot = createTextSegment("");
        const negativeRoot = createTextSegment("");
        
        // 한 번에 모든 필요한 업데이트 수행
        set(state => {
          // 세그먼트 맵에 추가
          state.segments[positiveRoot.id] = positiveRoot;
          state.segments[negativeRoot.id] = negativeRoot;
          
          // 변경 ID 추적
          const changedIds = ensureChangedIdsSet(state);
          changedIds.add(positiveRoot.id);
          changedIds.add(negativeRoot.id);
          
          // 캐릭터 객체 초기화
          if (!state.rootSegments.characters) {
            state.rootSegments.characters = {};
          }
          
          // 캐릭터 정보 추가
          state.rootSegments.characters[newIndex] = {
            positive: positiveRoot.id,
            negative: negativeRoot.id
          };
        });
        
        // 직접 캐릭터 추가 확인
        const afterState = get();
        console.log(`Character added at index ${newIndex}:`, 
          afterState.rootSegments.characters && 
          afterState.rootSegments.characters[newIndex]);
        
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
            if (positiveId) {
              const { [positiveId]: removedPositive, ...remainingSegments1 } =
                state.segments;
              state.segments = remainingSegments1;
              changedIds.add(positiveId);
            }

            if (negativeId) {
              const { [negativeId]: removedNegative, ...remainingSegments2 } =
                state.segments;
              state.segments = remainingSegments2;
              changedIds.add(negativeId);
            }

            // 캐릭터 제거
            const {
              [characterIndex]: removedCharacter,
              ...remainingCharacters
            } = characters;
            state.rootSegments.characters = remainingCharacters;
          }
        });
      },

      reorderCharacters: (fromIndex: number, toIndex: number): void => {
        // characters 객체 확인
        const store = get();
        
        // 스토어에 characters 객체가 없으면 생성
        if (!store.rootSegments.characters) {
          set((state) => {
            state.rootSegments.characters = {};
          });
          return;
        }
        
        const characters = store.rootSegments.characters;

        // 범위 체크
        const characterEntries = Object.entries(characters);
        if (
          characterEntries.length <= 1 ||
          fromIndex < 0 ||
          fromIndex >= characterEntries.length ||
          toIndex < 0 ||
          toIndex >= characterEntries.length ||
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
          const actualIndices = Object.keys(state.rootSegments.characters).map(Number).sort((a, b) => a - b);
          const fromActualIndex = actualIndices[fromIndex];
          const toActualIndex = actualIndices[toIndex];

          if (fromActualIndex === undefined || toActualIndex === undefined) {
            return;
          }

          // 캐릭터 객체 직접 교환
          const temp = { ...state.rootSegments.characters[fromActualIndex] };
          state.rootSegments.characters[fromActualIndex] = { ...state.rootSegments.characters[toActualIndex] };
          state.rootSegments.characters[toActualIndex] = temp;

          // 변경된 세그먼트 표시
          Object.values(state.rootSegments.characters).forEach((character) => {
            if (character.positive) {
              changedIds.add(character.positive);
            }
            if (character.negative) {
              changedIds.add(character.negative);
            }
          });
        });
      },

      resetChangedSegmentIds: (): void => {
        set((state) => {
          if (!state.changedSegmentIds) {
            state.changedSegmentIds = new Set<string>();
          } else {
            state.changedSegmentIds.clear();
          }

          // lastCompileVersion이 정의되어 있는지 확인
          state.lastCompileVersion = (state.lastCompileVersion || 0) + 1;
        });
      },
    };
  })
);
