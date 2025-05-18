/**
 * Utility functions for better language transitions
 */

// Helper function to clear all error markers during language transition
export const clearAllErrorMarkers = (editor, monaco, model) => {
  if (!editor || !monaco || !model) return;
  
  try {
    // Use a comprehensive clearing approach for all marker types
    const commonMarkerTypes = [
      'custom-diagnostics', 
      'bracket-diagnostics', 
      'debug-test-errors', 
      'forced-error-check',
      'syntax-error',
      'custom-error'
    ];
    
    // Clear all known marker types
    commonMarkerTypes.forEach(markerType => {
      monaco.editor.setModelMarkers(model, markerType, []);
    });
    
    // Also clear language-specific marker types
    const languages = ['javascript', 'typescript', 'python', 'cpp', 'java', 'csharp', 'go', 'rust', 'php', 'ruby'];
    languages.forEach(lang => {
      monaco.editor.setModelMarkers(model, `${lang}-test-error`, []);
      monaco.editor.setModelMarkers(model, `${lang}-diagnostics`, []);
    });
    
    // Clear all decorations
    const decorationTypes = [
      '_customDecorationIds',
      '_squigglyDecorationIds',
      '_decorationCollection',
      '_forcedDecorationIds',
      '_errorDecorationIds'
    ];
    
    decorationTypes.forEach(decorationType => {
      if (editor[decorationType]) {
        if (typeof editor[decorationType].clear === 'function') {
          editor[decorationType].clear();
        } else if (Array.isArray(editor[decorationType])) {
          editor.deltaDecorations(editor[decorationType], []);
        }
      }
    });
  } catch (error) {
    console.warn('Error clearing decorations during language change:', error);
  }
};

// Helper function to set transition flag and return timer
export const startLanguageTransition = () => {
  window._languageTransitionInProgress = true;
  return setTimeout(() => {
    window._languageTransitionInProgress = false;
  }, 800);
};

// Function to determine if a language transition is in progress
export const isLanguageTransitionInProgress = () => {
  return window._languageTransitionInProgress === true;
};

// Function to handle language transitions smoothly
export const handleLanguageTransition = (editor, monaco, newLanguage, prevLanguage, starterCode, setCode) => {
  if (!editor || !monaco) return false;
  
  // Set a flag to indicate a language transition is in progress
  const transitionTimer = startLanguageTransition();
  
  const model = editor.getModel();
  if (model) {
    // Clear all error markers before language change to prevent flickering
    clearAllErrorMarkers(editor, monaco, model);
    
    // Set the new language in the model
    monaco.editor.setModelLanguage(model, newLanguage);
    
    // Update code if starter code is provided
    if (starterCode && setCode) {
      setCode(starterCode[newLanguage] || starterCode.javascript || "// Start coding here");
      console.log(`Language changed from ${prevLanguage} to ${newLanguage}, code updated`);
    }
    
    // Apply language-specific CSS class
    const editorDom = editor.getDomNode();
    if (editorDom) {
      const monacoEditor = editorDom.closest('.monaco-editor');
      if (monacoEditor) {
        // Remove existing language classes
        monacoEditor.classList.forEach(cls => {
          if (cls.startsWith('language-')) {
            monacoEditor.classList.remove(cls);
          }
        });
        
        // Add new language class
        monacoEditor.classList.add(`language-${newLanguage}`);
        monacoEditor.setAttribute('data-language', newLanguage);
      }
    }
    
    return transitionTimer;
  }
  
  return false;
};
