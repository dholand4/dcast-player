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

