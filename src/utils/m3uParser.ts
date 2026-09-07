import { IAccountCredentials } from '../@types/xtream';

export function parseM3uUrl(url: string, label: string = 'Minha Lista'): IAccountCredentials | null {
  try {
    const trimmed = url.trim();
    if (!trimmed) {
      return null;
    }

    const parsedUrl = new URL(trimmed);
    const username = parsedUrl.searchParams.get('username') || parsedUrl.searchParams.get('user');
    const password = parsedUrl.searchParams.get('password') || parsedUrl.searchParams.get('pass');

    if (!username || !password) {
      return null;
    }

    // Protocol + Host + (Port if present)
    const serverUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

    return {
      serverUrl,
      username,
      password,
      label: label.trim() || 'Minha Lista',
    };
  } catch {
    return null;
  }
}
