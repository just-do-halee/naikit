// modules/segment-model/inline-wildcard-segment.js
import { BaseSegment } from "./segment.js";
import { SegmentType } from "./types.js";

/**
 * 인라인 와일드카드 세그먼트 클래스
 * 괄호와 파이프로 표현되는 인라인 선택 옵션
 */
export class InlineWildcardSegment extends BaseSegment {
  /**
   * 인라인 와일드카드 세그먼트 생성
   * @param {Array<string>} options - 선택 가능한 옵션 배열
   * @param {string} id - 고유 식별자 (선택적)
   * @param {Object} metadata - 추가 메타데이터 (선택적)
   */
  constructor(options = [], id = null, metadata = {}) {
    // 기본 메타데이터 설정
    const defaultMetadata = {
      color: "#FFB703",
    };

    super(id, SegmentType.INLINE_WILDCARD, [], {
      ...defaultMetadata,
      ...metadata,
    });

    this.options = [...options];
  }

  /**
   * 옵션 추가
   * @param {string} option - 추가할 옵션
   */
  addOption(option) {
    this.options.push(option);
  }

  /**
   * 옵션 제거
   * @param {number} index - 제거할 옵션 인덱스
   * @returns {string|null} 제거된 옵션 또는 없을 경우 null
   */
  removeOption(index) {
    if (index < 0 || index >= this.options.length) return null;
    return this.options.splice(index, 1)[0];
  }

  /**
   * 옵션 업데이트
   * @param {number} index - 업데이트할 옵션 인덱스
   * @param {string} newOption - 새 옵션 값
   */
  updateOption(index, newOption) {
    if (index < 0 || index >= this.options.length) return;
    this.options[index] = newOption;
  }

  /**
   * 무작위 옵션 선택
   * @param {Function} random - 난수 생성 함수 (0~1 사이 값 반환)
   * @returns {string|null} 선택된 옵션 또는 옵션이 없을 경우 null
   */
  getRandomOption(random = Math.random) {
    if (this.options.length === 0) return null;
    const index = Math.floor(random() * this.options.length);
    return this.options[index];
  }
}
