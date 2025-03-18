import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useSegmentState, useSegmentActions, useSelectedIds, usePresets } from '../../../../state/segment-react-bindings';
import { compileSegmentTree, parseNovelAIPrompt } from '../../../../core/compiler';
import { SegmentExtension, WeightedSegmentNode, PresetSegmentNode, InlineWildcardNode } from './extensions';
import EditorToolbar from './EditorToolbar';
import '../../../../styles/editor.css';
import { Segment } from '@/core/segment-model/types';

// Helper function to safely compile segment tree - fixes typechecking issues
const safeCompileSegmentTree = (segments: unknown): string => {
  if (Array.isArray(segments) && segments.length > 0) {
    // For arrays, we need to handle each segment separately and join the results
    // This works around the type mismatch between Segment[] and Segment
    return segments
      .map(segment => {
        try {
          return compileSegmentTree(segment as Segment);
        } catch (e) {
          console.error('Error compiling segment:', e);
          return '';
        }
      })
      .join('');
  }
  return '';
};

// Add an interface declaration to extend Editor
declare module '@tiptap/core' {
  interface Editor {
    isUpdating?: boolean;
  }
}

interface PromptEditorProps {
  segmentId: string;
  placeholder?: string;
  readOnly?: boolean;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  segmentId,
  placeholder = 'Type your prompt here...',
  readOnly = false
}) => {
  const segmentState = useSegmentState();
  const segment = segmentState?.segments?.[segmentId] as Segment | undefined;
  const { updateChildSegments } = useSegmentActions();
  const selectedIds = useSelectedIds();
  const mode = segmentState?.activeMode || 'compose';
  const presets = usePresets();
  const isInitialRenderRef = useRef(true);

  // Handle conversion from editor content to segments
  const handleContentUpdate = useCallback((editorContent: string) => {
    console.log("[PromptEditor] handleContentUpdate called with content:", editorContent);
    
    if (!segment) {
      console.warn("[PromptEditor] Cannot update segment: no segment available");
      return;
    }
    
    if (!segmentId) {
      console.warn("[PromptEditor] Cannot update segment: no segmentId available");
      return;
    }
    
    // Parse the editor content into segments
    try {
      console.log("[PromptEditor] Parsing content into segments");
      const parsedSegments = parseNovelAIPrompt(editorContent);
      console.log("[PromptEditor] Parsed segments:", parsedSegments);
      
      // Update the segment's children with the parsed segments
      if (Array.isArray(parsedSegments)) {
        console.log("[PromptEditor] Updating child segments for:", segmentId);
        updateChildSegments(segmentId, parsedSegments);
        console.log("[PromptEditor] Child segments updated");
      } else {
        console.warn("[PromptEditor] Parsed segments is not an array:", parsedSegments);
      }
    } catch (error) {
      console.error('[PromptEditor] Error parsing editor content:', error);
    }
  }, [segment, segmentId, updateChildSegments]);

  // Initialize the editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure starter kit to exclude features we don't need
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        hardBreak: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      SegmentExtension,
      WeightedSegmentNode,
      PresetSegmentNode,
      InlineWildcardNode,
    ],
    content: '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // Skip updates if the editor is handling a programmatic change
      if (editor.isUpdating) return;
      
      // Get the text content from the editor
      const editorContent = editor.getText();
      
      // Update segments based on content
      handleContentUpdate(editorContent);
    },
  });

  // Update editor content when segment changes
  useEffect(() => {
    console.log("[PromptEditor] useEffect triggered with segment:", segment);
    if (!editor) {
      console.log("[PromptEditor] Editor not available yet");
      return;
    }
    
    if (!segment) {
      console.log("[PromptEditor] No segment available");
      // If no segment, set empty content
      editor.isUpdating = true;
      editor.commands.setContent('');
      setTimeout(() => {
        if (editor) editor.isUpdating = false;
      }, 0);
      return;
    }

    // Handle initial render
    if (isInitialRenderRef.current) {
      console.log("[PromptEditor] Initial render with segment:", segment);
      isInitialRenderRef.current = false;
      
      // Compile the segment tree to text for initial display
      let content = '';
      console.log("[PromptEditor] Segment children:", segment.children);
      if (segment.children && Array.isArray(segment.children) && segment.children.length > 0) {
        content = safeCompileSegmentTree(segment.children);
        console.log("[PromptEditor] Compiled content:", content);
      }
      
      // Only update if content has changed
      if (editor.getText() !== content) {
        console.log("[PromptEditor] Updating editor content");
        editor.isUpdating = true;
        editor.commands.setContent(content);
        
        // Clear the updating flag after a short delay
        setTimeout(() => {
          if (editor) editor.isUpdating = false;
        }, 0);
      }
      
      return;
    }

    // Only update if the editor doesn't have focus to prevent cursor jumping
    if (!editor.isFocused) {
      console.log("[PromptEditor] Updating while editor not focused");
      // Set a flag to avoid triggering the onUpdate handler for our own changes
      editor.isUpdating = true;
      
      // Compile the segment tree to text
      let content = '';
      console.log("[PromptEditor] Update - segment children:", segment.children);
      if (segment.children && Array.isArray(segment.children) && segment.children.length > 0) {
        content = safeCompileSegmentTree(segment.children);
        console.log("[PromptEditor] Update - compiled content:", content);
      }
      
      // Only update if content has changed
      if (editor.getText() !== content) {
        console.log("[PromptEditor] Update - content changed, updating editor");
        editor.commands.setContent(content);
      } else {
        console.log("[PromptEditor] Update - content unchanged, skipping update");
      }
      
      // Clear the updating flag after a short delay
      setTimeout(() => {
        if (editor) {
          editor.isUpdating = false;
          console.log("[PromptEditor] Update - cleared updating flag");
        }
      }, 0);
    } else {
      console.log("[PromptEditor] Editor has focus, skipping external update");
    }
  }, [editor, segment]);

  // Update editor mode based on app mode
  useEffect(() => {
    if (editor) {
      // In compose mode, the editor is fully editable
      // In fine-tune mode, we'd limit editing to specific operations
      editor.setEditable(!readOnly && mode === 'compose');
    }
  }, [editor, mode, readOnly]);

  // Update selection in editor when selection changes in app state
  useEffect(() => {
    if (editor && segment && selectedIds && selectedIds.length > 0) {
      // Find the selected nodes in the editor and apply selection styling
      // This would be more complex in a full implementation
      
      // For now, we'll just add a CSS class to the editor that can style selected elements
      const editorElement = editor.view.dom;
      editorElement.classList.toggle('has-selections', selectedIds.length > 0);
      
      // We'd add more sophisticated selection handling here
    }
  }, [editor, segment, selectedIds]);

  // Helper to create a weighted segment
  const createWeightedSegment = useCallback(() => {
    if (editor) {
      const { from, to } = editor.state.selection;
      
      // Only create a weighted segment if there's a selection
      if (from !== to) {
        // Use the command from our extension
        editor.commands.setWeightedSegment({ 
          weight: 1.1, 
          bracketType: 'curly' 
        });
      }
    }
  }, [editor]);

  // Helper to create a preset segment
  const createPresetSegment = useCallback((presetName: string, presetType: 'wildcard' | 'keyword', keywordValue?: string) => {
    if (editor) {
      // Use the command from our extension
      editor.commands.setPresetSegment({ 
        presetName, 
        presetType, 
        keywordValue 
      });
    }
  }, [editor]);

  // Helper to create an inline wildcard
  const createInlineWildcard = useCallback((options: string[]) => {
    if (editor) {
      // Use the command from our extension
      editor.commands.setInlineWildcard({ options });
    }
  }, [editor]);

  return (
    <div className="prompt-editor flex flex-col border border-gray-200 rounded-md overflow-hidden">
      <EditorToolbar 
        editor={editor} 
        onCreateWeightedSegment={createWeightedSegment}
        onCreatePresetSegment={createPresetSegment}
        onCreateInlineWildcard={createInlineWildcard}
        presets={presets}
        selectedSegmentIds={selectedIds || []}
      />
      <EditorContent 
        editor={editor} 
        className="editor-content p-4 min-h-32 bg-white text-black" 
      />
    </div>
  );
};

export default PromptEditor;