export async function createApiHeaders(hasBody: boolean) {
  const { getFirebaseIdToken } = await import('./firebase');
  const token = await getFirebaseIdToken();
  const headers = new Headers({
    Authorization: `Bearer ${token}`,
  });
  if (hasBody) headers.set('Content-Type', 'application/json');
  return headers;
}
