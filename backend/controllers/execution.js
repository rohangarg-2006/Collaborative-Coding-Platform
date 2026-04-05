const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { spawn } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const vm = require('vm');

const LANGUAGE_ALIASES = {
  js: 'javascript',
  node: 'javascript',
  nodejs: 'javascript',
  py: 'python',
  python3: 'python',
  shell: 'bash',
  sh: 'bash',
  cpp: 'c++',
  'cxx': 'c++',
  cs: 'c#',
  csharp: 'c#',
  ts: 'typescript',
};

const DEFAULT_TIMEOUT_MS = Number(process.env.LOCAL_EXEC_TIMEOUT_MS || 5000);
const MAX_BUFFER_BYTES = Number(process.env.LOCAL_EXEC_MAX_BUFFER || 1024 * 1024);

const RUNTIMES = [
  { language: 'javascript', runtime: 'node-local', version: process.version, id: 'node-local-js' },
  { language: 'python', runtime: 'python-local', version: 'local', id: 'python-local' },
  { language: 'bash', runtime: 'bash-local', version: 'local', id: 'bash-local' },
  { language: 'c', runtime: 'gcc-local', version: 'local', id: 'gcc-local-c' },
  { language: 'c++', runtime: 'g++-local', version: 'local', id: 'gpp-local-cpp' },
  { language: 'typescript', runtime: 'node-local', version: process.version, id: 'node-local-ts' },
];

const normalizeLanguage = (language) => {
  const value = String(language || '').trim().toLowerCase();
  return LANGUAGE_ALIASES[value] || value;
};

const normalizeTimeoutToMs = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  // Keep compatibility with clients that might still send seconds instead of ms.
  if (value <= 100) {
    return Math.floor(value * 1000);
  }

  return Math.floor(value);
};

const toExecutionData = ({ language, stdout = '', stderr = '', code = 0, signal = null, time = 0, memory = 0, version = 'local' }) => {
  return {
    language,
    version,
    run: {
      stdout,
      stderr,
      output: [stdout, stderr].filter(Boolean).join('\n'),
      code,
      signal,
      time,
      memory,
      status: {
        id: code === 0 ? 3 : 4,
        description: code === 0 ? 'Completed' : 'Error',
      },
    },
    compile: null,
  };
};

const runProcess = ({ command, args = [], stdin = '', timeoutMs }) => {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let finished = false;

    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const done = (result) => {
      if (finished) return;
      finished = true;
      resolve(result);
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      if (stdout.length < MAX_BUFFER_BYTES) {
        stdout += chunk.toString();
      }
    });

    child.stderr.on('data', (chunk) => {
      if (stderr.length < MAX_BUFFER_BYTES) {
        stderr += chunk.toString();
      }
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      done({
        stdout,
        stderr: error?.code === 'ENOENT' ? `${command} is not installed or not on PATH.` : (error?.message || String(error)),
        code: 1,
        signal: null,
        time: (Date.now() - startedAt) / 1000,
        memory: 0,
      });
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        stderr = [stderr, `Execution timed out after ${timeoutMs} ms.`].filter(Boolean).join('\n');
      }

      done({
        stdout,
        stderr,
        code: timedOut ? 124 : (typeof code === 'number' ? code : 1),
        signal,
        time: (Date.now() - startedAt) / 1000,
        memory: 0,
      });
    });

    child.stdin.write(String(stdin || ''));
    child.stdin.end();
  });
};

const runJavaScript = ({ sourceCode, stdin = '', timeoutMs }) => {
  const startedAt = Date.now();
  const logs = [];

  const sandbox = {
    stdin,
    console: {
      log: (...args) => logs.push(args.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ')),
      error: (...args) => logs.push(args.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ')),
    },
  };

  try {
    vm.createContext(sandbox);
    const script = new vm.Script(String(sourceCode || ''), { filename: 'main.js' });
    script.runInContext(sandbox, { timeout: timeoutMs });

    return Promise.resolve({
      stdout: logs.join('\n'),
      stderr: '',
      code: 0,
      signal: null,
      time: (Date.now() - startedAt) / 1000,
      memory: 0,
    });
  } catch (error) {
    return Promise.resolve({
      stdout: logs.join('\n'),
      stderr: error?.stack || error?.message || String(error),
      code: 1,
      signal: null,
      time: (Date.now() - startedAt) / 1000,
      memory: 0,
    });
  }
};

const runPython = ({ sourceCode, stdin = '', timeoutMs }) => {
  return runProcess({
    command: process.platform === 'win32' ? 'python' : 'python3',
    args: ['-c', String(sourceCode || '')],
    stdin,
    timeoutMs,
  });
};

const runBash = ({ sourceCode, stdin = '', timeoutMs }) => {
  return runProcess({
    command: process.platform === 'win32' ? 'bash' : 'sh',
    args: ['-c', String(sourceCode || '')],
    stdin,
    timeoutMs,
  });
};

const runCompiledLanguage = async ({ language, sourceCode, stdin = '', timeoutMs }) => {
  const isCpp = language === 'c++';
  const compiler = isCpp ? 'g++' : 'gcc';
  const ext = isCpp ? 'cpp' : 'c';
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-exec-'));
  const sourceFile = path.join(tmpDir, `main.${ext}`);
  const binaryFile = path.join(tmpDir, process.platform === 'win32' ? 'program.exe' : 'program');

  try {
    await fs.writeFile(sourceFile, String(sourceCode || ''), 'utf8');

    const compileTimeoutMs = Math.max(1000, Math.floor(timeoutMs * 0.6));
    const runTimeoutMs = Math.max(1000, timeoutMs - compileTimeoutMs);

    const compileResult = await runProcess({
      command: compiler,
      args: [sourceFile, '-o', binaryFile],
      stdin: '',
      timeoutMs: compileTimeoutMs,
    });

    if (compileResult.code !== 0) {
      return {
        stdout: '',
        stderr: compileResult.stderr || `${compiler} compilation failed.`,
        code: compileResult.code,
        signal: compileResult.signal,
        time: compileResult.time,
        memory: 0,
      };
    }

    const runResult = await runProcess({
      command: binaryFile,
      args: [],
      stdin,
      timeoutMs: runTimeoutMs,
    });

    return {
      ...runResult,
      time: (compileResult.time || 0) + (runResult.time || 0),
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
};

// @desc    Get local runtimes
// @route   GET /api/v1/execution/runtimes
// @access  Private
exports.getRuntimes = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, data: RUNTIMES });
});

// @desc    Execute code locally without external APIs
// @route   POST /api/v1/execution/execute
// @access  Private
exports.executeCode = asyncHandler(async (req, res, next) => {
  const {
    language,
    files,
    stdin = '',
    run_timeout,
  } = req.body || {};

  if (!language) {
    return next(new ErrorResponse('language is required', 400));
  }

  if (!Array.isArray(files) || files.length === 0 || typeof files[0]?.content !== 'string') {
    return next(new ErrorResponse('files array with at least one { content } entry is required', 400));
  }

  const normalizedLanguage = normalizeLanguage(language);
  const sourceCode = files[0].content;
  const timeoutMs = normalizeTimeoutToMs(run_timeout);
  let result;

  if (normalizedLanguage === 'javascript' || normalizedLanguage === 'typescript') {
    result = await runJavaScript({ sourceCode, stdin, timeoutMs });
  } else if (normalizedLanguage === 'python') {
    result = await runPython({ sourceCode, stdin, timeoutMs });
  } else if (normalizedLanguage === 'bash') {
    result = await runBash({ sourceCode, stdin, timeoutMs });
  } else if (normalizedLanguage === 'c' || normalizedLanguage === 'c++') {
    result = await runCompiledLanguage({ language: normalizedLanguage, sourceCode, stdin, timeoutMs });
  } else {
    result = {
      stdout: '',
      stderr: `Local execution for "${normalizedLanguage}" is not available yet. Try javascript, python, bash, c, or c++.`,
      code: 1,
      signal: null,
      time: 0,
      memory: 0,
    };
  }

  const data = toExecutionData({
    language: normalizedLanguage,
    stdout: result.stdout,
    stderr: result.stderr,
    code: result.code,
    signal: result.signal,
    time: result.time,
    memory: result.memory,
    version: 'local',
  });

  res.status(200).json({ success: true, data });
});
