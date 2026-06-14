import { readFile, writeFile } from 'node:fs/promises';

export async function readEnvFile(path) {
  const values = {};
  const content = await readFile(path, 'utf8');

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    values[key] = value;
  }

  return values;
}

export async function updateEnvFile(path, updates) {
  const content = await readFile(path, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  const remaining = new Map(Object.entries(updates));
  const lines = content.split(/\r?\n/u).map((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return rawLine;
    const separator = line.indexOf('=');
    if (separator < 1) return rawLine;
    const key = line.slice(0, separator).trim();
    if (!remaining.has(key)) return rawLine;
    const value = remaining.get(key);
    remaining.delete(key);
    return `${key}=${value}`;
  });

  if (remaining.size > 0) {
    if (lines.length > 0 && lines.at(-1) !== '') lines.push('');
    for (const [key, value] of remaining) {
      lines.push(`${key}=${value}`);
    }
  }
  await writeFile(path, lines.join(newline), 'utf8');
}
