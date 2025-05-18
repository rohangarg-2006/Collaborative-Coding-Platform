/**
 * Updated version of updateDiagnostics function for EditorPage.jsx
 * 
 * This version is more aware of language transitions and avoids
 * showing unnecessary errors during language switches.
 */

// Function to apply diagnostics to the editor
const updateDiagnostics = () => {
  if (!window.monaco || !editorRef.current) return;
  
  // Skip diagnostic updates during language transitions to prevent flickering
  if (isLanguageTransitionInProgress()) {
    console.log(`Skipping diagnostics during language transition`);
    return;
  }
  
  console.log(`Updating diagnostics for ${language}, showErrors=${showErrors}`);
  
  // Apply diagnostics using our utility function only if not in transition
  applyDiagnostics(editorRef.current, window.monaco, code, language, showErrors);
  
  // Refresh the editor to ensure error decorations are properly applied
  setTimeout(() => {
    if (editorRef.current) {
      // Skip updating UI if we're in the middle of a transition
      if (isLanguageTransitionInProgress()) return;
      
      // Force a render of the editor
      editorRef.current.render();
      
      // Don't steal focus during language transitions
      if (!isLanguageTransitionInProgress()) {
        editorRef.current.focus();
      }
      
      // Apply language-specific CSS class to ensure proper styling
      const editorDom = editorRef.current.getDomNode();
      if (editorDom) {
        const monacoEditor = editorDom.closest('.monaco-editor');
        if (monacoEditor) {
          // Remove existing language classes
          monacoEditor.classList.forEach(cls => {
            if (cls.startsWith('language-')) {
              monacoEditor.classList.remove(cls);
            }
          });
          // Add current language class
          monacoEditor.classList.add(`language-${language}`);
          
          // Also set a data attribute that CSS can target
          monacoEditor.setAttribute('data-language', language);
          
          // Apply additional classes for error highlighting if needed
          if (showErrors) {
            monacoEditor.classList.add('show-errors');
          } else {
            monacoEditor.classList.remove('show-errors');
          }
        }
      }
      
      // Only check for errors if we're not in a transition
      if (!isLanguageTransitionInProgress()) {
        // Check if errors were actually applied
        const model = editorRef.current.getModel();
        if (model) {
          const markers = window.monaco.editor.getModelMarkers({
            resource: model.uri
          });
          
          console.log(`Found ${markers.length} markers for language ${language}`);
          
          // If we have markers but they're not showing up, try creating them again
          if (markers.length > 0 && showErrors) {
            setTimeout(() => {
              // Force apply error decorations directly
              applyCustomErrorHighlighting(markers);
            }, 100);
          }
        }
      }
    }
  }, 200);
};
