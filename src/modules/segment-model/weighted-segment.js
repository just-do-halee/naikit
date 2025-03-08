// modules/segment-model/weighted-segment.js
import { BaseSegment } from "./segment.js";
import { SegmentType, WeightType } from "./types.js";

/**
 * 가중치 세그먼트 클래스
 * 프롬프트 요소의 가중치 표현
 */
export class WeightedSegment extends BaseSegment {
  /**
   * 가중치 세그먼트 생성
   * @param {WeightType} bracketType - 'increase' 또는 'decrease'
   * @param {number} bracketLevel - 괄호 중첩 레벨 (양수)
   * @param {Array<BaseSegment>} children - 가중치가 적용될 자식 세그먼트
   * @param {string} id - 고유 식별자 (선택적)
   * @param {Object} metadata - 추가 메타데이터 (선택적)
   */
  constructor(
    bracketType,
    bracketLevel,
    children = [],
    id = null,
    metadata = {}
  ) {
    // 기본 메타데이터 설정
    const defaultMetadata = {
      color: bracketType === WeightType.INCREASE ? "#8ECAE6" : "#FD8A8A",
      intensity: Math.min(1, bracketLevel / 20), // 레벨에 따른 색상 강도 (0-1)
    };

    super(id, SegmentType.WEIGHTED, children, {
      ...defaultMetadata,
      ...metadata,
    });

    this.bracketType = bracketType;
    this.bracketLevel = Math.max(0, bracketLevel); // 음수 레벨 방지
    this.displayValue = this.calculateDisplayValue();
  }

  /**
   * 괄호 정보를 기반으로 표시 가중치 값 계산
   * @returns {number} 표시할 가중치 값
   */
  calculateDisplayValue() {
    // 중립 가중치 (레벨 0)
    if (this.bracketLevel === 0) return 1.0;

    // 가중치 계산: bracketType이 increase면 1.05^level, decrease면 1.05^(-level)
    if (this.bracketType === WeightType.INCREASE) {
      return Math.pow(1.05, this.bracketLevel);
    } else {
      return Math.pow(1.05, -this.bracketLevel);
    }
  }

  /**
   * 가중치 값 변경
   * @param {number} newWeight - 새 가중치 값
   */
  setWeight(newWeight) {
    // 1.0은 중립 가중치
    if (newWeight === 1.0) {
      this.bracketType = WeightType.INCREASE;
      this.bracketLevel = 0;
    } else {
      // 증가 또는 감소 가중치 결정
      const isIncrease = newWeight > 1.0;
      this.bracketType = isIncrease ? WeightType.INCREASE : WeightType.DECREASE;

      // 가장 가까운 괄호 레벨 계산
      if (isIncrease) {
        this.bracketLevel = Math.round(Math.log(newWeight) / Math.log(1.05));
      } else {
        this.bracketLevel = Math.round(
          Math.log(1 / newWeight) / Math.log(1.05)
        );
      }

      // 레벨 범위 제한 (0~78)
      this.bracketLevel = Math.max(0, Math.min(78, this.bracketLevel));
    }

    // 표시 값 업데이트
    this.displayValue = this.calculateDisplayValue();

    // 메타데이터 업데이트 (색상 강도)
    this.updateMetadata({
      intensity: Math.min(1, this.bracketLevel / 20),
    });
  }

  /**
   * 가중치 세그먼트의 유효 가중치 계산 (부모 가중치 고려)
   * @param {number} parentWeight - 부모 세그먼트의 가중치 (기본값: 1.0)
   * @returns {number} 유효 가중치 값
   */
  getEffectiveWeight(parentWeight = 1.0) {
    return parentWeight * this.displayValue;
  }
}
