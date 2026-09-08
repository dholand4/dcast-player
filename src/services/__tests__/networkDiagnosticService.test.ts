import {
  networkDiagnosticService,
  classifyConnection,
} from '../networkDiagnosticService';
import { IAccountCredentials } from '../../@types/xtream';

const mockCreds: IAccountCredentials = {
  serverUrl: 'http://iptv.example.com:8080',
  username: 'testuser',
  password: 'testpassword',
  label: 'Test Server',
};

describe('networkDiagnosticService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('classifyConnection', () => {
    it('classifies as 4k when download speed >= 25Mbps and ping < 90ms', () => {
      const res = classifyConnection(35, 45, 10);
      expect(res.quality).toBe('4k');
      expect(res.qualityLabel).toContain('4K UHD');
    });

    it('classifies as fhd when download speed >= 10Mbps and ping < 160ms', () => {
      const res = classifyConnection(18, 110, 15);
      expect(res.quality).toBe('fhd');
      expect(res.qualityLabel).toContain('Full HD');
    });

    it('classifies as hd when download speed >= 5Mbps and ping < 250ms', () => {
      const res = classifyConnection(7, 210, 20);
      expect(res.quality).toBe('hd');
      expect(res.qualityLabel).toContain('HD 720p');
    });

    it('classifies as poor when speed is low or ping is too high', () => {
      const res = classifyConnection(3, 300, 50);
      expect(res.quality).toBe('poor');
      expect(res.qualityLabel).toContain('Instável');
      expect(res.tips.length).toBeGreaterThan(0);
    });

    it('adds tips when ping is high or jitter is high', () => {
      const res = classifyConnection(30, 180, 45);
      expect(res.tips.some((t) => t.includes('Latência alta'))).toBe(true);
      expect(res.tips.some((t) => t.includes('Oscilação'))).toBe(true);
    });
  });

  describe('measurePing', () => {
    it('measures average ping and jitter correctly', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          status: 200,
        };
      });

      const { pingMs, jitterMs } = await networkDiagnosticService.measurePing(mockCreds, 3);
      expect(callCount).toBe(3);
      expect(pingMs).toBeGreaterThanOrEqual(0);
      expect(jitterMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('measureDownloadSpeed', () => {
    it('computes download speed based on blob size when getReader is not available', async () => {
      const fakeBlob = { size: 1024 * 1024 * 2 }; // 2 MB
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: async () => fakeBlob,
      });

      const speed = await networkDiagnosticService.measureDownloadSpeed(mockCreds);
      expect(speed).toBeGreaterThan(0);
    });
  });

  describe('runFullDiagnostic', () => {
    it('orchestrates full diagnostic with progress updates', async () => {
      const progressSteps: string[] = [];
      const fakeBlob = { size: 1024 * 1024 * 4 }; // 4 MB

      global.fetch = jest.fn().mockImplementation(async () => {
        return {
          ok: true,
          status: 200,
          blob: async () => fakeBlob,
        };
      });

      const result = await networkDiagnosticService.runFullDiagnostic(mockCreds, (p) => {
        progressSteps.push(p.step);
      });

      expect(progressSteps).toContain('ping');
      expect(progressSteps).toContain('download');
      expect(progressSteps).toContain('done');
      expect(result.pingMs).toBeGreaterThanOrEqual(0);
      expect(result.downloadSpeedMbps).toBeGreaterThanOrEqual(0);
      expect(result.quality).toBeDefined();
    });
  });
});
