const LOCAL_DEFAULT_ORIGIN = 'http://localhost:5173';

const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/+$/, '');

const isRenderOrigin = (origin) => {
  try {
    const host = new URL(origin).hostname;
    return host.endsWith('.onrender.com');
  } catch {
    return false;
  }
};

const getAllowedOrigins = () => {
  const raw = process.env.CLIENT_URL || LOCAL_DEFAULT_ORIGIN;

  return raw
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
};

const isOriginAllowed = (origin, allowedOrigins) => {
  // Allow non-browser requests (no Origin header), such as health checks and server-to-server calls.
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);

  // In hosted deployments, accept Render frontend domains by default.
  if (isRenderOrigin(normalized)) {
    return true;
  }

  return allowedOrigins.includes(normalized);
};

module.exports = {
  getAllowedOrigins,
  isOriginAllowed,
};
