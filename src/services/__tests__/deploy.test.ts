/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';

describe('deploy/cloud-init.sh', () => {
  it('tem só caracteres ASCII (o console da Oracle envia em Latin-1 e o cloud-init descarta o script)', () => {
    const script = fs.readFileSync(path.join(__dirname, '../../../deploy/cloud-init.sh'), 'utf8');
    const linhasComAcento = script
      .split('\n')
      .map((linha, index) => ({ linha, numero: index + 1 }))
      .filter(({ linha }) => /[^\x00-\x7F]/.test(linha))
      .map(({ numero }) => numero);

    expect(linhasComAcento).toEqual([]);
  });
});
