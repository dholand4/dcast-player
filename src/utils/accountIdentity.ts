import { sha256 } from 'js-sha256';
import { IAccountCredentials } from '../@types/xtream';

export function normalizeHost(serverUrl?: string): string {
  if (!serverUrl) return 'default';
  return serverUrl
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .split(':')[0]
    .toLowerCase();
}

/**
 * Identificador local (não secreto) da conta, usado para separar no aparelho
 * os dados de cada lista IPTV. Não depende da senha, então sobrevive a trocas de senha.
 */
export function getAccountScope(account?: IAccountCredentials | null): string {
  if (!account?.username) return '';
  const username = account.username.trim().toLowerCase();
  return sha256(`${normalizeHost(account.serverUrl)}|${username}`).slice(0, 16);
}
