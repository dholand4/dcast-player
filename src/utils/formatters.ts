export function formatSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num: number): string => (num < 10 ? `0${num}` : `${num}`);

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function calculatePercentage(current: number, duration: number): number {
  if (!duration || duration <= 0 || !current || current <= 0) {
    return 0;
  }
  const pct = (current / duration) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

export function formatExpirationDate(expDate?: string | null): string {
  if (!expDate || expDate === 'null' || expDate === '0') {
    return 'Plano Ilimitado';
  }
  const timestamp = Number(expDate);
  if (isNaN(timestamp) || timestamp <= 0) {
    return 'Plano Ilimitado';
  }
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (date < now) {
    return `Expirado em ${day}/${month}/${year}`;
  }
  return `Vence em ${day}/${month}/${year}`;
}

export function cleanSeriesTitle(title?: string): string {
  if (!title) return '';
  const match = title.search(/\s*[-–—]\s*(?:T(?:emporada)?|S(?:eason)?)\s*\d+/i);
  if (match !== -1) {
    const cleaned = title.substring(0, match).trim();
    if (cleaned.length > 0) {
      return cleaned;
    }
  }
  return title.trim();
}

export function cleanEpisodeDisplayTitle(title?: string): string {
  if (!title) return '';
  const base = cleanSeriesTitle(title);
  if (base === title.trim()) return title.trim();

  const rest = title.substring(base.length).replace(/^[\s\-–—:]+/, '').trim();
  if (!rest) return base;

  const segments = rest
    .split(/\s*[-–—]\s*(?=(?:T(?:emporada)?|S(?:eason)?)\s*\d+)/i)
    .filter(Boolean);
  if (segments.length === 0) return base;

  const lastSegment = segments[segments.length - 1].trim();
  return `${base} - ${lastSegment}`;
}

export function formatEpisodeTitle(
  seriesTitle?: string,
  seasonNum?: number | string,
  epNum?: number | string,
  epTitle?: string
): string {
  const baseSeries = cleanSeriesTitle(seriesTitle);
  const sNum = seasonNum !== undefined && seasonNum !== null ? String(seasonNum) : '1';
  const eNum = epNum !== undefined && epNum !== null ? String(epNum) : '1';

  let cleanEp = (epTitle || '').trim();
  if (baseSeries && cleanEp) {
    const escapedBase = baseSeries.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanEp = cleanEp.replace(new RegExp(`^${escapedBase}\\s*[-–—:]\\s*`, 'i'), '').trim();
  }

  cleanEp = cleanEp
    .replace(/^(?:T(?:emporada)?|S(?:eason)?)\s*\d+\s*(?:E(?:pis[oó]dio)?\s*\d+)?\s*[-–—:]\s*/i, '')
    .trim();

  if (cleanEp.includes(' - T') || cleanEp.includes(' - S')) {
    cleanEp = cleanEpisodeDisplayTitle(cleanEp);
    if (baseSeries) {
      const escapedBase = baseSeries.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleanEp = cleanEp.replace(new RegExp(`^${escapedBase}\\s*[-–—:]\\s*`, 'i'), '').trim();
    }
  }

  if (eNum && cleanEp) {
    cleanEp = cleanEp.replace(new RegExp(`^0*${eNum}\\s*[.:-]\\s*`, 'i'), '').trim();
  }

  const epSuffix = cleanEp && !/^T\d+E\d+$/i.test(cleanEp) ? `: ${cleanEp}` : '';
  return baseSeries ? `${baseSeries} - T${sNum}E${eNum}${epSuffix}` : `T${sNum}E${eNum}${epSuffix}`;
}


