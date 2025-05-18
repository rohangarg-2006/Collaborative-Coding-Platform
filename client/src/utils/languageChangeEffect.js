// Effect for language change
useEffect(() => {
  // Check if language has changed
  const languageChanged = prevLanguageRef.current !== language;
  
  if (editorRef.current && window.monaco && languageChanged) {
    // Use our utility function to handle language transition
    handleLanguageTransition(
      editorRef.current, 
      window.monaco, 
      language, 
      prevLanguageRef.current,
      STARTER_CODE,
      setCode
    );
    
    // Update the ref to track this language as the previous one for next change
    prevLanguageRef.current = language;
    
    // Configure language specific settings after transition
    const model = editorRef.current.getModel();
    if (model) {
      // Configure validation settings
      configureLanguageValidation(window.monaco, language, showErrors);
      
      // Apply language-specific CSS class
      const editorDom = editorRef.current.getDomNode();
      if (editorDom) {
        const monacoEditor = editorDom.closest('.monaco-editor');
        if (monacoEditor) {
          // Clear previous language classes
          monacoEditor.classList.forEach(cls => {
            if (cls.startsWith('language-')) {
              monacoEditor.classList.remove(cls);
            }
          });
          
          // Add new language class
          monacoEditor.classList.add(`language-${language}`);
          monacoEditor.setAttribute('data-language', language);
          
          if (showErrors) {
            monacoEditor.classList.add('show-errors');
          } else {
            monacoEditor.classList.remove('show-errors');
          }
        }
      }
      
      // Run error detection after transition completes
      setTimeout(() => {
        if (!isLanguageTransitionInProgress()) {
          updateDiagnostics();
          
          // For languages that don't have built-in diagnostics (like C++), force error checking
          if (language !== 'javascript' && language !== 'typescript') {
            forceErrorCheck(editorRef.current, window.monaco, code, language);
          }
        }
      }, 1000);
    }
  }
}, [language, showErrors]);
