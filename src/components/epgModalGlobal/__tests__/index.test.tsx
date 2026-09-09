import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { theme } from '../../../constants/theme';
import { EpgModalGlobal } from '../index';
import { IEpgListing } from '../../../@types/xtream';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const mockEpgList: IEpgListing[] = [
  {
    id: '1',
    title: 'Jornal da Manhã',
    start: '2026-09-09 06:00:00',
    end: '2026-09-09 08:30:00',
    start_timestamp: 1788934800,
    stop_timestamp: 1788943800,
    description: 'Principais notícias do dia e do trânsito.',
    now_playing: 0,
    has_archive: 0,
  },
  {
    id: '2',
    title: 'Programa de Variedades',
    start: '2026-09-09 08:30:00',
    end: '2026-09-09 10:00:00',
    start_timestamp: 1788943800,
    stop_timestamp: 1788949200,
    description: 'Entrevistas, culinária e entretenimento.',
    now_playing: 1,
    has_archive: 0,
  },
];

describe('EpgModalGlobal', () => {
  it('renders modal with channel title and close button', () => {
    const onCloseMock = jest.fn();
    const { getByText, getByTestId } = wrap(
      <EpgModalGlobal
        visible={true}
        onClose={onCloseMock}
        channelName="Globo SP"
        channelNumber={5}
        initialEpgList={mockEpgList}
      />
    );

    expect(getByText('Globo SP')).toBeTruthy();
    expect(getByText(/Canal 5 • Guia de Programação/)).toBeTruthy();
    expect(getByTestId('epg-modal-close')).toBeTruthy();

    fireEvent.press(getByTestId('epg-modal-close'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('renders list of programs with titles', () => {
    const { getByText } = wrap(
      <EpgModalGlobal
        visible={true}
        onClose={jest.fn()}
        channelName="Globo SP"
        initialEpgList={mockEpgList}
      />
    );

    expect(getByText('Jornal da Manhã')).toBeTruthy();
    expect(getByText('Programa de Variedades')).toBeTruthy();
  });

  it('renders empty message when no epg is available', () => {
    const { getByText } = wrap(
      <EpgModalGlobal
        visible={true}
        onClose={jest.fn()}
        channelName="Canal Sem EPG"
        initialEpgList={[]}
      />
    );

    expect(
      getByText('Grade de programação não disponível para este canal no servidor.')
    ).toBeTruthy();
  });

  it('toggles program description expansion on press', () => {
    const { getByTestId, getByText } = wrap(
      <EpgModalGlobal
        visible={true}
        onClose={jest.fn()}
        channelName="Globo SP"
        initialEpgList={mockEpgList}
      />
    );

    const programItem = getByTestId('epg-item-0');
    expect(getByText('Principais notícias do dia e do trânsito.')).toBeTruthy();

    fireEvent.press(programItem);
    expect(getByText('Principais notícias do dia e do trânsito.')).toBeTruthy();
  });
});
