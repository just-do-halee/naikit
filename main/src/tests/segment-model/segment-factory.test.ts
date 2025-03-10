import { describe, it, expect, vi } from 'vitest';
import { 
  createTextSegment, 
  createWeightedSegment, 
  createPresetSegment, 
  createInlineWildcardSegment,
  calculateDisplayValue
} from '../../modules/segment-model/segment-factory';
import { 
  BracketType, 
  isTextSegment, 
  isWeightedSegment
} from '../../modules/segment-model/types';

describe('세그먼트 팩토리', () => {
  describe('calculateDisplayValue', () => {
    it('should calculate correct weight value for increase', () => {
      const value = calculateDisplayValue(2, 'increase');
      expect(value).toBeCloseTo(1.1025, 4);
    });
    
    it('should calculate correct weight value for decrease', () => {
      const value = calculateDisplayValue(2, 'decrease');
      expect(value).toBeCloseTo(0.9070, 4);
    });
    
    it('should return 1.0 for level 0', () => {
      expect(calculateDisplayValue(0, 'increase')).toBe(1.0);
      expect(calculateDisplayValue(0, 'decrease')).toBe(1.0);
    });
    
    it('should handle high bracket levels', () => {
      const maxLevel = 78;
      expect(calculateDisplayValue(maxLevel, 'increase')).toBeGreaterThan(40);
      expect(calculateDisplayValue(maxLevel, 'decrease')).toBeLessThan(0.03);
    });
    
    it('should memoize results for performance', () => {
      // 동일한 인자로 두 번 호출
      const firstCall = calculateDisplayValue(3, 'increase');
      const secondCall = calculateDisplayValue(3, 'increase');
      
      // 두 결과가 정확히 같은 객체 참조인지 확인
      expect(firstCall).toBe(secondCall);
    });
  });
  
  describe('createTextSegment', () => {
    it('should create text segment with correct properties', () => {
      const segment = createTextSegment('테스트 내용');
      
      expect(segment).toMatchObject({
        type: 'text',
        content: '테스트 내용'
      });
      expect(segment.id).toBeDefined();
      expect(typeof segment.id).toBe('string');
    });
    
    it('should create empty text segment when empty content provided', () => {
      const segment = createTextSegment('');
      
      expect(segment).toMatchObject({
        type: 'text',
        content: ''
      });
    });
    
    it('should throw error when content is undefined', () => {
      expect(() => createTextSegment(undefined as any)).toThrow();
    });
  });
  
  describe('createWeightedSegment', () => {
    it('should create weighted segment with correct properties', () => {
      const children = [createTextSegment('테스트')];
      const segment = createWeightedSegment(children, 'increase', 2);
      
      expect(segment).toMatchObject({
        type: 'weighted',
        bracketType: 'increase',
        bracketLevel: 2
      });
      expect(segment.displayValue).toBeCloseTo(1.1025, 4);
      expect(segment.children).toHaveLength(1);
      
      const childSegment = segment.children?.[0];
      expect(childSegment).toBeDefined();
      
      if (childSegment && isTextSegment(childSegment)) {
        expect(childSegment.content).toBe('테스트');
      }
    });
    
    it('should throw error for negative bracket level', () => {
      const children = [createTextSegment('테스트')];
      expect(() => createWeightedSegment(children, 'increase', -1)).toThrow();
    });
    
    it('should throw error for bracket level exceeding maximum', () => {
      const children = [createTextSegment('테스트')];
      expect(() => createWeightedSegment(children, 'increase', 79)).toThrow();
    });
    
    it('should create a deep copy of children', () => {
      const child = createTextSegment('테스트');
      const segment = createWeightedSegment([child], 'increase', 1);
      
      // 자식 세그먼트가 같은 내용이지만 다른 참조를 가지는지 확인
      const childSegment = segment.children?.[0];
      expect(childSegment).toBeDefined();
      
      if (childSegment && isTextSegment(childSegment)) {
        expect(childSegment.content).toBe(child.content);
        expect(childSegment).not.toBe(child);
      }
    });
  });
  
  describe('createPresetSegment', () => {
    it('should create preset segment in random mode', () => {
      const segment = createPresetSegment('계절', 'random');
      
      expect(segment).toMatchObject({
        type: 'preset',
        name: '계절',
        mode: 'random'
      });
      expect(segment.metadata?.color).toBe('#8E6FD8');
    });
    
    it('should create preset segment in fixed mode', () => {
      const segment = createPresetSegment('스타일', 'fixed', '유화');
      
      expect(segment).toMatchObject({
        type: 'preset',
        name: '스타일',
        mode: 'fixed',
        selected: '유화'
      });
      expect(segment.metadata?.color).toBe('#4A9F8E');
    });
    
    it('should store values in metadata when provided', () => {
      const values = ['봄', '여름', '가을', '겨울'];
      const segment = createPresetSegment('계절', 'random', undefined, values);
      
      expect(segment.metadata?.values).toEqual(values);
    });
    
    it('should throw error when name is missing', () => {
      expect(() => createPresetSegment(undefined as any, 'random')).toThrow();
    });
    
    it('should warn but not throw when fixed mode has no selected value', () => {
      // 콘솔 경고 모니터링
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const segment = createPresetSegment('스타일', 'fixed');
      
      expect(segment.mode).toBe('fixed');
      expect(segment.selected).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('createInlineWildcardSegment', () => {
    it('should create inline wildcard segment with options', () => {
      const options = ['빨간', '파란', '노란'];
      const segment = createInlineWildcardSegment(options);
      
      expect(segment).toMatchObject({
        type: 'inline_wildcard',
        options
      });
      expect(segment.metadata?.color).toBe('#8E6FD8');
    });
    
    it('should create a deep copy of options array', () => {
      const options = ['빨간', '파란', '노란'];
      const segment = createInlineWildcardSegment(options);
      
      expect(segment.options).toEqual(options);
      expect(segment.options).not.toBe(options);
    });
    
    it('should throw error for empty options array', () => {
      expect(() => createInlineWildcardSegment([])).toThrow();
    });
    
    it('should throw error for invalid options', () => {
      expect(() => createInlineWildcardSegment(null as any)).toThrow();
    });
  });
});
