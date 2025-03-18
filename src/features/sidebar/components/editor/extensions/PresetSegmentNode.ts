import { Node, mergeAttributes } from '@tiptap/core';

// Custom node for preset segments (wildcards and keywords)
export const PresetSegmentNode = Node.create({
  name: 'presetSegment',
  
  group: 'inline',
  
  inline: true,
  
  atom: true, // Treat as an atomic unit
  
  selectable: true,
  
  draggable: true,
  
  defining: true,
  
  addAttributes() {
    return {
      id: {
        default: null,
      },
      presetName: {
        default: '',
      },
      presetType: {
        default: 'wildcard', // 'wildcard' or 'keyword'
      },
      keywordValue: {
        default: null, // Only used for keywords
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span[data-preset-segment]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const { presetName, presetType, keywordValue } = HTMLAttributes;
    
    // Apply different styles based on the preset type
    const style = `
      display: inline-block;
      border-radius: 4px;
      position: relative;
      ${presetType === 'wildcard' 
        ? 'background-color: rgba(124, 58, 237, 0.15); color: #7c3aed;'
        : 'background-color: rgba(16, 185, 129, 0.15); color: #10b981;'
      }
      font-weight: 500;
      padding: 0 4px;
      margin: 0 1px;
    `;
    
    // Generate display text
    const displayText = presetType === 'wildcard' 
      ? `!${presetName}`
      : `${presetName}:${keywordValue}`;
    
    // Generate attributes including the custom style
    const attrs = mergeAttributes(HTMLAttributes, {
      'data-preset-segment': '',
      'data-preset-name': presetName,
      'data-preset-type': presetType,
      'data-keyword-value': keywordValue || '',
      style,
    });
    
    // Return the HTML representation
    return ['span', attrs, displayText];
  },
});