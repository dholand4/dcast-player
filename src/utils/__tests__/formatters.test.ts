import {
  formatSeconds,
  calculatePercentage,
  formatExpirationDate,
  cleanSeriesTitle,
  cleanEpisodeDisplayTitle,
  formatEpisodeTitle,
} from '../formatters';

describe('formatters', () => {
  describe('formatSeconds', () => {
    it('formats seconds to MM:SS', () => {
      expect(formatSeconds(65)).toBe('01:05');
      expect(formatSeconds(0)).toBe('00:00');
    });

    it('formats seconds to HH:MM:SS when >= 3600', () => {
      expect(formatSeconds(3665)).toBe('01:01:05');
    });

    it('handles negative or invalid values', () => {
      expect(formatSeconds(-10)).toBe('00:00');
      expect(formatSeconds(NaN)).toBe('00:00');
    });
  });

  describe('calculatePercentage', () => {
    it('calculates correct rounded percentage', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(1, 3)).toBe(33);
    });

    it('clamps between 0 and 100', () => {
      expect(calculatePercentage(150, 100)).toBe(100);
      expect(calculatePercentage(-10, 100)).toBe(0);
      expect(calculatePercentage(10, 0)).toBe(0);
    });
  });

  describe('formatExpirationDate', () => {
    it('returns Plano Ilimitado when empty or 0', () => {
      expect(formatExpirationDate(null)).toBe('Plano Ilimitado');
      expect(formatExpirationDate('0')).toBe('Plano Ilimitado');
      expect(formatExpirationDate('null')).toBe('Plano Ilimitado');
    });
  });

  describe('cleanSeriesTitle', () => {
    it('extracts base series name from clean string', () => {
      expect(cleanSeriesTitle('Origem')).toBe('Origem');
      expect(cleanSeriesTitle('Breaking Bad')).toBe('Breaking Bad');
    });

    it('strips - T1E4 and episode details', () => {
      expect(cleanSeriesTitle('Origem - T1E4: Uma pedra e uma arvore distante')).toBe('Origem');
      expect(cleanSeriesTitle('Origem - T1E4 - Uma pedra e uma arvore distante')).toBe('Origem');
      expect(cleanSeriesTitle('Origem - S01E04: Uma pedra e uma arvore distante')).toBe('Origem');
      expect(cleanSeriesTitle('Origem - Temporada 1 - Episódio 4')).toBe('Origem');
    });

    it('strips repeated duplicate episode tags', () => {
      expect(
        cleanSeriesTitle(
          'Origem - T1E4 - uma pedra e uma arvore distante - T1E4 - uma pedra e uma arvore distante - T1E4 - uma pedra e uma arvore distante'
        )
      ).toBe('Origem');
    });

    it('preserves titles with hyphens that are part of the show name', () => {
      expect(cleanSeriesTitle('Spider-Man: The Animated Series')).toBe(
        'Spider-Man: The Animated Series'
      );
      expect(cleanSeriesTitle('Star Trek - Strange New Worlds')).toBe(
        'Star Trek - Strange New Worlds'
      );
      expect(cleanSeriesTitle('X-Men 97')).toBe('X-Men 97');
    });

    it('handles empty or undefined values', () => {
      expect(cleanSeriesTitle('')).toBe('');
      expect(cleanSeriesTitle(undefined)).toBe('');
    });
  });

  describe('cleanEpisodeDisplayTitle', () => {
    it('returns base title if no episode tag present', () => {
      expect(cleanEpisodeDisplayTitle('Origem')).toBe('Origem');
      expect(cleanEpisodeDisplayTitle('Spider-Man: The Animated Series')).toBe(
        'Spider-Man: The Animated Series'
      );
    });

    it('returns single episode format unmodified when not duplicated', () => {
      expect(cleanEpisodeDisplayTitle('Origem - T1E4: Uma pedra e uma arvore distante')).toBe(
        'Origem - T1E4: Uma pedra e uma arvore distante'
      );
    });

    it('deduplicates titles that repeated 2x, 3x, or 4x', () => {
      expect(
        cleanEpisodeDisplayTitle(
          'Origem - T1E4 - uma pedra e uma arvore distante - T1E4 - uma pedra e uma arvore distante'
        )
      ).toBe('Origem - T1E4 - uma pedra e uma arvore distante');

      expect(
        cleanEpisodeDisplayTitle(
          'Origem - T1E4: Uma pedra e uma arvore distante - T1E4: Uma pedra e uma arvore distante - T1E4: Uma pedra e uma arvore distante - T1E4: Uma pedra e uma arvore distante'
        )
      ).toBe('Origem - T1E4: Uma pedra e uma arvore distante');
    });

    it('keeps the active/last episode when navigating from Ep 3 to Ep 4', () => {
      expect(
        cleanEpisodeDisplayTitle(
          'Origem - T1E3: Episodio 3 - T1E4: Uma pedra e uma arvore distante'
        )
      ).toBe('Origem - T1E4: Uma pedra e uma arvore distante');
    });
  });

  describe('formatEpisodeTitle', () => {
    it('formats clean episode title', () => {
      expect(formatEpisodeTitle('Origem', 1, 4, 'Uma pedra e uma arvore distante')).toBe(
        'Origem - T1E4: Uma pedra e uma arvore distante'
      );
    });

    it('cleans corrupted or duplicated seriesTitle inputs', () => {
      expect(
        formatEpisodeTitle(
          'Origem - T1E4: Uma pedra e uma arvore distante - T1E4: Uma pedra e uma arvore distante',
          1,
          4,
          'Uma pedra e uma arvore distante'
        )
      ).toBe('Origem - T1E4: Uma pedra e uma arvore distante');
    });

    it('cleans already formatted epTitle without duplicating', () => {
      expect(
        formatEpisodeTitle(
          'Origem',
          1,
          4,
          'Origem - T1E4: Uma pedra e uma arvore distante'
        )
      ).toBe('Origem - T1E4: Uma pedra e uma arvore distante');
    });

    it('removes redundant number prefixes from episode title', () => {
      expect(formatEpisodeTitle('Origem', 1, 4, '4. Uma pedra e uma arvore distante')).toBe(
        'Origem - T1E4: Uma pedra e uma arvore distante'
      );
      expect(formatEpisodeTitle('Origem', 1, 4, '04 - Uma pedra e uma arvore distante')).toBe(
        'Origem - T1E4: Uma pedra e uma arvore distante'
      );
    });

    it('formats gracefully when epTitle is missing', () => {
      expect(formatEpisodeTitle('Origem', 1, 4)).toBe('Origem - T1E4');
    });
  });
});
