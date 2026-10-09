// Tela cheia na Web (navegador e PWA instalado). O iPad antigo só conhece as versões
// com prefixo webkit; o iPhone não tem tela cheia de elemento, então ali nada acontece.

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function getDocument(): FullscreenDocument | null {
  return typeof document === 'undefined' ? null : (document as FullscreenDocument);
}

export function isWebFullscreen(): boolean {
  const doc = getDocument();
  if (!doc) return false;
  return !!(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

export function enterWebFullscreen(): void {
  const doc = getDocument();
  if (!doc || isWebFullscreen()) return;
  const el = doc.documentElement as FullscreenElement;
  try {
    // Sem um toque recente do usuário o navegador recusa; a promessa rejeitada é ignorada
    const result = el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.();
    Promise.resolve(result).catch(() => {});
  } catch {
    // ignore
  }
}

export function exitWebFullscreen(): void {
  const doc = getDocument();
  if (!doc || !isWebFullscreen()) return;
  try {
    const result = doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.();
    Promise.resolve(result).catch(() => {});
  } catch {
    // ignore
  }
}

export function toggleWebFullscreen(): void {
  if (isWebFullscreen()) exitWebFullscreen();
  else enterWebFullscreen();
}

/** Celular e tablet: tela de toque sem mouse (no computador a tela cheia fica no botão e na tecla F). */
export function isTouchOnlyWebDevice(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches;
}
