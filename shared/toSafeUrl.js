const SAFE_PROTOCOLS = ['http:', 'https:'];

// Returns the normalized http(s) URL, or null for any other scheme
// (e.g. javascript:, data:) or an unparseable value.
export default function toSafeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = new URL(value, window.location.href);
    return SAFE_PROTOCOLS.includes(parsed.protocol) ? parsed.href : null;
  } catch (e) {
    return null;
  }
}
