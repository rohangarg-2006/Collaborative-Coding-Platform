import React, { useRef, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import { loader } from '@monaco-editor/react';
import { isLanguageTransitionInProgress } from '../../utils/languageTransition';
import '../../editor-enhanced.css'; // Import enhanced editor styles
import '../../editor-enhancements.css'; // Import additional editor enhancements
import '../../editor-final-polish.css'; // Import final polish styles

// Role indicator component for editor - empty implementation to remove "View Only" text
const RoleIndicator = ({ role }) => {
  // Return empty fragment to remove the role indicator completely
  return null;
};

// Preload Monaco Editor with required features for better suggestions and error detection
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.38.0/min/vs',
  },
});

const CodeEditor = ({ 
  language, 
  code, 
  setCode, 
  theme, 
  showErrors,
  userRole = 'viewer',
  handleEditorDidMount 
}) => {  
  // Reference to track Monaco instance
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
    // Effect to define custom themes with better contrast
  useEffect(() => {
    // Apply theme class to document body for global CSS targeting
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
    
    if (monacoRef.current) {      // Define custom light theme with improved contrast and modern aesthetics
      monacoRef.current.editor.defineTheme('custom-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '619561', fontStyle: 'italic' }, // Softer green for comments
          { token: 'keyword', foreground: '7c4dff' }, // Purple for keywords
          { token: 'string', foreground: 'c2185b' }, // Rich magenta for strings
          { token: 'variable', foreground: '1976d2' }, // Bright blue for variables
          { token: 'function', foreground: '6b2e9d' }, // Deep purple for functions
          { token: 'number', foreground: 'e65100' },  // Deep orange for numbers
          { token: 'type', foreground: '0c969b' },    // Teal for types
          { token: 'class', foreground: '0c969b' }    // Teal for classes
        ],
        colors: {
          'editor.background': '#f8fafc', // Very light blue-gray background
          'editor.foreground': '#2d3748', // Slate dark gray for better contrast
          'editor.lineHighlightBackground': 'rgba(236, 246, 253, 0.8)', // Subtle highlight for current line
          'editorLineNumber.foreground': '#718096', // Medium gray for line numbers
          'editor.selectionBackground': 'rgba(49, 130, 206, 0.2)', // Medium blue selection with transparency
          'editorCursor.foreground': '#3182ce', // Medium blue cursor
          'editor.inactiveSelectionBackground': 'rgba(226, 232, 240, 0.6)',
          'editorIndentGuide.background': 'rgba(49, 130, 206, 0.1)', // Subtle indent guides
          'editorIndentGuide.activeBackground': 'rgba(49, 130, 206, 0.3)', // More visible active indent
          'editor.findMatchBackground': 'rgba(49, 130, 206, 0.3)', // Search highlight
          'editor.findMatchHighlightBackground': 'rgba(49, 130, 206, 0.15)' // Other matches
        }
      });  // Define custom dark theme with improved contrast and modern aesthetics
      monacoRef.current.editor.defineTheme('custom-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'bd93f9' }, // Dracula purple for keywords
          { token: 'string', foreground: 'f1fa8c' },  // Dracula yellow for strings
          { token: 'variable', foreground: '8be9fd' }, // Dracula cyan for variables
          { token: 'function', foreground: 'ff79c6' }, // Dracula pink for functions
          { token: 'number', foreground: 'bd93f9' },   // Dracula purple for numbers
          { token: 'type', foreground: '50fa7b' },     // Dracula green for types
          { token: 'class', foreground: '50fa7b' }     // Dracula green for classes
        ],        
        colors: {
          'editor.background': '#282a36', // Dracula background
          'editor.foreground': '#f8f8f2', // Dracula foreground
          'editor.lineHighlightBackground': 'rgba(70, 90, 126, 0.25)', // Enhanced line highlight
          'editorLineNumber.foreground': '#61afef', // Bright blue line numbers
          'editor.selectionBackground': 'rgba(97, 175, 239, 0.3)', // Bright blue selection
          'editorCursor.foreground': '#61dafb', // Bright blue cursor
          'editor.inactiveSelectionBackground': 'rgba(70, 90, 126, 0.25)',
          'editorIndentGuide.background': 'rgba(97, 218, 251, 0.1)', // Subtle indent guides
          'editorIndentGuide.activeBackground': 'rgba(97, 218, 251, 0.3)', // More visible active indent
          'editor.findMatchBackground': 'rgba(97, 218, 251, 0.3)', // Search highlight
          'editor.findMatchHighlightBackground': 'rgba(97, 218, 251, 0.15)' // Other matches
        }
      });
    }
  }, [monacoRef.current]);
  // Update editor theme when the theme prop changes
  useEffect(() => {
    if (editorRef.current) {
      // Update editor theme
      const currentTheme = theme === "dark" ? "custom-dark" : "custom-light";
      
      // Force Monaco to update its theme
      if (monacoRef.current) {
        monacoRef.current.editor.setTheme(currentTheme);
      }
      
      // Update DOM elements directly for immediate effect
      const editorDom = editorRef.current.getDomNode();
      if (editorDom) {
        const monacoEditor = editorDom.closest('.monaco-editor');
        if (monacoEditor) {          // Set background color based on current theme
          const bgColor = theme === 'dark' ? '#1a2133' : '#f8fafc';
          
          // Apply consistent background color
          monacoEditor.style.backgroundColor = bgColor;
          monacoEditor.style.background = bgColor;
          
          // Find and style all internal elements
          const innerElements = monacoEditor.querySelectorAll('.monaco-editor-background, .margin, .monaco-scrollable-element');
          innerElements.forEach(el => {
            el.style.backgroundColor = bgColor;
            el.style.background = bgColor;
          });
        }
      }
    }
  }, [theme]);
  // Effect to handle language-specific error detection after editor mounts
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const setupLanguageSpecificErrorDetection = () => {
        try {
          const model = editorRef.current.getModel();
          if (!model) return;
          
          // First clear any existing error markers for this language
          monacoRef.current.editor.setModelMarkers(
            model,
            `${language}-diagnostics`, 
            []
          );
            // Check if we're in a language transition
          const isInTransition = isLanguageTransitionInProgress();
          
          // Only set up error detection if we're not in transition and errors should be shown
          if (showErrors && !isInTransition) {            // For languages that need extra validation beyond what Monaco provides
            if (language !== 'javascript' && language !== 'typescript') {
              setTimeout(() => {
                // Double check model is still valid and transition has completed
                if (model.isDisposed() || isLanguageTransitionInProgress()) return;
                
                // Apply custom diagnostics for this language
                if (model.getValue().trim().length > 0) {
                  const markers = monacoRef.current.editor.getModelMarkers({
                    resource: model.uri
                  });
                  
                  // If no markers were automatically created, generate custom ones
                  if (markers.length === 0) {
                    const customMarkers = window.generateErrorsForLanguage ? 
                      window.generateErrorsForLanguage(model.getValue(), language, monacoRef.current) : [];
                    
                    monacoRef.current.editor.setModelMarkers(
                      model, 
                      `${language}-custom-diagnostics`, 
                      customMarkers
                    );
                  }
                }
              }, 800); // Increased delay to ensure transition is complete
            }
          }
        } catch (error) {
          console.error('Error setting up language error detection:', error);
        }
      };
      
      // Set up error detection with a delay to allow editor initialization
      // and check for transition state
      const setupTimer = setTimeout(() => {        // Only perform setup if not in transition
        if (!isLanguageTransitionInProgress()) {
          setupLanguageSpecificErrorDetection();
        }
      }, 500);
      
      // Clean up timer on unmount or language change
      return () => clearTimeout(setupTimer);
    }
  }, [language, showErrors, editorRef.current, code]);
  
  // Setup error decorations for all languages
  const setupErrorDecorators = (monaco) => {
    if (!monaco) return;
    
    // Register decorator providers for each language
    const languages = ['javascript', 'typescript', 'python', 'cpp', 'java', 'csharp', 'go', 'rust', 'php', 'ruby'];
    
    languages.forEach(lang => {
      // Register a decoration provider for this language
      monaco.languages.registerCodeLensProvider(lang, {
        provideCodeLenses: (model) => {
          // Get markers for this model
          const markers = monaco.editor.getModelMarkers({ resource: model.uri });
          
          if (!markers.length || !showErrors) {
            return { lenses: [], dispose: () => {} };
          }
          
          // Convert markers to code lens
          const lenses = markers.map(marker => ({
            range: marker.range || {
              startLineNumber: marker.startLineNumber,
              startColumn: marker.startColumn,
              endLineNumber: marker.endLineNumber,
              endColumn: marker.endColumn
            },
            id: `${marker.startLineNumber}:${marker.startColumn}`,
            command: {
              id: 'editor.action.showErrors',
              title: marker.message
            }
          }));
          
          return {
            lenses,
            dispose: () => {}
          };
        },
        resolveCodeLens: (model, codeLens) => {
          return codeLens;
        }
      });
    });
  };
  
  const handleEditorWillMount = (monaco) => {
    // Store Monaco instance for later use
    monacoRef.current = monaco;
    
    // Set up global error handlers for Monaco
    window.addEventListener('error', (event) => {
      if (event.message && event.message.includes('Monaco')) {
        console.error('Monaco Editor error:', event);
      }
    });
    
    // Configure language error detection and features
    try {
      // Register custom error decorations for all languages
      setupErrorDecorators(monaco);
      
      // Configure all supported languages
      const languageConfigurations = {
        'python': {
          brackets: [['{','}'], ['[',']'], ['(',')']],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string', 'comment'] },
            { open: "'''", close: "'''", notIn: ['string', 'comment'] },
            { open: '"""', close: '"""', notIn: ['string', 'comment'] }
          ],
          indentationRules: {
            increaseIndentPattern: /^\s*(?:def|class|for|if|elif|else|while|try|with|finally|except|async)\b.*:\s*$/,
            decreaseIndentPattern: /^\s*(?:elif|else|except|finally)\b.*$/
          }
        },
        'cpp': {
          brackets: [['{','}'], ['[',']'], ['(',')']],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string', 'comment'] }
          ]
        },
        'java': {
          brackets: [['{','}'], ['[',']'], ['(',')']],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string', 'comment'] }
          ]
        },
        'csharp': {
          brackets: [['{','}'], ['[',']'], ['(',')']],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string', 'comment'] },
            { open: "/*", close: "*/", notIn: ['string'] }
          ]
        },
        'go': {
          brackets: [['{','}'], ['[',']'], ['(',')']],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: '`', close: '`', notIn: ['string', 'comment'] },
            { open: "/*", close: "*/", notIn: ['string'] }
          ]
        },
        'rust': {
          brackets: [['{','}'], ['[',']'], ['(',')']],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string', 'comment'] },
            { open: "/*", close: "*/", notIn: ['string'] }
          ]
        }
      };
      
      // Apply configurations to all supported languages
      Object.entries(languageConfigurations).forEach(([lang, config]) => {
        if (monaco.languages.getLanguages().some(l => l.id === lang)) {
          monaco.languages.setLanguageConfiguration(lang, config);
        }
      });

      // Enable syntax validation for all languages
      monaco.languages.getLanguages().forEach(lang => {
        if (monaco.languages.onLanguage) {
          monaco.languages.onLanguage(lang.id, () => {
            const providers = monaco.languages.getEncodedLanguageServiceDefaults?.(lang.id);
            if (providers && providers.setDiagnosticsOptions) {
              providers.setDiagnosticsOptions({
                validate: showErrors,
                lint: {
                  enabled: showErrors
                }
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('Error setting up language features:', error);
    }
  };

  // Function to get appropriate language-specific options
  const getLanguageOptions = () => {
    const commonOptions = {
      fontSize: 17,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      tabSize: 2,
      formatOnType: true,
      formatOnPaste: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      suggestOnTriggerCharacters: true,
      lineNumbers: "on",
      readOnly: false,
      renderValidationDecorations: showErrors ? "on" : "off",
      glyphMargin: showErrors,
      lightbulb: { enabled: showErrors },
      smoothScrolling: true,
      cursorSmoothCaretAnimation: "on",
      automaticLayout: true,
      parameterHints: { enabled: true, cycle: true },
      snippetSuggestions: 'inline',
      suggest: {
        showInlineDetails: true,
        showStatusBar: true,
        preview: true,
        filterGraceful: true,
        localityBonus: true,
        shareSuggestSelections: true
      },
      hover: {
        enabled: true,
        delay: 300,
        sticky: true
      },
      semanticHighlighting: {
        enabled: true
      },
      bracketPairColorization: {
        enabled: true,
        independentColorPoolPerBracketType: true
      },
      "bracketPairColorization.enabled": true, // Ensure this is set both ways for compatibility
    };    // Define common validation and UI settings
    const validationSettings = {
      validate: { enable: true }, // Always internally enable validation for error detection
      lint: { 
        keys: true,
        syntax: true, 
        deprecation: true 
      },
      // UI display controlled by showErrors prop
      renderValidationDecorations: showErrors ? "on" : "off",
      lightbulb: { enabled: showErrors },
      // Ensure error markers are shown in overview ruler even when they might be hidden
      overviewRulerLanes: 7,
      // Configurations for error squiggles - will control display via CSS
      editorClassName: `language-${language}`,
    };
    
    // Language-specific options - merged with the validation settings
    const languageSpecificOptions = {
      'javascript': {
        javascript: {
          suggestionActions: { enabled: true },
          format: {
            insertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
            insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
          },
          updateImportsOnFileMove: { enabled: 'always' },
          ...validationSettings
        },
        diagnostics: { validate: true } // Always enable diagnostics internally
      },
      'typescript': {
        format: {
          indentSize: 2,
          convertTabsToSpaces: true,
          tabSize: 2,
          insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
        },
        diagnostics: { validate: true }, // Always enable diagnostics internally
        ...validationSettings
      },
      'python': {
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true,
        },
        comments: {
          lineComment: "#"
        },
        ...validationSettings
      },
      'cpp': {
        brackets: [['{','}'], ['[',']'], ['(',')']],
        autoClosingBrackets: 'always',
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"]
        },
        ...validationSettings
      },
      'java': {
        brackets: [['{','}'], ['[',']'], ['(',')']],
        autoClosingBrackets: 'always',
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"]
        },
        ...validationSettings
      },
      'csharp': {
        brackets: [['{','}'], ['[',']'], ['(',')']],
        autoClosingBrackets: 'always',
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"]
        },
        ...validationSettings
      },
      'go': {
        brackets: [['{','}'], ['[',']'], ['(',')']],
        autoClosingBrackets: 'always',
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"]
        },
        ...validationSettings
      },
      'php': {
        brackets: [['{','}'], ['[',']'], ['(',')']],
        autoClosingBrackets: 'always',
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"]
        },
        ...validationSettings
      },
      'ruby': {
        brackets: [['{','}'], ['[',']'], ['(',')']],
        autoClosingBrackets: 'always',
        comments: {
          lineComment: "#"
        },
        ...validationSettings
      },
      'rust': {
        brackets: [['{','}'], ['[',']'], ['(',')']],
        autoClosingBrackets: 'always',
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"]
        },
        ...validationSettings
      }
    };
    
    return {
      ...commonOptions,
      ...(languageSpecificOptions[language] || {})
    };
  };  return (
    <section className="flex-1 flex flex-col h-full w-full relative">      
      <RoleIndicator role={userRole} />
      <div className="w-full h-full flex flex-col rounded-md overflow-hidden shadow-lg border border-transparent" 
           style={{ backgroundColor: 'transparent' }}>        <Editor
          height="calc(100vh - 110px)"
          width="100%"
          defaultLanguage={language}
          language={language}
          value={code}
          theme={theme === 'dark' ? 'custom-dark' : 'custom-light'}
          beforeMount={handleEditorWillMount}
          onMount={(editor, monaco) => {
          // Store editor reference for direct access
            editorRef.current = editor;
            window.monaco = monaco; // Make Monaco globally available
            
            // Force background color on editor DOM elements based on theme
            setTimeout(() => {
              const editorDom = editor.getDomNode();
              if (editorDom) {
                const monacoEditor = editorDom.closest('.monaco-editor');
                if (monacoEditor) {
                  // Add theme-specific class for CSS targeting
                  if (theme === 'dark') {
                    monacoEditor.classList.add('dark-enhanced');
                    document.body.classList.add('dark');
                    document.body.classList.remove('light');
                  } else {
                    monacoEditor.classList.add('light-enhanced');
                    document.body.classList.add('light');
                    document.body.classList.remove('dark');
                  }
                  
                  // Set language attribute for syntax highlighting
                  monacoEditor.setAttribute('data-language', language);
                  editor._domElement = monacoEditor; // Store for easier access
                }
              }
            }, 100);
            
            // Call the parent's handler
            handleEditorDidMount(editor, monaco);
          }}
          onChange={(value) => {
            // Update code state
            setCode(value);
            
            // Ensure language attribute is always set for proper styling
            setTimeout(() => {
              const editorDom = editorRef.current?.getDomNode();
              if (editorDom) {
                const monacoEditor = editorDom.closest('.monaco-editor');
                if (monacoEditor) {
                  monacoEditor.setAttribute('data-language', language);
                  monacoEditor.classList.add(`language-${language}`);
                }
              }
            }, 0);

            // --- Ensure error markers are set for custom languages ---
            if (editorRef.current && monacoRef.current) {
              const model = editorRef.current.getModel();
              if (model) {
                if (language !== 'javascript' && language !== 'typescript') {
                  // Clear ALL Monaco markers (including JS/TS diagnostics) for custom languages
                  monacoRef.current.editor.setModelMarkers(model, 'owner', []);
                  monacoRef.current.editor.setModelMarkers(model, `${language}-diagnostics`, []);
                  // Generate and set custom markers if needed
                  if (showErrors && model.getValue().trim().length > 0) {
                    let customMarkers = [];
                    if (window.generateErrorsForLanguage) {
                      try {
                        customMarkers = window.generateErrorsForLanguage(model.getValue(), language, monacoRef.current) || [];
                      } catch (e) {
                        customMarkers = [];
                      }
                    }
                    // Only set markers if they are not excessive (e.g., < 10)
                    if (customMarkers.length > 0 && customMarkers.length < 10) {
                      monacoRef.current.editor.setModelMarkers(
                        model,
                        `${language}-custom-diagnostics`,
                        customMarkers
                      );
                    } else {
                      // If too many markers, clear them to avoid noise
                      monacoRef.current.editor.setModelMarkers(
                        model,
                        `${language}-custom-diagnostics`,
                        []
                      );
                    }
                  } else {
                    // If no code or errors not shown, clear custom markers
                    monacoRef.current.editor.setModelMarkers(
                      model,
                      `${language}-custom-diagnostics`,
                      []
                    );
                  }
                }
              }
            }
          }}
          options={getLanguageOptions()}
          loading={<div className="p-3 text-center">Loading editor...</div>}
          className={`monaco-editor-container monaco-editor language-${language}`}
          data-language={language}
        />
      </div>
    </section>
  );
};

export default CodeEditor;
