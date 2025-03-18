// modules/compiler/segment-incremental-compiler.ts

import {
  Segment,
  isTextSegment,
  isWeightedSegment,
  isPresetSegment,
  isInlineWildcardSegment,
} from "../segment-model/types";
import { CompileOptions } from "./types";
import { CompileCache } from "./types";
import { getCompileCacheInstance } from "./segment-compiler-cache";
import {
  createSeededRandom,
  compilePresetSegment,
  compileInlineWildcard,
  applyBrackets,
} from "./segment-compiler";
import { assertExists } from "@/shared/utils/type-safety";

/**
 * 증분 컴파일 시스템 - 변경된 세그먼트만 재컴파일
 *
 * @param rootSegment 루트 세그먼트
 * @param lastCompiledVersion 마지막 컴파일 버전
 * @param changedSegmentIds 변경된 세그먼트 ID 집합
 * @param options 컴파일 옵션
 * @returns 컴파일된 텍스트
 */
export function incrementalCompileSegmentTree(
  rootSegment: Segment,
  lastCompiledVersion: number,
  changedSegmentIds: Set<string>,
  options: CompileOptions = {}
): string {
  assertExists(rootSegment, "Root segment is required for compilation");

  // 컴파일 캐시 인스턴스 가져오기
  const cache = getCompileCacheInstance();

  // 변경사항이 없으면 캐시된 결과 사용
  if (lastCompiledVersion && changedSegmentIds.size === 0) {
    const cachedResult = cache.get({
      segmentId: rootSegment.id,
      ...options,
    });

    if (cachedResult) {
      return cachedResult;
    }
  }

  // 변경된 세그먼트의 영향을 받는 경로 찾기
  const affectedPaths = findAffectedPaths(rootSegment, changedSegmentIds);

  // 최적화된 재컴파일 수행
  if (affectedPaths.length > 0) {
    // 영향받는 세그먼트 무효화
    for (const path of affectedPaths) {
      // 경로의 마지막 ID는 변경된 세그먼트의 ID
      if (path.length > 0) {
        cache.invalidateTree(path[path.length - 1]);
      }
    }
  }

  // 세그먼트 트리 컴파일 (깊이 우선 방식)
  return compileWithCache(rootSegment, cache, options);
}

/**
 * 캐시를 활용한 세그먼트 컴파일 (재귀적)
 *
 * @param segment 컴파일할 세그먼트
 * @param cache 컴파일 캐시 인스턴스
 * @param options 컴파일 옵션
 * @returns 컴파일된 텍스트
 */
function compileWithCache(
  segment: Segment,
  cache: CompileCache,
  options: CompileOptions
): string {
  // 캐시 확인
  const cachedResult = cache.get({
    segmentId: segment.id,
    ...options,
  });

  if (cachedResult !== null) {
    return cachedResult;
  }

  // 캐시 미스: 세그먼트 유형별 컴파일 수행
  let result: string;

  if (isTextSegment(segment)) {
    // 텍스트 내용 가져오기
    const textContent = segment.content || "";

    // 자식 세그먼트가 있으면 처리
    let childrenContent = "";
    if (segment.children && segment.children.length > 0) {
      childrenContent = segment.children
        .map((child) => {
          // 의존성 등록
          if ("registerDependency" in cache) {
            (cache as any).registerDependency(segment.id, child.id);
          }
          return compileWithCache(child, cache, options);
        })
        .join("");
    }

    // 텍스트 내용과 자식 컴파일 결과 결합
    result = textContent + childrenContent;
  } else if (isWeightedSegment(segment)) {
    // 자식 세그먼트 재귀적 컴파일
    const childrenContent =
      segment.children
        ?.map((child) => {
          // 의존성 등록 (세그먼트 관계 추적)
          if ("registerDependency" in cache) {
            (cache as any).registerDependency(segment.id, child.id);
          }
          return compileWithCache(child, cache, options);
        })
        .join("") || "";

    // 가중치 적용
    result = applyBrackets(
      childrenContent,
      segment.bracketType,
      segment.bracketLevel
    );
  } else if (isPresetSegment(segment)) {
    result = compilePresetSegment(
      segment,
      options.seed ? createSeededRandom(options.seed) : () => Math.random(),
      options.expandWildcards || false
    );
  } else if (isInlineWildcardSegment(segment)) {
    result = compileInlineWildcard(
      segment,
      options.seed ? createSeededRandom(options.seed) : () => Math.random(),
      options.expandWildcards || false
    );
  } else {
    // 기타 세그먼트 유형 처리 (확장성)
    // 타입 안전성 유지를 위한 수정
    result = "";

    // 타입 단언으로 segment 객체 안전하게 접근
    const typedSegment = segment as { id: string; children?: Segment[] };

    // 안전하게 자식 세그먼트 접근
    const children = typedSegment.children;
    if (children && Array.isArray(children) && children.length > 0) {
      result = children
        .map((child: Segment) => {
          // 의존성 등록
          if ("registerDependency" in cache) {
            // 수정된 부분: 안전한 id 참조
            (cache as any).registerDependency(typedSegment.id, child.id);
          }
          return compileWithCache(child, cache, options);
        })
        .join("");
    }
  }

  // 결과 캐싱
  cache.set(
    {
      segmentId: segment.id,
      ...options,
    },
    result
  );

  return result;
}

/**
 * 변경된 세그먼트의 영향을 받는 경로 찾기
 *
 * @param rootSegment 루트 세그먼트
 * @param changedIds 변경된 세그먼트 ID 집합
 * @returns 영향받는 세그먼트 경로 배열
 */
export function findAffectedPaths(
  rootSegment: Segment,
  changedIds: Set<string>
): string[][] {
  const paths: string[][] = [];

  // 현재 세그먼트 자체가 변경되었으면 경로에 추가
  if (changedIds.has(rootSegment.id)) {
    paths.push([rootSegment.id]);
  }

  // 자식 세그먼트 처리 (깊이 우선 탐색)
  if (rootSegment.children && rootSegment.children.length > 0) {
    for (const child of rootSegment.children) {
      const childPaths = findAffectedPaths(child, changedIds);
      // 자식 경로가 있으면 현재 세그먼트 ID를 앞에 추가
      for (const childPath of childPaths) {
        paths.push([rootSegment.id, ...childPath]);
      }
    }
  }

  return paths;
}
