export async function stableIdentifier(
  namespace: string,
  value: string,
): Promise<string> {
  const input = new TextEncoder().encode(`${namespace}:${value}`);
  const digest = await crypto.subtle.digest('SHA-256', input);
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return `${namespace}_${hex.slice(0, 32)}`;
}

export function formatTicketCode(dateSegment: string, sequence: number): string {
  if (!/^\d{8}$/.test(dateSegment)) {
    throw new Error('Ticket date segment harus berformat YYYYMMDD.');
  }

  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 9999) {
    throw new Error('Nomor urut tiket harus berada pada rentang 1-9999.');
  }

  return `JSP-${dateSegment}-${sequence.toString().padStart(4, '0')}`;
}
