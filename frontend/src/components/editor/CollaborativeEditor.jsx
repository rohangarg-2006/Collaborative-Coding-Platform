import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Editor from '@monaco-editor/react';
import UserCursor from './UserCursor';

const CollaborativeEditor = ({ 
  code, 
  setCode, 
  language, 
  theme, 
  editorRef,
  cursorPositions = {},
  currentUser,
  onCursorPositionChange
}) => {
  const containerRef = useRef(null);
  
  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    // Set editor reference for parent components
    editorRef.current = editor;
    
    // Set cursor position change listener
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorPositionChange) {
        onCursorPositionChange(e.position);
      }
    });
    
    // Focus the editor
    editor.focus();
  };
  
  // Calculate cursor position in viewport coordinates
  const getCursorCoordinates = (position) => {
    if (!editorRef.current || !position) return null;
    
    try {
      // Get Monaco's rendering coordinates for the position
      const coordinates = editorRef.current.getScrolledVisiblePosition(position);
      
      if (!coordinates) return null;

      // Get the editor's DOM container
      const editorDom = editorRef.current.getDomNode();
      if (!editorDom) return null;

      // Get the editor's bounding rectangle to account for its position in the page
      const editorRect = editorDom.getBoundingClientRect();
      
      // Get the viewport/scroll container within the editor
      const viewportElement = editorDom.querySelector('.overflow-guard');
      let viewportOffset = { top: 0, left: 0 };
      
      if (viewportElement) {
        const viewportRect = viewportElement.getBoundingClientRect();
        const editorContentRect = editorDom.getBoundingClientRect();
        viewportOffset = {
          top: viewportRect.top - editorContentRect.top,
          left: viewportRect.left - editorContentRect.left
        };
      }

      // Calculate absolute position accounting for editor position
      // This converts viewport-relative coordinates to page-absolute coordinates
      const absoluteLeft = editorRect.left + viewportOffset.left + coordinates.left;
      const absoluteTop = editorRect.top + viewportOffset.top + coordinates.top;

      return {
        left: absoluteLeft,
        top: absoluteTop,
        height: 20 // Standard cursor height
      };
    } catch (error) {
      return null;
    }
  };
  
  // Build the cursor elements to render via portal
  const cursorElements = Object.values(cursorPositions)
    .filter((cursorData) => cursorData.user.id !== currentUser?.id)
    .map((cursorData) => {
      const position = getCursorCoordinates(cursorData.position);
      if (!position) return null;
      
      return (
        <UserCursor 
          key={cursorData.user.id} 
          user={cursorData.user} 
          position={position}
        />
      );
    })
    .filter(Boolean);
  
  return (
    <>
      <div ref={containerRef} className="relative h-full w-full">
        <Editor
          height="100%"
          width="100%"
          language={language}
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          value={code}
          onChange={setCode}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            renderWhitespace: 'selection',
            renderLineHighlight: 'all',
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            }
          }}
        />
      </div>
      
      {/* Render other users' cursors via portal at document root level */}
      {cursorElements.length > 0 && createPortal(
        <>{cursorElements}</>,
        document.body
      )}
    </>
  );
};

export default CollaborativeEditor;
