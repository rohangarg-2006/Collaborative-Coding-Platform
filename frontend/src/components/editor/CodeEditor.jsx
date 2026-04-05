import React, { useEffect, useMemo, useRef, useState } from 'react';
import AceEditor from 'react-ace';
import '../../editor-enhanced.css';
import '../../editor-enhancements.css';
import '../../editor-final-polish.css';
import './error-decorations.css';

import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-csharp';
import 'ace-builds/src-noconflict/mode-golang';
import 'ace-builds/src-noconflict/mode-php';
import 'ace-builds/src-noconflict/mode-ruby';
import 'ace-builds/src-noconflict/mode-rust';

const RoleIndicator = () => null;

const ACE_MODE_MAP = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  cpp: 'c_cpp',
  c: 'c_cpp',
  java: 'java',
  csharp: 'csharp',
  go: 'golang',
  php: 'php',
  ruby: 'ruby',
  rust: 'rust',
};

const getLineColumnFromSyntaxError = (error) => {
  const message = String(error?.stack || error?.message || '');
  const match = message.match(/<anonymous>:(\d+):(\d+)/);
  if (match) {
    return {
      row: Math.max(0, Number(match[1]) - 1),
      column: Math.max(0, Number(match[2]) - 1),
    };
  }

  return { row: 0, column: 0 };
};

const addUnclosedBracketsDiagnostic = (source, annotations) => {
  const opens = ['(', '[', '{'];
  const closes = [')', ']', '}'];
  const map = { ')': '(', ']': '[', '}': '{' };
  const stack = [];

  const lines = String(source || '').split('\n');
  lines.forEach((line, row) => {
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (opens.includes(ch)) {
        stack.push({ ch, row, column: i });
      } else if (closes.includes(ch)) {
        if (!stack.length || stack[stack.length - 1].ch !== map[ch]) {
          annotations.push({ row, column: i, text: `Unmatched closing ${ch}`, type: 'error' });
        } else {
          stack.pop();
        }
      }
    }
  });

  stack.forEach((item) => {
    annotations.push({
      row: item.row,
      column: item.column,
      text: `Unmatched opening ${item.ch}`,
      type: 'error',
    });
  });
};

const createBasicDiagnostics = (sourceCode, language) => {
  const code = String(sourceCode || '');
  const lang = String(language || 'javascript').toLowerCase();
  const annotations = [];

  if (!code.trim()) {
    return annotations;
  }

  addUnclosedBracketsDiagnostic(code, annotations);

  if (lang === 'javascript' || lang === 'typescript') {
    try {
      // Parse-only syntax check (does not execute code).
      // eslint-disable-next-line no-new, no-new-func
      new Function(code);
    } catch (error) {
      const position = getLineColumnFromSyntaxError(error);
      annotations.push({
        row: position.row,
        column: position.column,
        text: error?.message || 'Syntax error',
        type: 'error',
      });
    }

    const declared = new Set([
      'console',
      'Math',
      'Date',
      'JSON',
      'Array',
      'Object',
      'String',
      'Number',
      'Boolean',
      'Set',
      'Map',
      'Promise',
      'window',
      'document',
      'globalThis',
      'stdin',
    ]);

    const lines = code.split('\n');
    lines.forEach((line, row) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

      // Track very common declarations to reduce false positives.
      const declarationMatch = trimmed.match(/^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/);
      if (declarationMatch) {
        declared.add(declarationMatch[1]);
        return;
      }

      // Bare identifier/expression lines like "abc" or "fooBar" are valid JS,
      // but almost always indicate accidental text or undefined references.
      if (/^[A-Za-z_$][\w$]*$/.test(trimmed)) {
        if (!declared.has(trimmed)) {
          annotations.push({
            row,
            column: 0,
            text: `Possible undefined identifier: ${trimmed}`,
            type: 'warning',
          });
        }
        return;
      }

      // Simple identifier usage scanner for first token to catch common mistakes.
      const firstIdentifier = trimmed.match(/^([A-Za-z_$][\w$]*)\b/);
      if (firstIdentifier) {
        const name = firstIdentifier[1];
        const startsWithKeyword = /^(if|for|while|switch|return|throw|try|catch|finally|new|typeof|await|async|break|continue)\b/.test(trimmed);
        if (!startsWithKeyword && !declared.has(name) && !trimmed.includes('.')) {
          annotations.push({
            row,
            column: 0,
            text: `Potential ReferenceError: ${name} is not declared`,
            type: 'warning',
          });
        }
      }
    });
  }

  if (lang === 'python') {
    const lines = code.split('\n');
    lines.forEach((line, row) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const needsColon = /^(if|elif|else|for|while|def|class|try|except|finally|with)\b/.test(trimmed);
      if (needsColon && !trimmed.endsWith(':')) {
        annotations.push({ row, column: 0, text: 'Missing colon (:)', type: 'error' });
      }
    });
  }

  if (lang === 'c' || lang === 'cpp' || lang === 'c++') {
    const lines = code.split('\n');
    lines.forEach((line, row) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
      if (trimmed.endsWith(';') || trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(':')) return;
      if (/^(if|for|while|switch|else|do)\b/.test(trimmed)) return;
      annotations.push({ row, column: Math.max(0, line.length - 1), text: 'Possible missing semicolon', type: 'warning' });
    });
  }

  return annotations;
};

const MONACO_STUB = {
  languages: {
    IndentAction: {
      None: 0,
      IndentOutdent: 1,
    },
    typescript: {
      javascriptDefaults: {
        setDiagnosticsOptions: () => undefined,
        setCompilerOptions: () => undefined,
        addExtraLib: () => undefined,
      },
      typescriptDefaults: {
        setDiagnosticsOptions: () => undefined,
        setCompilerOptions: () => undefined,
      },
      ScriptTarget: { ES2020: 'ES2020', Latest: 'Latest' },
      ModuleResolutionKind: { NodeJs: 'NodeJs' },
      ModuleKind: { ESNext: 'ESNext' },
      JsxEmit: { React: 'React' },
    },
    CompletionItemKind: { Function: 1, Snippet: 2 },
    CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
    registerCompletionItemProvider: () => ({ dispose: () => undefined }),
  },
  editor: {
    createDecorationType: () => ({}),
    OverviewRulerLane: { Right: 2 },
    setModelLanguage: () => undefined,
    setModelMarkers: () => undefined,
    getModelMarkers: () => [],
    getModel: () => null,
  },
  MarkerSeverity: {
    Error: 8,
    Warning: 4,
    Info: 2,
    Hint: 1,
    fromValue: (value) => {
      if (value === 8) return 8;
      if (value === 4) return 4;
      if (value === 2) return 2;
      if (value === 1) return 1;
      return 8;
    },
  },
  Range: class {
    constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
      this.startLineNumber = startLineNumber;
      this.startColumn = startColumn;
      this.endLineNumber = endLineNumber;
      this.endColumn = endColumn;
    }
  },
};

const createEditorAdapter = (aceEditor) => {
  if (!aceEditor) return null;

  const modelAdapter = {
    uri: { toString: () => 'ace://session' },
    getValue: () => aceEditor.getValue(),
    getLineCount: () => aceEditor.session.getLength(),
    getLineMaxColumn: (lineNumber) => {
      const line = aceEditor.session.getLine(Math.max(0, lineNumber - 1)) || '';
      return line.length + 1;
    },
    onDidChangeContent: (callback) => {
      const handler = () => callback();
      aceEditor.session.on('change', handler);
      return {
        dispose: () => aceEditor.session.off('change', handler),
      };
    },
    pushEditOperations: () => null,
    isDisposed: () => false,
  };

  return {
    focus: () => aceEditor.focus(),
    layout: () => aceEditor.resize(true),
    render: () => aceEditor.renderer.updateFull(),
    getDomNode: () => aceEditor.container,
    getPosition: () => {
      const cursor = aceEditor.getCursorPosition();
      return {
        lineNumber: (cursor?.row ?? 0) + 1,
        column: (cursor?.column ?? 0) + 1,
      };
    },
    getModel: () => modelAdapter,
    setDecorations: () => undefined,
    createDecorationsCollection: () => ({ clear: () => undefined }),
    getOption: (optionId) => {
      if (optionId === 52) {
        return aceEditor.renderer.lineHeight || 20;
      }
      return undefined;
    },
    getScrolledVisiblePosition: (position) => {
      if (!position) return null;
      const row = Math.max(0, (position.lineNumber || 1) - 1);
      const column = Math.max(0, (position.column || 1) - 1);
      const screenCoords = aceEditor.renderer.textToScreenCoordinates(row, column);
      return {
        top: screenCoords.pageY,
        left: screenCoords.pageX,
      };
    },
    updateOptions: (options = {}) => {
      if (Object.prototype.hasOwnProperty.call(options, 'readOnly')) {
        aceEditor.setReadOnly(Boolean(options.readOnly));
      }
      if (Object.prototype.hasOwnProperty.call(options, 'fontSize')) {
        aceEditor.setFontSize(options.fontSize);
      }
      if (Object.prototype.hasOwnProperty.call(options, 'showGutter')) {
        aceEditor.renderer.setShowGutter(Boolean(options.showGutter));
      }
    },
  };
};

const CodeEditor = ({
  language,
  code,
  setCode,
  theme,
  showErrors = true,
  userRole = 'editor',
  handleEditorDidMount,
}) => {
  const aceRef = useRef(null);
  const editorAdapterRef = useRef(null);
  const [hoveredDiagnostic, setHoveredDiagnostic] = useState(null);

  const aceMode = useMemo(() => ACE_MODE_MAP[language] || 'javascript', [language]);
  const aceTheme = useMemo(() => (theme === 'dark' ? 'monokai' : 'github'), [theme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!aceRef.current) return;
    aceRef.current.editor.setReadOnly(userRole === 'viewer');
  }, [userRole]);

  useEffect(() => {
    if (!aceRef.current) return;

    const session = aceRef.current.editor.getSession();
    if (!showErrors) {
      session.setAnnotations([]);
      setHoveredDiagnostic(null);
      return;
    }

    const diagnostics = createBasicDiagnostics(code, language);
    session.setAnnotations(diagnostics);
  }, [code, language, showErrors]);

  useEffect(() => {
    if (!aceRef.current || !showErrors) {
      setHoveredDiagnostic(null);
      return;
    }

    const editor = aceRef.current.editor;
    const container = editor.container;

    const handleMouseMove = (event) => {
      const target = event.target;
      const markerCell = target?.closest?.('.ace_gutter-cell.ace_error, .ace_gutter-cell.ace_warning, .ace_gutter-cell.ace_info');

      if (!markerCell) {
        setHoveredDiagnostic(null);
        return;
      }

      const pos = editor.renderer.screenToTextCoordinates(event.clientX, event.clientY);
      const row = pos?.row;
      const annotations = editor.getSession().getAnnotations() || [];
      const match = annotations.find((annotation) => annotation.row === row);

      if (!match || !match.text) {
        setHoveredDiagnostic(null);
        return;
      }

      const editorRect = container.getBoundingClientRect();
      setHoveredDiagnostic({
        text: match.text,
        top: event.clientY - editorRect.top + 10,
        left: event.clientX - editorRect.left + 14,
      });
    };

    const handleMouseLeave = () => {
      setHoveredDiagnostic(null);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [showErrors, code, language]);

  const onLoad = (aceEditor) => {
    aceRef.current = { editor: aceEditor };
    editorAdapterRef.current = createEditorAdapter(aceEditor);

    // Monaco no longer powers this editor; this keeps parent hooks from breaking.
    window.monaco = MONACO_STUB;

    const editorContainer = aceEditor.container;
    if (editorContainer) {
      editorContainer.classList.add('monaco-editor');
      editorContainer.classList.add('monaco-editor-container');
      editorContainer.classList.add(`language-${language}`);

      if (userRole === 'viewer') {
        editorContainer.classList.add('read-only-editor');
      } else {
        editorContainer.classList.remove('read-only-editor');
      }
    }

    if (handleEditorDidMount && editorAdapterRef.current) {
      handleEditorDidMount(editorAdapterRef.current, MONACO_STUB);
    }
  };

  const onChange = (nextCode) => {
    setCode(nextCode ?? '');
  };

  return (
    <section className="flex-1 flex flex-col h-full w-full relative">
      <RoleIndicator role={userRole} />
      <div
        className="w-full h-full flex flex-col rounded-md overflow-hidden shadow-lg border border-transparent"
        style={{ backgroundColor: 'transparent' }}
      >
        <AceEditor
          mode={aceMode}
          theme={aceTheme}
          name="collaborative-code-editor"
          value={code}
          onChange={onChange}
          onLoad={onLoad}
          width="100%"
          height="calc(100vh - 110px)"
          className={`monaco-editor-container monaco-editor language-${language}`}
          setOptions={{
            useWorker: false,
            showPrintMargin: false,
            tabSize: 2,
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            highlightActiveLine: true,
            showLineNumbers: true,
            readOnly: userRole === 'viewer',
            fontSize: 17,
          }}
          editorProps={{ $blockScrolling: true }}
        />

        {hoveredDiagnostic && (
          <div
            className="editor-annotation-tooltip"
            style={{
              top: `${hoveredDiagnostic.top}px`,
              left: `${hoveredDiagnostic.left}px`,
            }}
          >
            {hoveredDiagnostic.text}
          </div>
        )}
      </div>
    </section>
  );
};

export default CodeEditor;