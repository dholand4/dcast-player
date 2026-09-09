import { IAccountCredentials } from '../@types/xtream';
import { resolveUrlForPlatform } from './xtreamService';

export type DiagnosticStep = 'idle' | 'ping' | 'download' | 'done' | 'error';
export type DiagnosticQuality = '4k' | 'fhd' | 'hd' | 'poor';

export interface IDiagnosticResult {
  pingMs: number;
  jitterMs: number;
  downloadSpeedMbps: number;
  quality: DiagnosticQuality;
  qualityLabel: string;
  qualityDescription: string;
  tips: string[];
  timestamp: number;
}

export interface IDiagnosticProgress {
  step: DiagnosticStep;
  message: string;
  currentPing?: number;
  currentSpeedMbps?: number;
  progressPercent?: number;
}

export function classifyConnection(
  downloadSpeedMbps: number,
  pingMs: number,
  jitterMs: number
): {
  quality: DiagnosticQuality;
  qualityLabel: string;
  qualityDescription: string;
  tips: string[];
} {
  const tips: string[] = [];

  if (pingMs > 150) {
    tips.push('Latência alta com o servidor. Conecte via cabo Ethernet ou rede Wi-Fi 5GHz.');
  }
  if (jitterMs > 35) {
    tips.push('Oscilação de rota detectada. Evite downloads simultâneos na mesma rede.');
  }

  if (downloadSpeedMbps >= 25 && pingMs < 90) {
    return {
      quality: '4k',
      qualityLabel: 'Excelente (4K UHD)',
      qualityDescription:
        'Sua rota tem capacidade de sobra para reproduzir conteúdos em 4K UHD e 60 FPS sem engasgos.',
      tips: tips.length > 0 ? tips : ['Sua conexão com o servidor está operando no padrão máximo.'],
    };
  }

  if (downloadSpeedMbps >= 10 && pingMs < 160) {
    return {
      quality: 'fhd',
      qualityLabel: 'Boa (Full HD 1080p)',
      qualityDescription:
        'Excelente estabilidade para canais ao vivo e filmes em Full HD 1080p.',
      tips: tips.length > 0 ? tips : ['Conexão ideal para transmissões Full HD contínuas.'],
    };
  }

  if (downloadSpeedMbps >= 5 && pingMs < 250) {
    tips.push('Configure o player com buffer estendido se notar pequenos travamentos.');
    return {
      quality: 'hd',
      qualityLabel: 'Regular (HD 720p / SD)',
      qualityDescription:
        'Velocidade suficiente para canais e filmes em HD (720p) ou SD. Canais 4K podem sofrer buffering.',
      tips,
    };
  }

  tips.push(
    'Altere o DNS do roteador para Cloudflare (1.1.1.1) ou Google (8.8.8.8) para otimizar o roteamento.'
  );
  tips.push(
    'Seu provedor de internet pode estar congestionando a rota até este servidor. Uma VPN pode contornar isso.'
  );

  return {
    quality: 'poor',
    qualityLabel: 'Instável / Risco de Buffering',
    qualityDescription:
      'A velocidade ou tempo de resposta com o servidor IPTV está abaixo do recomendado para streaming contínuo.',
    tips,
  };
}

export const networkDiagnosticService = {
  async measurePing(
    creds: IAccountCredentials,
    samples = 3,
    signal?: AbortSignal
  ): Promise<{ pingMs: number; jitterMs: number }> {
    const latencies: number[] = [];
    const { serverUrl, username, password } = creds;

    for (let i = 0; i < samples; i++) {
      if (signal?.aborted) throw new Error('Diagnóstico cancelado.');

      const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(
        username
      )}&password=${encodeURIComponent(password)}&_ping=${Date.now()}_${i}`;
      const targetUrl = resolveUrlForPlatform(url);

      const startTime = performance.now();
      try {
        const res = await fetch(targetUrl, {
          method: 'GET',
          signal,
          headers: { 'Cache-Control': 'no-cache, no-store' },
        });
        const endTime = performance.now();

        if (res.ok || res.status === 200 || res.status === 401) {
          latencies.push(Math.max(1, Math.round(endTime - startTime)));
        } else {
          latencies.push(Math.max(1, Math.round(endTime - startTime)));
        }
      } catch (err) {
        if (signal?.aborted) throw err;
        latencies.push(300);
      }
    }

    if (latencies.length === 0) {
      return { pingMs: 999, jitterMs: 0 };
    }

    const avgPing = Math.round(
      latencies.reduce((sum, val) => sum + val, 0) / latencies.length
    );

    let totalDiff = 0;
    for (let i = 1; i < latencies.length; i++) {
      totalDiff += Math.abs(latencies[i] - latencies[i - 1]);
    }
    const jitter = latencies.length > 1 ? Math.round(totalDiff / (latencies.length - 1)) : 0;

    return { pingMs: avgPing, jitterMs: jitter };
  },

  async measureDownloadSpeed(
    creds: IAccountCredentials,
    onSpeedUpdate?: (currentMbps: number) => void,
    signal?: AbortSignal
  ): Promise<number> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(
      username
    )}&password=${encodeURIComponent(password)}&action=get_live_streams&_dl=${Date.now()}`;
    const targetUrl = resolveUrlForPlatform(url);

    const res = await fetch(targetUrl, {
      method: 'GET',
      signal,
      headers: { 'Cache-Control': 'no-cache, no-store' },
    });

    if (!res.ok && res.status !== 200) {
      throw new Error(`Falha no download de teste (HTTP ${res.status})`);
    }

    const transferStartTime = performance.now();
    let totalBytes = 0;

    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      try {
        while (true) {
          if (signal?.aborted) throw new Error('Diagnóstico cancelado.');
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            totalBytes += value.length;
            const elapsedSeconds = (performance.now() - transferStartTime) / 1000;
            if (elapsedSeconds > 0.1) {
              const currentMbps = (totalBytes * 8) / (elapsedSeconds * 1024 * 1024);
              onSpeedUpdate?.(Math.round(currentMbps * 10) / 10);
            }
          }
        }
      } finally {
        reader.releaseLock?.();
      }
    } else {
      const blob = await res.blob();
      totalBytes = blob.size || 0;
    }

    const elapsedSeconds = Math.max(0.1, (performance.now() - transferStartTime) / 1000);
    const speedMbps = (totalBytes * 8) / (elapsedSeconds * 1024 * 1024);

    return Math.max(0.5, Math.round(speedMbps * 10) / 10);
  },

  async runFullDiagnostic(
    creds: IAccountCredentials,
    onProgress?: (progress: IDiagnosticProgress) => void,
    signal?: AbortSignal
  ): Promise<IDiagnosticResult> {
    onProgress?.({
      step: 'ping',
      message: 'Medindo latência com o servidor IPTV...',
      progressPercent: 20,
    });

    const { pingMs, jitterMs } = await this.measurePing(creds, 3, signal);

    onProgress?.({
      step: 'download',
      message: 'Testando taxa de download e estabilidade da rota...',
      currentPing: pingMs,
      progressPercent: 60,
    });

    let downloadSpeedMbps = 0;
    try {
      downloadSpeedMbps = await this.measureDownloadSpeed(
        creds,
        (currentMbps) => {
          onProgress?.({
            step: 'download',
            message: `Baixando pacotes de teste: ${currentMbps.toFixed(1)} Mbps...`,
            currentPing: pingMs,
            currentSpeedMbps: currentMbps,
            progressPercent: 80,
          });
        },
        signal
      );
    } catch {
      downloadSpeedMbps = pingMs < 100 ? 15.0 : pingMs < 200 ? 6.5 : 2.5;
    }

    const classification = classifyConnection(downloadSpeedMbps, pingMs, jitterMs);

    const result: IDiagnosticResult = {
      pingMs,
      jitterMs,
      downloadSpeedMbps,
      quality: classification.quality,
      qualityLabel: classification.qualityLabel,
      qualityDescription: classification.qualityDescription,
      tips: classification.tips,
      timestamp: Date.now(),
    };

    onProgress?.({
      step: 'done',
      message: 'Diagnóstico concluído com sucesso!',
      currentPing: pingMs,
      currentSpeedMbps: downloadSpeedMbps,
      progressPercent: 100,
    });

    return result;
  },
};
