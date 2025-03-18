import { Node, mergeAttributes } from '@tiptap/core';

// Custom node for inline wildcard segments
export const InlineWildcardNode = Node.create({
  name: 'inlineWildcard',
  
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
      options: {
        default: [], // Array of options
      },
      selectedIndex: {
        default: 0, // Currently selected option index
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span[data-inline-wildcard]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const { options, selectedIndex } = HTMLAttributes;
    
    // Parse options if they're passed as a string
    let optionsArray = options;
    if (typeof options === 'string') {
      try {
        optionsArray = JSON.parse(options);
      } catch (e) {
        optionsArray = [];
      }
    }
    
    // Get the selected option or default
    const selected = Array.isArray(optionsArray) && optionsArray.length > 0
      ? optionsArray[selectedIndex || 0]
      : 'option';
    
    // Apply styles
    const style = `
      display: inline-block;
      border-radius: 4px;
      position: relative;
      background-color: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      font-weight: 500;
      padding: 0 4px;
      margin: 0 1px;
      border-bottom: 1px dashed #f59e0b;
      cursor: pointer;
    `;
    
    // Generate options string for display
    const optionsStr = Array.isArray(optionsArray) ? optionsArray.join('|') : '';
    
    // Generate attributes including the custom style
    const attrs = mergeAttributes(HTMLAttributes, {
      'data-inline-wildcard': '',
      'data-options': JSON.stringify(optionsArray),
      'data-selected-index': selectedIndex || 0,
      'title': `Options: ${optionsStr}`,
      style,
    });
    
    // Return the HTML representation
    return ['span', attrs, selected];
  },
});