// modules/segment-model/text-segment.js
import { BaseSegment } from "./segment.js";
import { SegmentType } from "./types.js";

/**
 * 텍스트 세그먼트 클래스
 * 일반 텍스트 내용을 표현
 */
export class TextSegment extends BaseSegment {
  /**
   * 텍스트 세그먼트 생성
   * @param {string} content - 텍스트 내용
   * @param {string} id - 고유 식별자 (선택적)
   * @param {Object} metadata - 추가 메타데이터 (선택적)
   */
  constructor(content, id = null, metadata = {}) {
    super(id, SegmentType.TEXT, [], metadata);
    this.content = content || "";
  }

  /**
   * 텍스트 내용 변경
   * @param {string} newContent - 새 텍스트 내용
   */
  setContent(newContent) {
    this.content = newContent;
  }

  /**
   * 특정 위치에서 텍스트 세그먼트 분할
   * @param {number} position - 분할 위치
   * @returns {TextSegment} 분할된 새 텍스트 세그먼트
   */
  splitAt(position) {
    if (position < 0 || position >= this.content.length) {
      throw new Error("유효하지 않은 분할 위치");
    }

    const leftContent = this.content.substring(0, position);
    const rightContent = this.content.substring(position);

    // 원본 세그먼트 내용 갱신
    this.content = leftContent;

    // 새 세그먼트 생성
    return new TextSegment(rightContent);
  }
}
