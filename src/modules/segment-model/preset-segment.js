// modules/segment-model/preset-segment.js
import { BaseSegment } from "./segment.js";
import { SegmentType, PresetMode } from "./types.js";

/**
 * 프리셋 세그먼트 클래스
 * 와일드카드와 키워드를 통합한 표현
 */
export class PresetSegment extends BaseSegment {
  /**
   * 프리셋 세그먼트 생성
   * @param {string} name - 프리셋 이름
   * @param {PresetMode} mode - 'random'(와일드카드) 또는 'fixed'(키워드)
   * @param {string|null} selected - 키워드 모드일 때 선택된 항목
   * @param {string} id - 고유 식별자 (선택적)
   * @param {Object} metadata - 추가 메타데이터 (선택적)
   */
  constructor(
    name,
    mode = PresetMode.RANDOM,
    selected = null,
    id = null,
    metadata = {}
  ) {
    // 기본 메타데이터를 초기값으로 설정
    const defaultMetadata = {
      color: "#3A86FF",
      values: [], // 프리셋 값 캐싱
    };

    super(id, SegmentType.PRESET, [], { ...defaultMetadata, ...metadata });

    this.name = name;
    this.mode = mode;
    this.selected = selected;
  }

  /**
   * 프리셋 모드 전환
   * @param {PresetMode} newMode - 새 모드
   * @param {string|null} selected - 키워드 모드일 때 선택할 항목
   */
  setMode(newMode, selected = null) {
    this.mode = newMode;
    if (newMode === PresetMode.FIXED) {
      this.selected = selected;
    }
  }

  /**
   * 프리셋 값 설정 (메타데이터에 캐싱)
   * @param {Array<string>} values - 프리셋 옵션 값 배열
   */
  setValues(values) {
    this.metadata.values = [...values];
  }

  /**
   * 키워드 모드에서 선택된 항목 변경
   * @param {string} selected - 선택할 항목
   */
  selectItem(selected) {
    if (this.mode !== PresetMode.FIXED) {
      this.mode = PresetMode.FIXED;
    }
    this.selected = selected;
  }
}
