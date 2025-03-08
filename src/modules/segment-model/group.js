// modules/segment-model/group.js
import { GroupWeightMode } from "./types.js";

/**
 * 세그먼트 그룹 클래스
 * 관련 세그먼트를 함께 관리하기 위한 구조
 */
export class SegmentGroup {
  /**
   * 세그먼트 그룹 생성
   * @param {string} id - 그룹 고유 식별자
   * @param {string} name - 그룹 이름
   * @param {Array<string>} segmentIds - 그룹에 포함된 세그먼트 ID 배열
   * @param {GroupWeightMode} weightMode - 'relative' 또는 'absolute'
   * @param {string} color - 그룹 색상
   */
  constructor(
    id,
    name,
    segmentIds = [],
    weightMode = GroupWeightMode.RELATIVE,
    color = "#FF9F1C"
  ) {
    this.id =
      id || `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = name || "그룹";
    this.segmentIds = [...segmentIds];
    this.weightMode = weightMode;
    this.color = color;
  }

  /**
   * 세그먼트 추가
   * @param {string} segmentId - 추가할 세그먼트 ID
   */
  addSegment(segmentId) {
    if (!this.segmentIds.includes(segmentId)) {
      this.segmentIds.push(segmentId);
    }
  }

  /**
   * 세그먼트 제거
   * @param {string} segmentId - 제거할 세그먼트 ID
   * @returns {boolean} 제거 성공 여부
   */
  removeSegment(segmentId) {
    const index = this.segmentIds.indexOf(segmentId);
    if (index === -1) return false;

    this.segmentIds.splice(index, 1);
    return true;
  }

  /**
   * 무게 모드 변경
   * @param {GroupWeightMode} newMode - 새 무게 모드
   */
  setWeightMode(newMode) {
    this.weightMode = newMode;
  }
}
