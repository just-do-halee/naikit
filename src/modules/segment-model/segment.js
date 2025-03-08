// modules/segment-model/segment.js
import { SegmentType } from "./types.js";

/**
 * 베이스 세그먼트 클래스
 * 모든 세그먼트 타입의 기본이 되는 클래스
 */
export class BaseSegment {
  /**
   * 세그먼트 생성
   * @param {string} id - 고유 식별자
   * @param {SegmentType} type - 세그먼트 타입
   * @param {Array<BaseSegment>} children - 자식 세그먼트 배열
   * @param {Object} metadata - 추가 메타데이터
   */
  constructor(id, type, children = [], metadata = {}) {
    this.id =
      id || `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.children = children;
    this.metadata = metadata;
  }

  /**
   * 자식 세그먼트 추가
   * @param {BaseSegment} child - 추가할 자식 세그먼트
   * @param {number} index - 삽입 위치 (기본값: 마지막)
   * @returns {BaseSegment} 추가된 자식 세그먼트
   */
  addChild(child, index = -1) {
    if (index === -1 || index >= this.children.length) {
      this.children.push(child);
    } else {
      this.children.splice(index, 0, child);
    }
    return child;
  }

  /**
   * 자식 세그먼트 제거
   * @param {string} childId - 제거할 자식 세그먼트 ID
   * @returns {BaseSegment|null} 제거된 세그먼트 또는 실패 시 null
   */
  removeChild(childId) {
    const index = this.children.findIndex((child) => child.id === childId);
    if (index === -1) return null;

    return this.children.splice(index, 1)[0];
  }

  /**
   * ID로 자식 세그먼트 찾기 (깊이 우선 탐색)
   * @param {string} id - 찾을 세그먼트 ID
   * @returns {BaseSegment|null} 찾은 세그먼트 또는 없을 경우 null
   */
  findById(id) {
    if (this.id === id) return this;

    for (const child of this.children) {
      const found = child.findById(id);
      if (found) return found;
    }

    return null;
  }

  /**
   * 메타데이터 업데이트
   * @param {Object} newData - 추가할 메타데이터
   */
  updateMetadata(newData) {
    this.metadata = { ...this.metadata, ...newData };
  }
}
