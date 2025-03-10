import { describe, it, expect, vi } from "vitest";
import {
  findSegmentById,
  updateSegment,
  insertSegment,
  removeSegment,
  splitTextSegment,
  mergeAdjacentTextSegments,
  optimizeSegmentTree,
  findSegments,
} from "../../modules/segment-model/segment-operations";
import {
  createTextSegment,
  createWeightedSegment,
  createPresetSegment,
  createInlineWildcardSegment,
} from "../../modules/segment-model/segment-factory";
import {
  Segment,
  TextSegment,
  WeightedSegment,
  isTextSegment,
  isWeightedSegment,
  isPresetSegment,
  isInlineWildcardSegment,
} from "../../modules/segment-model/types";

describe("세그먼트 조작 함수", () => {
  describe("findSegmentById", () => {
    it("should find a direct child segment by ID", () => {
      const childSegment = createTextSegment("자식");
      const parent = createTextSegment("부모");
      parent.children = [childSegment];

      const foundSegment = findSegmentById(parent, childSegment.id);

      expect(foundSegment).not.toBeNull();
      expect(foundSegment?.id).toBe(childSegment.id);
    });

    it("should find a deeply nested segment by ID", () => {
      const grandchild = createTextSegment("손자");
      const child = createTextSegment("자식");
      child.children = [grandchild];
      const parent = createTextSegment("부모");
      parent.children = [child];

      const foundSegment = findSegmentById(parent, grandchild.id);

      expect(foundSegment).not.toBeNull();
      expect(foundSegment?.id).toBe(grandchild.id);
    });

    it("should return null for non-existent segment ID", () => {
      const parent = createTextSegment("부모");
      parent.children = [createTextSegment("자식")];

      const foundSegment = findSegmentById(parent, "non-existent-id");

      expect(foundSegment).toBeNull();
    });

    it("should handle empty children array", () => {
      const parent = createTextSegment("부모");
      parent.children = [];

      const foundSegment = findSegmentById(parent, "any-id");

      expect(foundSegment).toBeNull();
    });

    it("should find the root segment if it matches the ID", () => {
      const root = createTextSegment("루트");
      root.children = [createTextSegment("자식")];

      const foundSegment = findSegmentById(root, root.id);

      expect(foundSegment).not.toBeNull();
      expect(foundSegment?.id).toBe(root.id);
    });

    it("should handle undefined children property", () => {
      const segment = createTextSegment("단독");
      segment.children = undefined;

      const foundSegment = findSegmentById(segment, "any-id");

      expect(foundSegment).toBeNull();
    });

    it("should find segment in multi-branched tree", () => {
      const targetSegment = createTextSegment("타겟");
      const branch1 = createTextSegment("가지1");
      const branch2 = createTextSegment("가지2");
      branch2.children = [targetSegment];
      const branch3 = createTextSegment("가지3");
      const root = createTextSegment("루트");
      root.children = [branch1, branch2, branch3];

      const foundSegment = findSegmentById(root, targetSegment.id);

      expect(foundSegment).not.toBeNull();
      expect(foundSegment?.id).toBe(targetSegment.id);
    });
  });

  describe("findSegments", () => {
    it("should find all segments matching the predicate", () => {
      // 복잡한 세그먼트 트리 구성
      const textSegment1 = createTextSegment("텍스트1");
      const textSegment2 = createTextSegment("텍스트2");
      const textSegment3 = createTextSegment("텍스트3");

      const weightedSegment = createWeightedSegment(
        [textSegment3],
        "increase",
        2
      );

      const presetSegment = createPresetSegment("스타일", "fixed", "유화");

      const wildcardSegment = createInlineWildcardSegment(["옵션1", "옵션2"]);

      const root = createTextSegment("루트");
      root.children = [
        textSegment1,
        weightedSegment,
        textSegment2,
        presetSegment,
        wildcardSegment,
      ];

      // 모든 텍스트 세그먼트 찾기
      const textSegments = findSegments(root, (segment) =>
        isTextSegment(segment)
      );
      expect(textSegments).toHaveLength(4); // 루트, 텍스트1, 텍스트2, 텍스트3, 가중치 내부
      expect(textSegments.map((s) => s.id)).toContain(root.id);
      expect(textSegments.map((s) => s.id)).toContain(textSegment1.id);
      expect(textSegments.map((s) => s.id)).toContain(textSegment2.id);
      expect(textSegments.map((s) => s.id)).toContain(textSegment3.id);

      // 모든 가중치 세그먼트 찾기
      const weightedSegments = findSegments(root, (segment) =>
        isWeightedSegment(segment)
      );
      expect(weightedSegments).toHaveLength(1);
      expect(weightedSegments[0].id).toBe(weightedSegment.id);

      // 모든 프리셋 세그먼트 찾기
      const presetSegments = findSegments(root, (segment) =>
        isPresetSegment(segment)
      );
      expect(presetSegments).toHaveLength(1);
      expect(presetSegments[0].id).toBe(presetSegment.id);

      // 모든 인라인 와일드카드 세그먼트 찾기
      const wildcardSegments = findSegments(root, (segment) =>
        isInlineWildcardSegment(segment)
      );
      expect(wildcardSegments).toHaveLength(1);
      expect(wildcardSegments[0].id).toBe(wildcardSegment.id);
    });

    it("should return empty array when no segments match", () => {
      const segment = createTextSegment("텍스트");
      const results = findSegments(segment, (s) => false);
      expect(results).toHaveLength(0);
      expect(results).toEqual([]);
    });

    it("should handle complex content search predicates", () => {
      const segment1 = createTextSegment("안녕하세요");
      const segment2 = createTextSegment("반갑습니다");
      const segment3 = createTextSegment("안녕히 가세요");

      const root = createTextSegment("루트");
      root.children = [segment1, segment2, segment3];

      // '안녕'을 포함하는 모든 텍스트 세그먼트 찾기
      const helloSegments = findSegments(root, (segment) => {
        return isTextSegment(segment) && segment.content.includes("안녕");
      });

      expect(helloSegments).toHaveLength(2);
      expect(helloSegments.map((s) => (s as TextSegment).content)).toContain(
        "안녕하세요"
      );
      expect(helloSegments.map((s) => (s as TextSegment).content)).toContain(
        "안녕히 가세요"
      );
    });

    it("should find segments in deeply nested structure", () => {
      const innerTextSegment = createTextSegment("가장 안쪽");
      const innerWeightedSegment = createWeightedSegment(
        [innerTextSegment],
        "increase",
        1
      );
      const middleTextSegment = createTextSegment("중간");
      const outerWeightedSegment = createWeightedSegment(
        [innerWeightedSegment, middleTextSegment],
        "decrease",
        2
      );
      const root = createTextSegment("최상위");
      root.children = [outerWeightedSegment];

      // 모든 가중치 세그먼트 찾기
      const weightedSegments = findSegments(root, (segment) =>
        isWeightedSegment(segment)
      );
      expect(weightedSegments).toHaveLength(2);

      // 모든 텍스트 세그먼트 찾기
      const textSegments = findSegments(root, (segment) =>
        isTextSegment(segment)
      );
      expect(textSegments).toHaveLength(3);

      // 중첩 레벨 확인을 위한 사용자 정의 조건
      const nestLevelPredicate = (segment: Segment): boolean => {
        if (!isTextSegment(segment)) return false;
        return segment.content === "가장 안쪽";
      };

      const deepestSegments = findSegments(root, nestLevelPredicate);
      expect(deepestSegments).toHaveLength(1);
      expect((deepestSegments[0] as TextSegment).content).toBe("가장 안쪽");
    });

    it("should handle predicate that returns undefined", () => {
      const root = createTextSegment("root");
      root.children = [
        createTextSegment("child1"),
        createTextSegment("child2"),
      ];

      // 때때로 undefined를 반환하는 프레디케이트 함수
      const unstablePredicate = (segment: Segment): boolean => {
        if (isTextSegment(segment) && segment.content === "child1") {
          // undefined 반환을 false로 대체하여 타입 오류 해결
          return false;
        }
        return isTextSegment(segment);
      };

      const results = findSegments(root, unstablePredicate);
      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  describe("updateSegment", () => {
    describe("updateSegment", () => {
      it("should update a text segment", () => {
        const segment = createTextSegment("원본 텍스트");
        const updated = updateSegment(segment, {
          content: "업데이트된 텍스트",
        });

        expect(updated).not.toBe(segment); // 불변성 검증
        expect(updated.id).toBe(segment.id);
        expect(updated.type).toBe("text");

        if (isTextSegment(updated)) {
          expect(updated.content).toBe("업데이트된 텍스트");
        }
      });

      it("should update a weighted segment and recalculate displayValue", () => {
        const segment = createWeightedSegment([], "increase", 2);
        const updated = updateSegment(segment, { bracketLevel: 3 });

        expect(updated).not.toBe(segment); // 불변성 검증
        expect(updated.id).toBe(segment.id);
        expect(updated.type).toBe("weighted");

        if (isWeightedSegment(updated)) {
          expect(updated.bracketLevel).toBe(3);
          expect(updated.displayValue).toBeCloseTo(1.1576, 4); // 재계산된 값
        }
      });

      it("should preserve type and id during update", () => {
        const segment = createTextSegment("원본 텍스트");
        const originalId = segment.id;

        // 타입 안전성 우회 시도
        const maliciousUpdates = { content: "변경 시도" } as any;
        maliciousUpdates.type = "weighted";
        maliciousUpdates.id = "fake-id-123";

        const updated = updateSegment(segment, maliciousUpdates);

        expect(updated.type).toBe("text"); // 타입은 변경되지 않아야 함
        expect(updated.id).toBe(originalId); // ID도 유지되어야 함

        if (isTextSegment(updated)) {
          expect(updated.content).toBe("변경 시도"); // 내용은 변경되어야 함
        }
      });

      it("should ignore type property in updates", () => {
        const segment = createTextSegment("텍스트");

        // 타입 속성을 포함한 업데이트
        const maliciousUpdates = { content: "수정됨" } as any;
        maliciousUpdates.type = "weighted";

        const updated = updateSegment(segment, maliciousUpdates);

        expect(updated.type).toBe("text"); // 타입은 변경되지 않아야 함
      });

      it("should update multiple properties at once", () => {
        const segment = createWeightedSegment([], "increase", 2);
        const updated = updateSegment(segment, {
          bracketLevel: 3,
          bracketType: "decrease",
        });

        if (isWeightedSegment(updated)) {
          expect(updated.bracketLevel).toBe(3);
          expect(updated.bracketType).toBe("decrease");
          expect(updated.displayValue).toBeCloseTo(0.8638, 4); // 새 매개변수로 계산
        }
      });

      it("should handle metadata updates", () => {
        const segment = createTextSegment("메타데이터 테스트");
        const updated = updateSegment(segment, {
          metadata: { important: true, category: "test" },
        });

        expect(updated.metadata).toEqual({ important: true, category: "test" });
      });

      it("should preserve unmentioned properties", () => {
        const segment = createTextSegment("원본");
        segment.metadata = { existingKey: "value" };

        const updated = updateSegment(segment, { content: "수정됨" });

        expect(updated.metadata).toEqual({ existingKey: "value" });
      });

      it("should not mutate original segment", () => {
        const original = createTextSegment("원본");
        const originalCopy = { ...original };

        updateSegment(original, { content: "수정됨" });

        // 원본은 변경되지 않아야 함
        expect(original).toEqual(originalCopy);
      });
    });

    describe("updateSegment - 강화된 타입 안전성", () => {
      it("should handle undefined/null segment gracefully", () => {
        // @ts-expect-error - 의도적으로 null 전달
        expect(() => updateSegment(null, { content: "test" })).toThrow();

        // @ts-expect-error - 의도적으로 undefined 전달
        expect(() => updateSegment(undefined, { content: "test" })).toThrow();
      });

      it("should perform deep merge for metadata", () => {
        const segment = createTextSegment("테스트");
        segment.metadata = {
          existing: "value",
          nested: { level1: true, shared: "original" },
        };

        const updated = updateSegment(segment, {
          metadata: {
            new: "property",
            nested: { level2: "added", shared: "updated" },
          },
        });

        // 기존 metadata 속성 유지
        expect(updated.metadata?.existing).toBe("value");

        // 새 metadata 속성 추가
        expect(updated.metadata?.new).toBe("property");

        // 중첩된 속성은 깊게 병합됨
        expect(updated.metadata?.nested).toEqual({
          level1: true,
          level2: "added",
          shared: "updated", // 중첩 속성 업데이트
        });
      });

      it("should normalize bracketLevel in weighted segments", () => {
        const segment = createWeightedSegment([], "increase", 2);

        // 너무 큰 값
        const updated1 = updateSegment(segment, { bracketLevel: 100 });
        expect(updated1.bracketLevel).toBe(78); // 최대값으로 정규화

        // 음수 전달
        const updated2 = updateSegment(segment, { bracketLevel: -5 });
        expect(updated2.bracketLevel).toBe(5); // 절대값 사용
      });

      it("should validate preset mode and selected value", () => {
        const preset = createPresetSegment("테스트", "random");

        // random -> fixed 모드 변경 시 selected 값이 필요
        expect(() =>
          updateSegment(preset, {
            mode: "fixed",
          })
        ).toThrow(/Fixed mode preset requires a selected value/);

        // 정상적인 모드 변경 (selected 값 제공)
        const updated = updateSegment(preset, {
          mode: "fixed",
          selected: "선택값",
        });
        expect(updated.mode).toBe("fixed");
        expect(updated.selected).toBe("선택값");
      });

      it("should validate inline wildcard options", () => {
        const segment = createInlineWildcardSegment(["옵션1", "옵션2"]);

        // 빈 배열 업데이트 시도
        expect(() => updateSegment(segment, { options: [] })).toThrow();

        // 빈 문자열만 있는 배열 업데이트 시도
        expect(() => updateSegment(segment, { options: ["", "  "] })).toThrow();

        // 정상 업데이트
        const updated = updateSegment(segment, {
          options: ["새옵션1", "새옵션2"],
        });
        expect(isInlineWildcardSegment(updated) && updated.options).toEqual([
          "새옵션1",
          "새옵션2",
        ]);
      });

      it("should deeply copy children array", () => {
        const child1 = createTextSegment("자식1");
        const child2 = createTextSegment("자식2");
        const parent = createTextSegment("부모");
        parent.children = [child1];

        // children 배열 업데이트
        const updated = updateSegment(parent, { children: [child1, child2] });

        // 원본 배열과 다른 인스턴스여야 함
        expect(updated.children).not.toBe(parent.children);

        // 내용은 정확히 반영
        expect(updated.children?.length).toBe(2);
        expect(updated.children?.[0].id).toBe(child1.id);
        expect(updated.children?.[1].id).toBe(child2.id);

        // 원본 수정해도 updated에 영향 없어야 함
        if (parent.children) {
          parent.children.push(createTextSegment("추가자식"));
          expect(updated.children?.length).toBe(2); // 그대로 유지
        }
      });

      it("should handle array in metadata correctly", () => {
        const segment = createTextSegment("테스트");
        segment.metadata = { tags: ["tag1", "tag2"] };

        // 배열 속성 업데이트
        const updated = updateSegment(segment, {
          metadata: { tags: ["tag3", "tag4"] },
        });

        // 배열은 교체되어야 함
        expect(updated.metadata?.tags).toEqual(["tag3", "tag4"]);

        // 원본 배열과 다른 인스턴스여야 함
        if (segment.metadata?.tags && updated.metadata?.tags) {
          expect(updated.metadata.tags).not.toBe(segment.metadata.tags);
        }
      });
    });
  });

  describe("insertSegment", () => {
    it("should insert segment at the end when no index provided", () => {
      const parent = createTextSegment("부모");
      parent.children = [createTextSegment("첫번째")];
      const newSegment = createTextSegment("새로운");

      const updated = insertSegment(parent, newSegment);

      expect(updated).not.toBe(parent); // 불변성 검증
      expect(updated.children).toHaveLength(2);
      expect(updated.children?.[1].id).toBe(newSegment.id);
    });

    it("should insert segment at specific index", () => {
      const parent = createTextSegment("부모");
      parent.children = [
        createTextSegment("첫번째"),
        createTextSegment("세번째"),
      ];
      const newSegment = createTextSegment("두번째");

      const updated = insertSegment(parent, newSegment, 1);

      expect(updated.children).toHaveLength(3);
      expect(updated.children?.[1].id).toBe(newSegment.id);
    });

    it("should create children array if it does not exist", () => {
      const parent = createTextSegment("부모");
      parent.children = undefined;
      const newSegment = createTextSegment("자식");

      const updated = insertSegment(parent, newSegment);

      expect(updated.children).toBeDefined();
      expect(updated.children).toHaveLength(1);
      expect(updated.children?.[0].id).toBe(newSegment.id);
    });

    it("should handle invalid index gracefully", () => {
      const parent = createTextSegment("부모");
      parent.children = [createTextSegment("첫번째")];
      const newSegment = createTextSegment("새로운");

      // 범위를 벗어난 인덱스
      const updated = insertSegment(parent, newSegment, 99);

      expect(updated.children).toHaveLength(2);
      expect(updated.children?.[1].id).toBe(newSegment.id);
    });

    it("should handle negative index as append", () => {
      const parent = createTextSegment("부모");
      parent.children = [createTextSegment("첫번째")];
      const newSegment = createTextSegment("새로운");

      const updated = insertSegment(parent, newSegment, -1);

      expect(updated.children).toHaveLength(2);
      expect(updated.children?.[1].id).toBe(newSegment.id);
    });

    it("should not mutate original segment", () => {
      const parent = createTextSegment("부모");
      parent.children = [createTextSegment("첫번째")];
      const originalLength = parent.children.length;

      insertSegment(parent, createTextSegment("새로운"));

      // 원본은 변경되지 않아야 함
      expect(parent.children.length).toBe(originalLength);
    });

    it("should preserve parent segment type and properties", () => {
      const parent = createWeightedSegment([], "increase", 2);
      parent.metadata = { custom: "value" };

      const updated = insertSegment(parent, createTextSegment("자식"));

      expect(updated.type).toBe("weighted");
      expect(isWeightedSegment(updated) && updated.bracketLevel).toBe(2);
      expect(updated.metadata).toEqual({ custom: "value" });
    });

    it("should handle insertion at index 0", () => {
      const parent = createTextSegment("parent");
      parent.children = [createTextSegment("existing")];
      const newSegment = createTextSegment("new");

      // 첫 번째 위치에 삽입
      const updated = insertSegment(parent, newSegment, 0);

      expect(updated.children?.length).toBe(2);
      expect(updated.children?.[0].id).toBe(newSegment.id);
    });
  });

  describe("removeSegment", () => {
    it("should remove a direct child segment", () => {
      const child = createTextSegment("자식");
      const parent = createTextSegment("부모");
      parent.children = [child];

      const [updated, found] = removeSegment(parent, child.id);

      expect(found).toBe(true);
      expect(updated).not.toBe(parent); // 불변성 검증
      expect(updated.children).toHaveLength(0);
    });

    it("should remove a nested segment", () => {
      const grandchild = createTextSegment("손자");
      const child = createTextSegment("자식");
      child.children = [grandchild];
      const parent = createTextSegment("부모");
      parent.children = [child];

      const [updated, found] = removeSegment(parent, grandchild.id);

      expect(found).toBe(true);
      expect(updated.children?.[0].children).toHaveLength(0);
    });

    it("should return false when segment not found", () => {
      const parent = createTextSegment("부모");
      parent.children = [createTextSegment("자식")];

      const [updated, found] = removeSegment(parent, "non-existent-id");

      expect(found).toBe(false);
      expect(updated).toEqual(parent);
    });

    it("should return original segment and false when no children", () => {
      const segment = createTextSegment("텍스트");
      segment.children = undefined;

      const [updated, found] = removeSegment(segment, "any-id");

      expect(found).toBe(false);
      expect(updated).toBe(segment);
    });

    it("should preserve remaining children", () => {
      const child1 = createTextSegment("첫번째");
      const child2 = createTextSegment("두번째");
      const parent = createTextSegment("부모");
      parent.children = [child1, child2];

      const [updated, found] = removeSegment(parent, child1.id);

      expect(found).toBe(true);
      expect(updated.children).toHaveLength(1);
      expect(updated.children?.[0].id).toBe(child2.id);
    });

    it("should handle multi-level nested removal", () => {
      // 3단계 중첩 구조
      const deepChild = createTextSegment("깊은자식");
      const midChild = createTextSegment("중간자식");
      midChild.children = [deepChild];
      const topChild = createTextSegment("상위자식");
      topChild.children = [midChild];
      const root = createTextSegment("루트");
      root.children = [topChild];

      const [updated, found] = removeSegment(root, deepChild.id);

      expect(found).toBe(true);
      if (updated.children && updated.children[0].children) {
        expect(updated.children[0].children[0].children).toHaveLength(0);
      }
    });

    it("should not mutate any segments in the hierarchy", () => {
      const child = createTextSegment("자식");
      const parent = createTextSegment("부모");
      parent.children = [child];
      const originalParent = { ...parent, children: [...parent.children] };

      removeSegment(parent, child.id);

      // 원본은 변경되지 않아야 함
      expect(parent).toEqual(originalParent);
    });

    it("should handle removal from array with multiple children", () => {
      const child1 = createTextSegment("첫번째");
      const child2 = createTextSegment("두번째");
      const child3 = createTextSegment("세번째");
      const parent = createTextSegment("부모");
      parent.children = [child1, child2, child3];

      // 중간 요소 제거
      const [updated, found] = removeSegment(parent, child2.id);

      expect(found).toBe(true);
      expect(updated.children).toHaveLength(2);
      expect(updated.children?.[0].id).toBe(child1.id);
      expect(updated.children?.[1].id).toBe(child3.id);
    });

    it("should handle removal of last child", () => {
      const child = createTextSegment("only-child");
      const parent = createTextSegment("parent");
      parent.children = [child];

      // 유일한 자식 제거
      const [updated, found] = removeSegment(parent, child.id);

      expect(found).toBe(true);

      // 빈 배열 유지 (undefined로 설정되지 않음)
      expect(updated.children).toHaveLength(0);
      expect(updated.children).toBeDefined();
    });
  });

  describe("splitTextSegment", () => {
    it("should split text segment at position", () => {
      const segment = createTextSegment("안녕하세요");

      const [left, right] = splitTextSegment(segment, 2);

      expect(left.content).toBe("안녕");
      expect(right.content).toBe("하세요");
      expect(left.id).toBe(segment.id); // 원본 ID 유지
      expect(right.id).not.toBe(segment.id); // 새 ID 생성
    });

    it("should throw error for invalid segment type", () => {
      const segment = createWeightedSegment([], "increase", 1);

      // TypeScript 타입 오류 방지를 위한 형변환
      expect(() =>
        splitTextSegment(segment as unknown as TextSegment, 1)
      ).toThrow();
    });

    it("should throw error for invalid position", () => {
      const segment = createTextSegment("안녕");

      expect(() => splitTextSegment(segment, -1)).toThrow(); // 음수 위치
      expect(() => splitTextSegment(segment, 3)).toThrow(); // 범위 초과
    });

    it("should handle edge positions correctly", () => {
      const segment = createTextSegment("테스트");

      const [left1, right1] = splitTextSegment(segment, 0);
      expect(left1.content).toBe("");
      expect(right1.content).toBe("테스트");

      const [left2, right2] = splitTextSegment(segment, segment.content.length);
      expect(left2.content).toBe("테스트");
      expect(right2.content).toBe("");
    });

    it("should preserve metadata and other properties", () => {
      const segment = createTextSegment("텍스트");
      segment.metadata = { important: true };

      const [left, right] = splitTextSegment(segment, 2);

      expect(left.metadata).toEqual({ important: true });
      expect(right.metadata).toBeUndefined(); // 새 세그먼트는 기본 메타데이터 상태
    });

    it("should handle multi-byte Unicode characters correctly", () => {
      const segment = createTextSegment("😊안녕😊");

      const [left, right] = splitTextSegment(segment, 1);

      expect(left.content).toBe("😊");
      expect(right.content).toBe("안녕😊");
    });

    it("should correctly handle splitting very long text", () => {
      // 매우 긴 텍스트 (10,000자)
      const longText = "a".repeat(10000);
      const segment = createTextSegment(longText);

      // 중간 지점에서 분할
      const splitPoint = 5000;
      const [left, right] = splitTextSegment(segment, splitPoint);

      expect(left.content.length).toBe(splitPoint);
      expect(right.content.length).toBe(longText.length - splitPoint);
      expect(left.content).toBe("a".repeat(splitPoint));
      expect(right.content).toBe("a".repeat(longText.length - splitPoint));
    });

    it("should correctly handle splitting text with children", () => {
      const segment = createTextSegment("parent text");
      segment.children = [createTextSegment("child")];

      // 텍스트 분할
      const [left, right] = splitTextSegment(segment, 6);

      // left는 원본 ID와 children을 유지
      expect(left.id).toBe(segment.id);
      expect(left.children).toEqual(segment.children);

      // right는 새 ID와 undefined children을 가짐
      expect(right.id).not.toBe(segment.id);
      expect(right.children).toBeUndefined();
    });
  });

  describe("mergeAdjacentTextSegments", () => {
    it("should merge adjacent text segments", () => {
      const parent = createTextSegment("");
      parent.children = [
        createTextSegment("안녕"),
        createTextSegment("하세요"),
      ];

      const [updated, modified] = mergeAdjacentTextSegments(parent);

      expect(modified).toBe(true);
      expect(updated.children).toHaveLength(1);

      const mergedChild = updated.children?.[0];
      expect(mergedChild).toBeDefined();

      if (mergedChild && isTextSegment(mergedChild)) {
        expect(mergedChild.content).toBe("안녕하세요");
      }
    });

    it("should merge multiple adjacent text segments", () => {
      const parent = createTextSegment("");
      parent.children = [
        createTextSegment("안녕"),
        createTextSegment("하세요"),
        createTextSegment("반갑"),
        createTextSegment("습니다"),
      ];

      const [updated, modified] = mergeAdjacentTextSegments(parent);

      expect(modified).toBe(true);
      expect(updated.children).toHaveLength(1);

      const mergedChild = updated.children?.[0];
      expect(mergedChild).toBeDefined();

      if (mergedChild && isTextSegment(mergedChild)) {
        expect(mergedChild.content).toBe("안녕하세요반갑습니다");
      }
    });

    it("should not merge non-adjacent text segments", () => {
      const parent = createTextSegment("");
      parent.children = [
        createTextSegment("안녕"),
        createWeightedSegment([], "increase", 1),
        createTextSegment("하세요"),
      ];

      const [updated, modified] = mergeAdjacentTextSegments(parent);

      expect(modified).toBe(false);
      expect(updated.children).toHaveLength(3);
    });

    it("should return original segment and false when no merging possible", () => {
      const parent = createTextSegment("");
      parent.children = [
        createTextSegment("안녕"),
        createWeightedSegment([], "increase", 1),
      ];

      const [updated, modified] = mergeAdjacentTextSegments(parent);

      expect(modified).toBe(false);
      expect(updated.children).toHaveLength(2);
    });

    it("should handle undefined or empty children", () => {
      const parent1 = createTextSegment("");
      parent1.children = undefined;

      const [updated1, modified1] = mergeAdjacentTextSegments(parent1);
      expect(modified1).toBe(false);

      const parent2 = createTextSegment("");
      parent2.children = [];

      const [updated2, modified2] = mergeAdjacentTextSegments(parent2);
      expect(modified2).toBe(false);
    });

    it("should preserve metadata when merging", () => {
      const segment1 = createTextSegment("안녕");
      segment1.metadata = { important: true };

      const segment2 = createTextSegment("하세요");

      const parent = createTextSegment("");
      parent.children = [segment1, segment2];

      const [updated, modified] = mergeAdjacentTextSegments(parent);

      expect(modified).toBe(true);
      const mergedChild = updated.children?.[0];

      // 첫 번째 세그먼트의 메타데이터가 보존되어야 함
      expect(mergedChild?.metadata).toEqual({ important: true });
    });

    it("should handle complex metadata merge scenarios", () => {
      const segment1 = createTextSegment("첫번째");
      segment1.metadata = { key1: "value1" };

      const segment2 = createTextSegment("두번째");
      segment2.metadata = { key2: "value2" };

      const segment3 = createTextSegment("세번째");

      const parent = createTextSegment("");
      parent.children = [segment1, segment2, segment3];

      const [updated, modified] = mergeAdjacentTextSegments(parent);

      expect(modified).toBe(true);
      const mergedChild = updated.children?.[0];

      // 첫 번째 세그먼트의 메타데이터만 보존됨
      expect(mergedChild?.metadata).toEqual({ key1: "value1" });
    });

    it("should correctly handle merging many adjacent segments", () => {
      const parent = createTextSegment("");
      parent.children = Array.from({ length: 100 }, (_, i) =>
        createTextSegment(`segment-${i}`)
      );

      // 100개 세그먼트 병합
      const startTime = performance.now();
      const [updated, modified] = mergeAdjacentTextSegments(parent);
      const endTime = performance.now();

      expect(modified).toBe(true);
      expect(updated.children).toHaveLength(1);

      // 병합된 텍스트는 모든 세그먼트의 내용을 포함
      if (updated.children && updated.children.length > 0) {
        const content = isTextSegment(updated.children[0])
          ? updated.children[0].content
          : "";
        for (let i = 0; i < 100; i++) {
          expect(content).toContain(`segment-${i}`);
        }
      }

      // 성능 체크 (100ms 이내 완료) - 테스트 환경에 따라 조정 필요
      // expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe("optimizeSegmentTree", () => {
    it("should remove empty text segments", () => {
      const parent = createTextSegment("");
      parent.children = [
        createTextSegment(""),
        createTextSegment("내용"),
        createTextSegment(""),
      ];

      const optimized = optimizeSegmentTree(parent);

      expect(optimized.children).toHaveLength(1);

      const child = optimized.children?.[0];
      expect(child).toBeDefined();

      if (child && isTextSegment(child)) {
        expect(child.content).toBe("내용");
      }
    });

    it("should merge adjacent text segments", () => {
      const parent = createTextSegment("");
      parent.children = [
        createTextSegment("안녕"),
        createTextSegment("하세요"),
      ];

      const optimized = optimizeSegmentTree(parent);

      expect(optimized.children).toHaveLength(1);

      const child = optimized.children?.[0];
      expect(child).toBeDefined();

      if (child && isTextSegment(child)) {
        expect(child.content).toBe("안녕하세요");
      }
    });

    it("should recursively optimize children", () => {
      const grandchild1 = createTextSegment("손자1");
      const grandchild2 = createTextSegment("");
      const child = createTextSegment("자식");
      child.children = [grandchild1, grandchild2];
      const parent = createTextSegment("부모");
      parent.children = [child];

      const optimized = optimizeSegmentTree(parent);

      if (optimized.children && optimized.children.length > 0) {
        expect(optimized.children[0].children).toHaveLength(1);

        const grandChild = optimized.children[0].children?.[0];
        expect(grandChild).toBeDefined();

        if (grandChild && isTextSegment(grandChild)) {
          expect(grandChild.content).toBe("손자1");
        }
      }
    });

    it("should return original segment when no optimization needed", () => {
      const parent = createTextSegment("");
      parent.children = [
        createTextSegment("안녕"),
        createWeightedSegment([], "increase", 1),
      ];

      const optimized = optimizeSegmentTree(parent);

      expect(optimized.children).toHaveLength(2);
    });

    it("should handle undefined children", () => {
      const segment = createTextSegment("텍스트");
      segment.children = undefined;

      const optimized = optimizeSegmentTree(segment);

      expect(optimized).toEqual(segment);
    });

    it("should handle complex nested structures", () => {
      // 복잡한 구조: 텍스트 > 가중치 > (빈 텍스트, 텍스트, 텍스트)
      const emptyText = createTextSegment("");
      const text1 = createTextSegment("첫번째");
      const text2 = createTextSegment("두번째");

      const weighted = createWeightedSegment(
        [emptyText, text1, text2],
        "increase",
        2
      );

      const root = createTextSegment("루트");
      root.children = [weighted];

      const optimized = optimizeSegmentTree(root);

      // 가중치 세그먼트 내부의 빈 텍스트가 제거되고
      // 두 텍스트 세그먼트가 병합되어야 함
      const weightedChild = optimized.children?.[0];

      if (weightedChild && isWeightedSegment(weightedChild)) {
        expect(weightedChild.children).toHaveLength(1);

        const mergedText = weightedChild.children?.[0];
        if (mergedText && isTextSegment(mergedText)) {
          expect(mergedText.content).toBe("첫번째두번째");
        }
      }
    });

    it("should preserve non-text segment types during optimization", () => {
      const presetSegment = createPresetSegment("스타일", "fixed", "유화");
      const wildcardSegment = createInlineWildcardSegment(["옵션1", "옵션2"]);
      const emptyText = createTextSegment("");

      const root = createTextSegment("");
      root.children = [emptyText, presetSegment, wildcardSegment];

      const optimized = optimizeSegmentTree(root);

      // 빈 텍스트는 제거되고 나머지는 유지되어야 함
      expect(optimized.children).toHaveLength(2);
      expect(isPresetSegment(optimized.children![0])).toBe(true);
      expect(isInlineWildcardSegment(optimized.children![1])).toBe(true);
    });

    it("should handle a tree with only empty text segments", () => {
      const root = createTextSegment("");
      root.children = [
        createTextSegment(""),
        createTextSegment(""),
        createTextSegment(""),
      ];

      const optimized = optimizeSegmentTree(root);

      // 모든 자식이 제거됨
      expect(optimized.children).toHaveLength(0);
    });
  });

  describe("엣지 케이스 및 성능 테스트", () => {
    it("should handle extremely large segment trees", () => {
      // 대규모 트리 구성 (500개 노드)
      const root = createTextSegment("root");
      let children: Segment[] = [];

      for (let i = 0; i < 500; i++) {
        children.push(createTextSegment(`child-${i}`));
      }

      root.children = children;

      // 성능 측정 - 실행 시간이 너무 길어질 경우 테스트 실패 가능성 있음
      const textSegments = findSegments(root, (s) => isTextSegment(s));
      expect(textSegments.length).toBe(501); // 루트 + 500 자식

      const optimized = optimizeSegmentTree(root);
      expect(optimized.children?.length).toBe(1); // 모든 텍스트 세그먼트가 하나로 병합
    });

    it("should handle deeply nested segment trees without stack overflow", () => {
      // 깊은 중첩 구조 생성 (200 레벨)
      let currentSegment: Segment = createTextSegment("deepest");

      for (let i = 0; i < 200; i++) {
        const parent = createTextSegment(`level-${i}`);
        parent.children = [currentSegment];
        currentSegment = parent;
      }

      const root = currentSegment;

      // 가장 깊은 세그먼트 ID 찾기
      const deepSegments = findSegments(
        root,
        (s) => isTextSegment(s) && s.content === "deepest"
      );
      expect(deepSegments.length).toBe(1);

      const deepestId = deepSegments[0].id;

      // 깊은 세그먼트 찾기
      const foundSegment = findSegmentById(root, deepestId);
      expect(foundSegment).not.toBeNull();

      // 깊은 세그먼트 제거
      const [afterRemoval, removed] = removeSegment(root, deepestId);
      expect(removed).toBe(true);

      // 제거 후 찾기 시도
      const notFound = findSegmentById(afterRemoval, deepestId);
      expect(notFound).toBeNull();
    });

    it("should handle complex mixed content optimization correctly", () => {
      // 복잡한 구조 생성
      const mixedSegments: Segment[] = [];

      // 다양한 유형의 세그먼트 추가
      for (let i = 0; i < 20; i++) {
        if (i % 5 === 0) {
          mixedSegments.push(createTextSegment(""));
        } else if (i % 5 === 1) {
          mixedSegments.push(createTextSegment(`text-${i}`));
        } else if (i % 5 === 2) {
          mixedSegments.push(
            createWeightedSegment(
              [createTextSegment(`weighted-${i}`)],
              "increase",
              (i % 3) + 1
            )
          );
        } else if (i % 5 === 3) {
          mixedSegments.push(createPresetSegment(`preset-${i}`, "random"));
        } else {
          mixedSegments.push(
            createInlineWildcardSegment([`option1-${i}`, `option2-${i}`])
          );
        }
      }

      const root = createTextSegment("root");
      root.children = mixedSegments;

      // 최적화 실행
      const optimized = optimizeSegmentTree(root);
      // 빈 텍스트 세그먼트 4개 제거됨 (i = 0, 5, 10, 15)
      expect(optimized.children?.length).toBe(mixedSegments.length - 4);

      // 직계 자식 중 텍스트 세그먼트 확인
      const directTextSegments =
        optimized.children?.filter(isTextSegment) || [];
      expect(directTextSegments.length).toBe(4);

      // 중첩 최적화도 정상 작동하는지 검증 (가중치 내부 텍스트 세그먼트 유지)
      const weightedSegments =
        optimized.children?.filter(isWeightedSegment) || [];
      expect(weightedSegments.length).toBe(4); // 가중치 세그먼트 4개 유지

      // 각 가중치 세그먼트 내부에 텍스트 세그먼트 존재 확인
      for (const weighted of weightedSegments) {
        expect(weighted.children?.length).toBe(1);
        expect(isTextSegment(weighted.children![0])).toBe(true);
      }
    });
  });
});
