import { Node, mergeAttributes } from '@tiptap/core';

// Custom node for weighted segments
export const WeightedSegmentNode = Node.create({
  name: 'weightedSegment',
  
  group: 'inline',
  
  inline: true,
  
  atom: true, // Treat as an atomic unit
  
  selectable: true,
  
  draggable: true,
  
  defining: true,
  
  content: 'inline*',
  
  addAttributes() {
    return {
      id: {
        default: null,
      },
      weight: {
        default: 1.1, // Default weight
      },
      bracketType: {
        default: 'curly', // 'curly' for {} or 'square' for []
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span[data-weighted-segment]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const { weight, bracketType } = HTMLAttributes;
    
    // Apply different styles based on the weight and bracket type
    const style = `
      display: inline-block;
      border-radius: 4px;
      position: relative;
      ${bracketType === 'curly' 
        ? 'background-color: rgba(59, 130, 246, 0.15);'
        : 'background-color: rgba(239, 68, 68, 0.15);'
      }
      ${weight > 1
        ? 'border-bottom: 2px solid #3b82f6;'
        : weight < 1
          ? 'border-bottom: 2px solid #ef4444;'
          : ''
      }
      padding: 0 2px;
      margin: 0 1px;
    `;
    
    // Generate attributes including the custom style
    const attrs = mergeAttributes(HTMLAttributes, {
      'data-weighted-segment': '',
      'data-weight': weight,
      'data-bracket-type': bracketType,
      style,
    });
    
    // Return the HTML representation
    return ['span', attrs, 0];
  },
});