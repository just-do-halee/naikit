// modules/segment-model/types.js
/**
 * 세그먼트 타입 상수
 * @readonly
 * @enum {string}
 */
export const SegmentType = {
  TEXT: "text",
  PRESET: "preset",
  WEIGHTED: "weighted",
  INLINE_WILDCARD: "inline_wildcard",
  ROOT: "root",
};

/**
 * 프리셋 모드 상수
 * @readonly
 * @enum {string}
 */
export const PresetMode = {
  RANDOM: "random", // 와일드카드 모드
  FIXED: "fixed", // 키워드 모드
};

/**
 * 가중치 타입 상수
 * @readonly
 * @enum {string}
 */
export const WeightType = {
  INCREASE: "increase", // 중괄호 {} 가중치 증가
  DECREASE: "decrease", // 대괄호 [] 가중치 감소
};

/**
 * 그룹 가중치 모드
 * @readonly
 * @enum {string}
 */
export const GroupWeightMode = {
  RELATIVE: "relative", // 상대적 비율 유지
  ABSOLUTE: "absolute", // 절대값 모드
};
