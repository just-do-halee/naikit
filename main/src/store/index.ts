/**
 * 상태 관리 저장소 모듈
 */

// Immer 플러그인 활성화
import { enableMapSet } from 'immer';

// MapSet 플러그인 활성화 (Set과 Map에 대한 불변 업데이트 지원)
enableMapSet();

// 세그먼트 스토어
export { useSegmentStore } from './segment-store';

// 모드 스토어
export { useModeStore } from './mode-store';
export type { EditorMode } from './mode-store';

// 그룹 스토어
export { useGroupStore } from './group-store';
