export const OPERATIONAL_TIME_ZONE = 'Asia/Makassar';

export function getOperationalDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: OPERATIONAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function toTicketDateSegment(operationalDate: string): string {
  return operationalDate.replaceAll('-', '');
}

export function addOperationalDays(
  operationalDate: string,
  days: number,
): string {
  const date = new Date(`${operationalDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getOperationalUtcRange(operationalDate: string) {
  const start = new Date(`${operationalDate}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 86_400_000);
  return { start, end };
}
