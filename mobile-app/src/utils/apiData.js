/**
 * Normalizes Django REST Framework list responses (paginated or plain array).
 */
export function parseApiList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

export async function parseApiListResponse(response) {
  if (!response?.ok) return [];
  try {
    const data = await response.json();
    return parseApiList(data);
  } catch (_) {
    return [];
  }
}
