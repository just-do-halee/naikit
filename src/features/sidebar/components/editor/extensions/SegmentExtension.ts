import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { addCustomCommands } from './commands';
import { parseNovelAIPrompt } from '../../../../../core/compiler';

// Custom extension to handle segment-specific behavior
export const SegmentExtension = Extension.create({
  name: 'segmentExtension',

  // Add commands to the editor
  addCommands() {
    return {
      // These are placeholder implementions - the actual implementations
      // are added in addProseMirrorPlugins via addCustomCommands
      setWeightedSegment: () => () => false,
      setPresetSegment: () => () => false,
      setInlineWildcard: () => () => false,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('segmentExtension'),
        view: (editorView) => {
          // Add the custom commands to the editor
          const editor = (editorView as any).editor;
          if (editor) {
            addCustomCommands(editor);
          }
          return {};
        },
        props: {
          // Custom handling for pasted content
          handlePaste: (_editorView, event) => {
            const text = event.clipboardData?.getData('text/plain');
            if (!text) return false;

            // Try to parse the text as NovelAI prompt syntax
            try {
              // This is just to test if it parses - we'll let the normal paste
              // handler actually add the text
              parseNovelAIPrompt(text);
            } catch (error) {
              console.error('Error parsing pasted text:', error);
            }
            
            return false; // Let the default paste handler handle it
          },

          // Custom handling for key events
          handleKeyDown: (editorView, event) => {
            const editor = (editorView as any).editor;
            if (!editor) return false;

            // Special handling for segment-specific keyboard shortcuts
            // For example, { and } for weighted segments
            if (event.key === '{') {
              // Check if there's selected text to wrap
              const { from, to } = editor.state.selection;
              if (from !== to) {
                // Apply weighted segment with curly braces (increase weight)
                editor.commands.setWeightedSegment({ 
                  weight: 1.1, 
                  bracketType: 'increase' 
                });
                return true;
              }
            } 
            
            if (event.key === '[') {
              // Check if there's selected text to wrap
              const { from, to } = editor.state.selection;
              if (from !== to) {
                // Apply weighted segment with square braces (decrease weight)
                editor.commands.setWeightedSegment({ 
                  weight: 0.9, 
                  bracketType: 'decrease' 
                });
                return true;
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});