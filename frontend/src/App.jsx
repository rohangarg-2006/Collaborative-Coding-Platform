import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import './App.css';

// Sample starter code templates for each language
const STARTER_CODE = {
  javascript: "// Start coding in JavaScript!\nconsole.log('Hello, world!');\n\n// Write your code here...",
  python: "# Start coding in Python!\nprint('Hello, world!')\n\n# Write your code here...",
  cpp: "// Start coding in C++!\n#include <iostream>\n\nint main() {\n  std::cout << \"Hello, world!\" << std::endl;\n  return 0;\n}",
  java: "// Start coding in Java!\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, world!\");\n  }\n}",
  typescript: "// Start coding in TypeScript!\ninterface Person {\n  name: string;\n  age: number;\n}\n\nconst greeting = (person: Person): string => {\n  return `Hello ${person.name}, you are ${person.age} years old!`;\n};\n\nconsole.log(greeting({ name: 'John', age: 30 }));",
  csharp: "// Start coding in C#!\nusing System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine(\"Hello, world!\");\n  }\n}",
  go: "// Start coding in Go!\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n  fmt.Println(\"Hello, world!\")\n}",
  php: "<?php\n// Start coding in PHP!\necho \"Hello, world!\";\n\n// Write your code here...\n?>",
  ruby: "# Start coding in Ruby!\nputs 'Hello, world!'\n\n# Write your code here...",
  rust: "// Start coding in Rust!\nfn main() {\n  println!(\"Hello, world!\");\n}\n",
};

const LANGUAGES = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
  { label: "TypeScript", value: "typescript" },
  { label: "C#", value: "csharp" },
  { label: "Go", value: "go" },
  { label: "PHP", value: "php" },
  { label: "Ruby", value: "ruby" },
  { label: "Rust", value: "rust" },
  // ...add more as needed
];

function App() {
  const [theme, setTheme] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [language, setLanguage] = useState("javascript");
  const [showErrors, setShowErrors] = useState(true);
  const [code, setCode] = useState(STARTER_CODE.javascript || "// Start coding collaboratively!");
  const editorRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply theme to document body and Monaco editor styles
  useEffect(() => {
    document.body.className = theme;

    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Force Monaco editor background to match theme */
      .monaco-editor,
      .monaco-editor-background,
      .monaco-editor .margin,
      .monaco-editor .overflow-guard,
      .monaco-editor .monaco-scrollable-element {
        background-color: #1a2637 !important;
        background: #1a2637 !important;
      }
      
      /* Ensure text is visible against dark background */
      .monaco-editor .mtk1,
      .monaco-editor .view-line span {
        color: #d4d4d8 !important;
      }
    `;

    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [theme]);

  // Update editor language and starter code when language changes
  useEffect(() => {
    if (editorRef.current && window.monaco) {
      const model = editorRef.current.getModel();
      if (model) {
        window.monaco.editor.setModelLanguage(model, language);
      
        // If code is empty or just the default for another language, replace with starter code
        const isDefaultTemplate = Object.values(STARTER_CODE).some(template => 
          code === template || code === "// Start coding collaboratively!");
      
        if (isDefaultTemplate) {
          setCode(STARTER_CODE[language] || STARTER_CODE.javascript);
        }
      }
    }
  }, [language, code]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  const handleEditorDidMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    
    // Set window.monaco for global access
    window.monaco = monacoInstance;
    
    // Configure validation settings for better error highlighting
    if (monacoInstance.languages.typescript) {
      monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: !showErrors,
        noSyntaxValidation: !showErrors,
      });
      
      monacoInstance.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: !showErrors,
        noSyntaxValidation: !showErrors,
      });
    }
    
    // Set up language validation for other languages if available
    const languageServices = {
      'javascript': monacoInstance.languages.typescript?.javascriptDefaults,
      'typescript': monacoInstance.languages.typescript?.typescriptDefaults,
      'python': monacoInstance.languages.python,
      'java': monacoInstance.languages.java,
      'cpp': monacoInstance.languages.cpp,
    };
    
    // Update language model for the current editor
    const model = editor.getModel();
    if (model) {
      monacoInstance.editor.setModelLanguage(model, language);
      
      // Apply syntax highlighting and validation immediately
      editor.updateOptions({
        renderValidationDecorations: showErrors ? "on" : "off",
        glyphMargin: showErrors,
        lightbulb: { enabled: showErrors },
      });
    }
  };

  // Update error visibility when showErrors changes
  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      editor.updateOptions({
        renderValidationDecorations: showErrors ? "on" : "off",
        glyphMargin: showErrors,
        lightbulb: { enabled: showErrors },
      });
      
      // Update Monaco's language-specific validation if available
      if (window.monaco && window.monaco.languages && window.monaco.languages.typescript) {
        window.monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: !showErrors,
          noSyntaxValidation: !showErrors,
        });
        window.monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: !showErrors,
          noSyntaxValidation: !showErrors,
        });
      }
    }
  }, [showErrors]);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white/80 dark:bg-gray-900/80 shadow-lg backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 tracking-tight drop-shadow">CodeCollab</span>
          <span className="ml-2 px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-xs text-indigo-800 dark:text-indigo-200 font-semibold animate-pulse">Live</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 rounded bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-gray-600 transition" onClick={() => setSidebarOpen(o => !o)} title="Toggle Sidebar">
            {sidebarOpen ? "✖" : "☰"}
          </button>
          <select
            className="rounded px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
          <button
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition"
            onClick={() => setShowErrors(e => !e)}
            title="Toggle Interview Mode"
          >
            {showErrors ? "Interview Mode: Off" : "Interview Mode: On"}
          </button>
          <button
            className="ml-2 px-3 py-1 rounded bg-indigo-500 text-white dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 shadow transition"
            onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
            title="Toggle Dark/Light Mode"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-row w-full h-full">
        {/* Sidebar (collapsible on mobile) */}
        <aside className={`fixed md:relative top-0 left-0 h-full z-20 bg-white/90 dark:bg-gray-900/90 border-r border-gray-200 dark:border-gray-700 p-6 w-64 shadow-lg transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:block md:w-64 md:min-w-64 md:flex-shrink-0`}> 
          <div className="font-bold mb-4 text-gray-700 dark:text-gray-200 text-lg tracking-wide">Participants</div>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-gray-800 dark:text-gray-100 font-medium">You</span>
            </li>
            {/* ...other users */}
          </ul>
          {/* Add chat or other sidebar features here */}
        </aside>
        
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-10 md:hidden" onClick={() => setSidebarOpen(false)}></div>
        )}
        
        {/* Code Editor */}
        <section className="flex-1 flex flex-col h-full w-full">
          <div className="w-full h-full bg-white/90 dark:bg-gray-900/90 flex flex-col">
            <Editor
              height="calc(100vh - 110px)"
              width="100%"
              defaultLanguage={language}
              language={language}
              value={code}
              theme={theme === "dark" ? "vs-dark" : "light"}
              onMount={handleEditorDidMount}
              onChange={value => setCode(value)}
              options={{
                fontSize: 17,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 2,
                formatOnType: true,
                formatOnPaste: true,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                lineNumbers: "on",
                readOnly: false,
                renderValidationDecorations: showErrors ? "on" : "off",
                glyphMargin: showErrors,
                lightbulb: { enabled: showErrors },
                smoothScrolling: true,
                cursorSmoothCaretAnimation: true,
                automaticLayout: true,
              }}
            />
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="text-center py-3 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-700 shadow-inner">
        &copy; {new Date().getFullYear()} <span className="font-semibold text-indigo-600 dark:text-indigo-400">CodeCollab</span> &mdash; Collaborative Coding Platform
      </footer>
    </div>
  );
}

export default App;
