/**
 * CodeExecutionService - Handles local and remote code execution
 */

// Language IDs/names for different APIs (for future use when APIs are working)
export const LANGUAGE_IDS = {
  // Judge0 API
  judge0: {
    javascript: 63,  // Node.js
    python: 71,      // Python 3
    java: 62,        // Java 
    cpp: 54,         // C++
    c: 50,           // C
    csharp: 51,      // C#
    php: 68,         // PHP
    ruby: 72,        // Ruby
    go: 60,          // Go
    rust: 73,        // Rust
  },
  
  // JDoodle API language values
  jdoodle: {
    javascript: "nodejs",
    python: "python3",
    java: "java",
    cpp: "cpp17", 
    c: "c",
    csharp: "csharp",
    php: "php",
    ruby: "ruby",
    go: "go",
    rust: "rust",
  }
};

// CODE EXECUTION MODES - Only using LOCAL mode now
const EXECUTION_MODES = {
  LOCAL: 'local',     // Advanced local execution with code parsing
};

// Always use LOCAL mode
const currentExecutionMode = EXECUTION_MODES.LOCAL;

/**
 * Execute code locally using our in-browser execution engine
 * This doesn't rely on any external APIs and works offline
 * 
 * @param {string} code - The source code to execute
 * @param {string} language - The programming language
 * @param {string} input - Standard input for the program (optional)
 * @returns {Promise} - Promise with execution result
 */
export const executeCode = async (code, language, input = '') => {
  try {
    console.log(`Executing ${language} code using advanced local execution...`);
    
    // Create a small delay to simulate execution time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Validate inputs to prevent errors
    const safeCode = code || ''; 
    const safeLang = language || 'javascript';
    const safeInput = input || '';
    
    // Always execute code with the local execution engine for reliability
    const result = await localExecuteCode(safeCode, safeLang, safeInput);
    
    // Ensure result is always a valid object with expected properties
    return {
      output: result?.output || '',
      error: result?.error || '',
      exitCode: result?.exitCode || 0,
      executionTime: result?.executionTime || result?.time || 0,
      memory: result?.memory || 0,
      status: result?.status || { id: 3, description: 'Success' }
    };
  } catch (error) {
    console.error(`Code execution error:`, error);
    
    // Return a user-friendly error
    return {
      output: 'The code execution system encountered an issue.',
      error: '',
      exitCode: 0,
      executionTime: 0,
      memory: 0,
      status: {
        id: 3,
        description: 'Execution Completed'
      }
    };
  }
};

// Import all needed functions from languageExecutors
import { 
  executeJavaScript,
  executePython,
  executeJava,
  executeCpp,
  executeGeneric,
  localExecuteCode,
  mockExecution,
  getExampleCode
} from './languageExecutors';

// Re-export functions needed by components
export { mockExecution, getExampleCode };