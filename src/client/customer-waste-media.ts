export async function loadCustomerWasteMedia(
  mediaIds: string[] | undefined,
): Promise<string[]> {
  if (
    import.meta.env.VITE_USE_DEMO_DATA !== 'false' ||
    !mediaIds ||
    mediaIds.length === 0
  ) {
    return [];
  }
  const [{ doc, getDoc }, { db }] = await Promise.all([
    import('firebase/firestore'),
    import('./firebase'),
  ]);
  return Promise.all(
    mediaIds.map(async (mediaId) => {
      const media = await getDoc(doc(db, 'customerWasteMedia', mediaId));
      const dataUrl = media.data()?.dataUrl;
      if (typeof dataUrl !== 'string') {
        throw new Error('Foto sampah tidak ditemukan.');
      }
      return dataUrl;
    }),
  );
}
