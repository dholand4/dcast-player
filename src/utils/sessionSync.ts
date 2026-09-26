const claimedSyncs = new Set<string>();

/**
 * Garante que uma sincronização com a nuvem rode só uma vez por sessão do app,
 * mesmo quando várias telas montam o mesmo hook. Retorna true para quem deve executá-la.
 */
export function claimSessionSync(key: string): boolean {
  if (claimedSyncs.has(key)) return false;
  claimedSyncs.add(key);
  return true;
}

/** Libera a chave para tentar de novo (ex.: quando a sincronização falhou por rede). */
export function releaseSessionSync(key: string): void {
  claimedSyncs.delete(key);
}

export function resetSessionSyncs(): void {
  claimedSyncs.clear();
}
