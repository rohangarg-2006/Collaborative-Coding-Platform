const LOCAL_DEFAULT_ORIGIN = 'http://localhost:5173';

const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/+$/, '');

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
  return allowedOrigins.includes(normalized);
};

module.exports = {
  getAllowedOrigins,
  isOriginAllowed,
};
