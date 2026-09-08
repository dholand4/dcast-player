import { resolveUrlForPlatform } from './xtreamService';

const prefetchedUrls = new Set<string>();
const inFlightRequests = new Map<string, AbortController>();

export const prefetchService = {
  isPrefetched(url: string): boolean {
    if (!url) return false;
    return prefetchedUrls.has(url);
  },

  clearPrefetchCache(): void {
    inFlightRequests.forEach((ctrl) => ctrl.abort());
    inFlightRequests.clear();
    prefetchedUrls.clear();
  },

  async prefetchVod(streamUrl: string, rangeBytes: number = 2 * 1024 * 1024): Promise<boolean> {
    if (!streamUrl || typeof streamUrl !== 'string') return false;
    const cleanUrl = streamUrl.trim();
    if (!cleanUrl) return false;

    // Se já foi feito pré-carregamento para esta URL, não repetir
    if (prefetchedUrls.has(cleanUrl) || inFlightRequests.has(cleanUrl)) {
      return true;
    }

    const controller = new AbortController();
    inFlightRequests.set(cleanUrl, controller);

    const timeoutId = setTimeout(() => {
      controller.abort();
      inFlightRequests.delete(cleanUrl);
    }, 6000);

    try {
      const targetUrl = resolveUrlForPlatform(cleanUrl);
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Range: `bytes=0-${rangeBytes - 1}`,
          'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        },
        signal: controller.signal,
      });

      // Ler o stream se disponível para preencher os buffers de rede do dispositivo
      if (res.ok || res.status === 206 || res.status === 200) {
        if (res.body && typeof res.body.getReader === 'function') {
          const reader = res.body.getReader();
          try {
            await reader.read();
          } finally {
            reader.releaseLock?.();
          }
        } else if (typeof res.blob === 'function') {
          await res.blob();
        }
        prefetchedUrls.add(cleanUrl);
        return true;
      }
      return false;
    } catch {
      // Ignorar erros silenciosamente para não afetar a experiência do usuário
      return false;
    } finally {
      clearTimeout(timeoutId);
      inFlightRequests.delete(cleanUrl);
    }
  },
};
