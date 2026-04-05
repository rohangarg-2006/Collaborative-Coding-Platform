const RENDER_API_URL = 'https://collaborative-coding-platform-backend-h8dn.onrender.com/api/v1';
const LOCAL_API_URL = 'http://localhost:5000/api/v1';
const API_BASE_URL = import.meta.env.VITE_API_URL || RENDER_API_URL || LOCAL_API_URL;

const normalizeLanguage = (language) => {
  const safe = (language || 'javascript').toLowerCase();
  if (safe === 'cpp') return 'c++';
  if (safe === 'js') return 'javascript';
  if (safe === 'py') return 'python';
  return safe;
};

const parseErrorPayload = async (response) => {
  try {
    const data = await response.json();
    return data?.error || data?.message || data?.data?.message || JSON.stringify(data);
  } catch {
    try {
      return await response.text();
    } catch {
      return '';
    }
  }
};

const buildAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const executeCodeWithLocalRuntime = async (
  language,
  version = '*',
  sourceCode = '',
  options = {}
) => {
  const payload = {
    language: normalizeLanguage(language),
    version: version || '*',
    files: [{ content: sourceCode || '' }],
  };

  if (typeof options.stdin === 'string') payload.stdin = options.stdin;
  if (Array.isArray(options.args)) payload.args = options.args;
  if (typeof options.compile_timeout === 'number') payload.compile_timeout = options.compile_timeout;
  if (typeof options.run_timeout === 'number') payload.run_timeout = options.run_timeout;
  if (typeof options.compile_memory_limit === 'number') payload.compile_memory_limit = options.compile_memory_limit;
  if (typeof options.run_memory_limit === 'number') payload.run_memory_limit = options.run_memory_limit;

  const response = await fetch(`${API_BASE_URL}/execution/execute`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error('Unauthorized (401): Please login again.');
  }

  if (response.status === 429) {
    throw new Error('Rate Limited (429): Too many requests, please retry shortly.');
  }

  if (!response.ok) {
    const detail = await parseErrorPayload(response);
    throw new Error(`Execution failed (${response.status})${detail ? `: ${detail}` : ''}`);
  }

  const json = await response.json();
  const data = json?.data || {};
  const run = data?.run || {};

  return {
    language: data?.language || normalizeLanguage(language),
    version: data?.version || version || '*',
    stdout: run.stdout || '',
    stderr: run.stderr || '',
    run,
    compile: data?.compile || null,
    raw: data,
  };
};

export const executeCode = async (code, language, input = '') => {
  try {
    const result = await executeCodeWithLocalRuntime(language, '*', code || '', {
      stdin: input || '',
    });

    const run = result.run || {};

    return {
      output: result.stdout,
      error: result.stderr,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: typeof run.code === 'number' ? run.code : 0,
      executionTime: run.time || 0,
      memory: run.memory || 0,
      status:
        typeof run.code === 'number' && run.code !== 0
          ? { id: 4, description: 'Error' }
          : { id: 3, description: 'Completed' },
    };
  } catch (error) {
    const message = error?.message || 'Unable to execute code.';

    return {
      output: '',
      error: message,
      stdout: '',
      stderr: message,
      exitCode: 1,
      executionTime: 0,
      memory: 0,
      status: { id: 4, description: 'Error' },
    };
  }
};

