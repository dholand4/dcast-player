import Hls from 'hls.js';

// Empacotado junto com o app em vez de carregado de um CDN
export function getHls(): typeof Hls {
  return Hls;
}
