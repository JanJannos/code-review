/**
 * Utility functions
 */
export function parseQuery(query: string): Record<string, string> {
  const params: Record<string, string> = {};
  query.split("&").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (k && v) params[k] = decodeURIComponent(v);
  });
  return params;
}
