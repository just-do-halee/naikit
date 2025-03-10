/**
 * 모드 관리 스토어
 * 
 * 컴포즈/파인튜닝 모드 간의 전환 및 상태 관리
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * 편집기 모드 타입
 */
export type EditorMode = 'compose' | 'finetune';

/**
 * 커서 상태 인터페이스
 */
interface CursorState {
  /** 커서 위치 */
  cursorPosition: number | null;
  
  /** 스크롤 위치 */
  scrollPosition: number | null;
  
  /** 선택 범위 [시작, 끝] */
  selectedRange: [number, number] | null;
}

/**
 * 컴포즈 모드 상태 인터페이스
 */
export interface ComposeState extends CursorState {
  /** 마지막 사용 프리셋 */
  lastUsedPreset?: string;
}

/**
 * 파인튜닝 모드 상태 인터페이스
 */
export interface FinetuneState extends CursorState {
  /** 활성 세그먼트 ID */
  activeSegmentId: string | null;
  
  /** 활성 그룹 ID */
  activeGroupId: string | null;
}

/**
 * 모드 상태 인터페이스
 */
interface ModeState {
  /** 현재 모드 */
  currentMode: EditorMode;
  
  /** 모드별 상태 */
  modeState: {
    compose: ComposeState;
    finetune: FinetuneState;
  };
}

/**
 * 모드 액션 인터페이스
 */
interface ModeActions {
  /**
   * 모드 전환
   */
  switchMode: (newMode: EditorMode) => void;
  
  /**
   * 현재 모드 상태 저장
   */
  saveCurrentModeState: (state: Partial<ComposeState | FinetuneState>) => void;
  
  /**
   * 모드 상태 업데이트
   */
  updateModeState: <M extends EditorMode>(
    mode: M,
    updates: Partial<M extends 'compose' ? ComposeState : FinetuneState>
  ) => void;
}

/**
 * 커서 액션 인터페이스
 */
interface CursorActions {
  /**
   * 커서 위치 설정
   */
  setCursorPosition: (position: number) => void;
  
  /**
   * 스크롤 위치 설정
   */
  setScrollPosition: (position: number) => void;
  
  /**
   * 선택 범위 설정
   */
  setSelectedRange: (range: [number, number] | null) => void;
}

/**
 * 파인튜닝 액션 인터페이스
 */
interface FinetuneActions {
  /**
   * 활성 세그먼트 설정
   */
  setActiveSegment: (segmentId: string | null) => void;
  
  /**
   * 활성 그룹 설정
   */
  setActiveGroup: (groupId: string | null) => void;
}

/**
 * 모드 상태 저장소
 */
export const useModeStore = create<
  ModeState & ModeActions & CursorActions & FinetuneActions
>()(
  immer((set, get) => ({
    // 초기 상태
    currentMode: 'compose',
    modeState: {
      compose: {
        cursorPosition: 0,
        scrollPosition: 0,
        selectedRange: null
      },
      finetune: {
        cursorPosition: 0,
        scrollPosition: 0,
        selectedRange: null,
        activeSegmentId: null,
        activeGroupId: null
      }
    },
    
    // 모드 전환
    switchMode: (newMode: EditorMode) => {
      const currentMode = get().currentMode;
      if (currentMode === newMode) return;
      
      set(state => {
        // 모드 전환 시 명시적으로 상태 설정
        state.currentMode = newMode;
        
        // 모드 전환 이후에도 이전 모드 상태가 보존되어야 함
        if (!state.modeState[newMode]) {
          // 모드 상태가 초기화되지 않은 경우 기본값 설정
          if (newMode === 'compose') {
            state.modeState.compose = {
              cursorPosition: 0,
              scrollPosition: 0,
              selectedRange: null
            };
          } else {
            state.modeState.finetune = {
              cursorPosition: 0,
              scrollPosition: 0,
              selectedRange: null,
              activeSegmentId: null,
              activeGroupId: null
            };
          }
        }
      });
    },
    
    // 현재 모드 상태 저장
    saveCurrentModeState: (updates) => {
      const currentMode = get().currentMode;
      
      set(state => {
        // 명시적 타입 처리로 업데이트 (as any 대신)
        if (currentMode === 'compose') {
          state.modeState.compose = {
            ...state.modeState.compose,
            ...updates as Partial<ComposeState>
          };
        } else {
          state.modeState.finetune = {
            ...state.modeState.finetune,
            ...updates as Partial<FinetuneState>
          };
        }
      });
    },
    
    // 특정 모드 상태 업데이트
    updateModeState: (mode, updates) => {
      set(state => {
        // 명시적 타입 처리
        if (mode === 'compose') {
          state.modeState.compose = {
            ...state.modeState.compose,
            ...updates as Partial<ComposeState>
          };
        } else {
          state.modeState.finetune = {
            ...state.modeState.finetune,
            ...updates as Partial<FinetuneState>
          };
        }
      });
    },
    
    // 커서 위치 설정
    setCursorPosition: (position: number) => {
      const currentMode = get().currentMode;
      
      set(state => {
        if (currentMode === 'compose') {
          state.modeState.compose = {
            ...state.modeState.compose,
            cursorPosition: position
          };
        } else {
          state.modeState.finetune = {
            ...state.modeState.finetune,
            cursorPosition: position
          };
        }
      });
    },
    
    // 스크롤 위치 설정
    setScrollPosition: (position: number) => {
      const currentMode = get().currentMode;
      
      set(state => {
        if (currentMode === 'compose') {
          state.modeState.compose = {
            ...state.modeState.compose,
            scrollPosition: position
          };
        } else {
          state.modeState.finetune = {
            ...state.modeState.finetune,
            scrollPosition: position
          };
        }
      });
    },
    
    // 선택 범위 설정
    setSelectedRange: (range: [number, number] | null) => {
      const currentMode = get().currentMode;
      
      set(state => {
        if (currentMode === 'compose') {
          state.modeState.compose = {
            ...state.modeState.compose,
            selectedRange: range
          };
        } else {
          state.modeState.finetune = {
            ...state.modeState.finetune,
            selectedRange: range
          };
        }
      });
    },
    
    // 활성 세그먼트 설정 (파인튜닝 모드)
    setActiveSegment: (segmentId: string | null) => {
      set(state => {
        state.modeState.finetune = {
          ...state.modeState.finetune,
          activeSegmentId: segmentId
        };
      });
    },
    
    // 활성 그룹 설정 (파인튜닝 모드)
    setActiveGroup: (groupId: string | null) => {
      set(state => {
        state.modeState.finetune = {
          ...state.modeState.finetune,
          activeGroupId: groupId
        };
      });
    }
  }))
);
