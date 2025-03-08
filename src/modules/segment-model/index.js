// modules/segment-model/index.js
export * from "./types.js";
export * from "./segment.js";
export * from "./text-segment.js";
export * from "./preset-segment.js";
export * from "./weighted-segment.js";
export * from "./inline-wildcard-segment.js";
export * from "./group.js";

// 세그먼트 루트 생성 유틸리티
export function createSegmentRoot() {
  return new BaseSegment("root", SegmentType.ROOT);
}
