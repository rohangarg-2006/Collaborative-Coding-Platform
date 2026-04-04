import React, { useRef, useEffect } from 'react';
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
      // Convert position to viewport coordinates
      const coordinates = editorRef.current.getScrolledVisiblePosition(position);
      
      if (!coordinates) return null;
      
      return {
        left: coordinates.left,
        top: coordinates.top
      };
    } catch (error) {
      return null;
    }
  };
  
  return (
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
      
      {/* Render other users' cursors */}
      {Object.values(cursorPositions).map((cursorData) => {
        if (cursorData.user.id === currentUser?.id) return null;
        
        const position = getCursorCoordinates(cursorData.position);
        if (!position) return null;
        
        return (
          <UserCursor 
            key={cursorData.user.id} 
            user={cursorData.user} 
            position={position}
          />
        );
      })}
    </div>
  );
};

export default CollaborativeEditor;
