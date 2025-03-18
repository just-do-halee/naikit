import { Editor } from '@tiptap/core';

// Custom command types
interface WeightedOptions {
  weight: number;
  bracketType: 'curly' | 'square';
}

interface PresetOptions {
  presetName: string;
  presetType: 'wildcard' | 'keyword';
  keywordValue?: string;
}

interface InlineWildcardOptions {
  options: string[];
}

// Command to create a weighted segment
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    weighted: {
      /**
       * Set a weighted segment
       */
      setWeightedSegment: (options: WeightedOptions) => ReturnType;
    };
    preset: {
      /**
       * Set a preset segment
       */
      setPresetSegment: (options: PresetOptions) => ReturnType;
    };
    inlineWildcard: {
      /**
       * Set an inline wildcard
       */
      setInlineWildcard: (options: InlineWildcardOptions) => ReturnType;
    };
  }
}

// Command for weighted segment
export function createWeightedSegment(editor: Editor, options: WeightedOptions): boolean {
  const { weight = 1.1, bracketType = 'curly' } = options;
  const { state, view } = editor;
  
  // Get current selection
  const { from, to } = state.selection;
  if (from === to) {
    return false; // No selection, can't create weighted segment
  }

  // Get the selected text
  const selectedText = state.doc.textBetween(from, to);
  
  // Get the correct bracket symbols
  const [openBracket, closeBracket] = bracketType === 'curly' ? ['{', '}'] : ['[', ']'];
  
  // Calculate number of brackets based on weight
  const bracketCount = Math.max(1, Math.floor(Math.abs(weight - 1) * 10));
  
  // Create opening and closing brackets
  const openBrackets = openBracket.repeat(bracketCount);
  const closeBrackets = closeBracket.repeat(bracketCount);
  
  // Create transaction to replace the selection with the bracketed text
  const tr = state.tr.replaceSelectionWith(
    state.schema.text(openBrackets + selectedText + closeBrackets)
  );
  
  // Dispatch transaction
  view.dispatch(tr);
  
  return true;
}

// Command for preset segment
export function createPresetSegment(editor: Editor, options: PresetOptions): boolean {
  const { presetName, presetType, keywordValue } = options;
  const { state, view } = editor;

  // Format the text based on preset type
  let text = '';
  if (presetType === 'wildcard') {
    text = `!${presetName}`;
  } else if (presetType === 'keyword') {
    text = `${presetName}:${keywordValue || ''}`;
  }
  
  // Create transaction to insert text
  const tr = state.tr.insertText(text);
  
  // Dispatch transaction
  view.dispatch(tr);
  
  return true;
}

// Command for inline wildcard
export function createInlineWildcard(editor: Editor, options: InlineWildcardOptions): boolean {
  const { options: wildcardOptions } = options;
  const { state, view } = editor;

  if (wildcardOptions.length > 0) {
    // Format the options with pipe separators
    const text = `(${wildcardOptions.join('|')})`;
    
    // Create transaction to insert text
    const tr = state.tr.insertText(text);
    
    // Dispatch transaction
    view.dispatch(tr);
    
    return true;
  }
  
  return false;
}

// Add commands to the editor
export const addCustomCommands = (editor: Editor): void => {
  // Define setWeightedSegment command
  editor.commands.setWeightedSegment = (options: WeightedOptions) => {
    return createWeightedSegment(editor, options);
  };

  // Define setPresetSegment command
  editor.commands.setPresetSegment = (options: PresetOptions) => {
    return createPresetSegment(editor, options);
  };

  // Define setInlineWildcard command
  editor.commands.setInlineWildcard = (options: InlineWildcardOptions) => {
    return createInlineWildcard(editor, options);
  };
};