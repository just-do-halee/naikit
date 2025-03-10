import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type EditorMode = 'compose' | 'finetune';

interface ModeState {
  currentMode: EditorMode;
  modeState: {
    compose: {
      cursorPosition: number | null;
      scrollPosition: number | null;
      selectedRange: [number, number] | null;
      lastUsedPreset?: string;
    };
    finetune: {
      cursorPosition: number | null;
      scrollPosition: number | null;
      selectedRange: [number, number] | null;
      activeSegmentId: string | null;
      activeGroupId: string | null;
    };
  };
}

interface ModeActions {
  switchMode: (newMode: EditorMode) => void;
  saveCurrentModeState: (state: Partial<any>) => void;
  setCursorPosition: (position: number) => void;
  setActiveSegment: (segmentId: string | null) => void;
  setActiveGroup: (groupId: string | null) => void;
}

export const useModeStore = create<ModeState & ModeActions>()(
  immer((set, get) => ({
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
    
    switchMode: (newMode: EditorMode) => {
      set(state => {
        state.currentMode = newMode;
      });
    },
    
    saveCurrentModeState: (updates) => {
      const currentMode = get().currentMode;
      set(state => {
        if (currentMode === 'compose') {
          state.modeState.compose = {
            ...state.modeState.compose,
            ...(updates as typeof state.modeState.compose)
          };
        } else {
          state.modeState.finetune = {
            ...state.modeState.finetune,
            ...(updates as typeof state.modeState.finetune)
          };
        }
      });
    },
    
    setCursorPosition: (position: number) => {
      const currentMode = get().currentMode;
      set(state => {
        state.modeState[currentMode].cursorPosition = position;
      });
    },
    
    setActiveSegment: (segmentId: string | null) => {
      set(state => {
        state.modeState.finetune.activeSegmentId = segmentId;
      });
    },

    setActiveGroup: (groupId: string | null) => {
      set(state => {
        state.modeState.finetune.activeGroupId = groupId;
      });
    }
  }))
);